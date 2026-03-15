const db = require('../config/db');

class Transaction {
	constructor(data) {
		this.transaction_id = data.transaction_id;
		this.trip_id = data.trip_id;
		this.operator_id = data.operator_id;
		this.fare_amount = data.fare_amount;
		this.transaction_time = data.transaction_time || data.created_at || data.createdAt || data.transaction_date || data.date || data.timestamp || null;
	}

	static async getColumnInfo() {
		return new Promise((resolve, reject) => {
			const query = 'SHOW COLUMNS FROM Transaction';
			db.query(query, (err, results) => {
				if (err) return reject(err);

				const columns = new Set(results.map((row) => row.Field));
				const requiredColumns = ['operator_id', 'fare_amount'];
				const missingRequired = requiredColumns.filter((column) => !columns.has(column));

				const preferredOrder = [
					'transaction_time',
					'created_at',
					'createdAt',
					'transaction_date',
					'date',
					'timestamp'
				];

				const timestampColumn = preferredOrder.find((field) => columns.has(field)) || null;

				resolve({
					missingRequired,
					timestampColumn
				});
			});
		});
	}

	static async getTripTimeColumn() {
		return new Promise((resolve, reject) => {
			const query = 'SHOW COLUMNS FROM Trip';
			db.query(query, (err, results) => {
				if (err) return reject(err);

				const columns = new Set(results.map((row) => row.Field));
				const preferredOrder = ['end_time', 'updated_at', 'start_time'];
				const tripTimeColumn = preferredOrder.find((field) => columns.has(field)) || null;

				resolve(tripTimeColumn);
			});
		});
	}

	static async getTimeFilterConfig() {
		const columnInfo = await Transaction.getColumnInfo();
		const tripTimeColumn = await Transaction.getTripTimeColumn();

		if (columnInfo.timestampColumn) {
			return {
				dateExpression: `DATE(t.${columnInfo.timestampColumn})`,
				canFilterByDate: true,
				timeSource: `Transaction.${columnInfo.timestampColumn}`
			};
		}

		if (tripTimeColumn) {
			return {
				dateExpression: `DATE(tr.${tripTimeColumn})`,
				canFilterByDate: true,
				timeSource: `Trip.${tripTimeColumn}`
			};
		}

		return {
			dateExpression: null,
			canFilterByDate: false,
			timeSource: null
		};
	}

	static async detectTimestampColumn() {
		const columnInfo = await Transaction.getColumnInfo();
		return columnInfo.timestampColumn;
	}

	static async getOperatorEarningsSummary(operatorId, fromDate, toDate) {
		const columnInfo = await Transaction.getColumnInfo();

		if (columnInfo.missingRequired.length > 0) {
			throw new Error(`MISSING_TRANSACTION_COLUMNS:${columnInfo.missingRequired.join(',')}`);
		}

		const timeFilterConfig = await Transaction.getTimeFilterConfig();
		const whereParts = ['t.operator_id = ?'];
		const params = [operatorId];

		if (timeFilterConfig.canFilterByDate && fromDate) {
			whereParts.push(`${timeFilterConfig.dateExpression} >= ?`);
			params.push(fromDate);
		}
		if (timeFilterConfig.canFilterByDate && toDate) {
			whereParts.push(`${timeFilterConfig.dateExpression} <= ?`);
			params.push(toDate);
		}

		const whereClause = whereParts.join(' AND ');
		const totalsQuery = `
			SELECT
				COALESCE(SUM(fare_amount), 0) AS total_earnings,
				COUNT(*) AS total_transactions,
				COALESCE(AVG(fare_amount), 0) AS average_fare
			FROM Transaction t
			LEFT JOIN Trip tr ON tr.trip_id = t.trip_id
			WHERE ${whereClause}
		`;

		const totals = await new Promise((resolve, reject) => {
			db.query(totalsQuery, params, (err, results) => {
				if (err) return reject(err);
				resolve(results[0]);
			});
		});

		if (!timeFilterConfig.canFilterByDate) {
			return {
				totals,
				dailyBreakdown: [],
				tableRows: [],
				timestampColumn: null,
				timeSource: null
			};
		}

		const dailyQuery = `
			SELECT
				DATE_FORMAT(${timeFilterConfig.dateExpression}, '%Y-%m-%d') AS date,
				COALESCE(SUM(fare_amount), 0) AS earnings,
				COUNT(*) AS transactions
			FROM Transaction t
			LEFT JOIN Trip tr ON tr.trip_id = t.trip_id
			WHERE ${whereClause}
			GROUP BY DATE_FORMAT(${timeFilterConfig.dateExpression}, '%Y-%m-%d')
			ORDER BY DATE_FORMAT(${timeFilterConfig.dateExpression}, '%Y-%m-%d') DESC
		`;

		const dailyBreakdown = await new Promise((resolve, reject) => {
			db.query(dailyQuery, params, (err, results) => {
				if (err) return reject(err);
				resolve(results);
			});
		});

		const tableQuery = `
			SELECT
				DATE_FORMAT(${timeFilterConfig.dateExpression}, '%Y-%m-%d') AS date,
				COALESCE(b.registration_number, 'N/A') AS bus,
				COALESCE(r.route_code, CONCAT(r.start_location, ' - ', r.end_location), 'N/A') AS route,
				COUNT(*) AS trips_count,
				COALESCE(SUM(t.fare_amount), 0) AS total_fares
			FROM Transaction t
			LEFT JOIN Trip tr ON tr.trip_id = t.trip_id
			LEFT JOIN Bus b ON b.bus_id = tr.bus_id
			LEFT JOIN Route r ON r.route_id = b.route_id
			WHERE ${whereClause}
			GROUP BY DATE_FORMAT(${timeFilterConfig.dateExpression}, '%Y-%m-%d'), bus, route
			ORDER BY DATE_FORMAT(${timeFilterConfig.dateExpression}, '%Y-%m-%d') DESC, bus ASC
		`;

		const tableRows = await new Promise((resolve, reject) => {
			db.query(tableQuery, params, (err, results) => {
				if (err) return reject(err);
				resolve(results);
			});
		});

		return {
			totals,
			dailyBreakdown,
			tableRows,
			timestampColumn: columnInfo.timestampColumn,
			timeSource: timeFilterConfig.timeSource
		};
	}
}

module.exports = Transaction;
