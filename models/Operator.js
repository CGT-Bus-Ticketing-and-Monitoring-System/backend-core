const db = require('../config/db');

class Operator {
    constructor(data) {
        this.operator_id = data.operator_id;
        this.fname = data.fname;
        this.lname = data.lname;
        this.username = data.username;
        this.email = data.email;
        this.phone = data.phone;
        this.status = data.status;
        this.no_of_buses = data.no_of_buses || 0;
    }

    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM Operator WHERE username = ?`;
            db.query(query, [username], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]); 
            });
        });
    }

    static findById(operatorId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM Operator WHERE operator_id = ?';
            db.query(query, [operatorId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT o.operator_id, o.fname, o.lname, o.username, o.email, o.phone, o.status,
                (SELECT COUNT(*) FROM Bus b WHERE b.operator_id = o.operator_id AND b.status = 'ACTIVE') AS no_of_buses
                FROM Operator o
                ORDER BY o.operator_id DESC
            `;

            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results.map(row => new Operator(row)));
            });
        });
    }

    static create(data) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO Operator (fname, lname, username, email, phone, password_hash)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const params = [data.fname, data.lname, data.username, data.email, data.phone, data.password_hash];

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.insertId);
            });
        });
    }

    static update(id, data) {
        return new Promise((resolve, reject) => {
            let query = `UPDATE Operator SET fname = ?, lname = ?, username = ?, email = ?, phone = ?`;
            let params = [data.fname, data.lname, data.username, data.email, data.phone];

            if (data.password_hash) {
                query += `, password_hash = ?`;
                params.push(data.password_hash);
            }

            query += ` WHERE operator_id = ?`;
            params.push(id);

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE Operator SET status = ? WHERE operator_id = ?`;
            db.query(query, [status, id], (err, results) => {
                if (err) return reject(err);
                resolve(true); 
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM Operator WHERE operator_id = ?`;
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static findBusesByOperator(operatorId) {
        return new Promise((resolve, reject) => {
           const query = `
            SELECT 
                b.*,
                r.route_code AS route 
            FROM Bus b
            LEFT JOIN Route r ON b.route_id = r.route_id 
            WHERE operator_id = ?`;
            
            db.query(query, [operatorId], (err, results) => {
                if (err) return reject(err);
                resolve(results); 
            });
        });
    }

    static createBus(busData) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO Bus (bus_name, model, registration_number, capacity, operator_id, status) VALUES (?, ?, ?, ?, ?, ?)`;
            const values = [
                busData.bus_name, 
                busData.model, 
                busData.registration_number, 
                busData.capacity, 
                busData.operator_id, 
                busData.status || 'ACTIVE'
            ];

            db.query(query, values, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    static deleteBus(busId) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM Bus WHERE bus_id = ?`; 
            db.query(query, [busId], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

      // Update Profile & Password
      static updateProfile(id, data) {
        return new Promise((resolve, reject) => {
            let query = 'UPDATE `Operator` SET fname = ?, lname = ?, email = ?, phone = ?';
            let params = [data.fname, data.lname, data.email, data.phone];

             // adding new password hash to server
             if (data.password_hash) {
                query += ', password_hash = ?';
                params.push(data.password_hash);
            }

            query += ' WHERE operator_id = ?';
            params.push(id);

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    // Dashboard-Operator
    static async getDashboardStats(operatorId, timeRange = '30days') {
        return new Promise((resolve, reject) => {
            

            let dateCondition = 't.start_time >= (CURDATE() - INTERVAL 29 DAY) AND t.start_time < (CURDATE() + INTERVAL 1 DAY)';
            
            if (timeRange === 'today') {

                dateCondition = 't.start_time >= CURDATE() AND t.start_time < (CURDATE() + INTERVAL 1 DAY)';
            } else if (timeRange === '7days') {

                dateCondition = 't.start_time >= (CURDATE() - INTERVAL 6 DAY) AND t.start_time < (CURDATE() + INTERVAL 1 DAY)';
            }

            const busQuery = `
                SELECT 
                    COUNT(*) as total_buses,
                    COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) as active_buses,
                    COALESCE(SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END), 0) as inactive_buses
                FROM \`Bus\` WHERE operator_id = ?
            `;


            const earningsQuery = `
                SELECT COALESCE(SUM(tr.fare_amount), 0) as today_earnings 
                FROM \`Trip\` t
                JOIN \`Bus\` b ON t.bus_id = b.bus_id
                JOIN \`Transaction\` tr ON t.trip_id = tr.trip_id
                WHERE b.operator_id = ? AND ${dateCondition}
            `;

            const activityQuery = `
                SELECT 
                    b.registration_number, 
                    COALESCE(r.route_code, 'N/A') as route_code, 
                    b.status, 
                    COALESCE(SUM(tr.fare_amount), 0) as earned
                FROM \`Bus\` b
                LEFT JOIN \`Route\` r ON b.route_id = r.route_id
                LEFT JOIN \`Trip\` t ON b.bus_id = t.bus_id AND ${dateCondition}
                LEFT JOIN \`Transaction\` tr ON t.trip_id = tr.trip_id
                WHERE b.operator_id = ?
                GROUP BY b.bus_id, b.registration_number, r.route_code, b.status
                ORDER BY earned DESC
            `;

            const nameQuery = `SELECT fname FROM \`Operator\` WHERE operator_id = ?`;

            const chartQuery = `
                SELECT DATE(t.start_time) as date, b.registration_number as bus_no, COUNT(t.trip_id) as passengers
                FROM \`Trip\` t
                JOIN \`Bus\` b ON t.bus_id = b.bus_id
                WHERE b.operator_id = ? AND ${dateCondition}
                GROUP BY DATE(t.start_time), b.registration_number
                ORDER BY date ASC
            `;

            Promise.all([
                new Promise((res, rej) => db.query(busQuery, [operatorId], (err, results) => err ? rej(err) : res(results[0]))),
                new Promise((res, rej) => db.query(earningsQuery, [operatorId], (err, results) => err ? rej(err) : res(results[0]))),
                new Promise((res, rej) => db.query(nameQuery, [operatorId], (err, results) => err ? rej(err) : res(results[0]))),
                new Promise((res, rej) => db.query(chartQuery, [operatorId], (err, results) => err ? rej(err) : res(results))),
                new Promise((res, rej) => db.query(activityQuery, [operatorId], (err, results) => err ? rej(err) : res(results)))
            ])
            .then(([busStats, earnings, operatorData, chartData, activityData]) => {
                resolve({
                    total_buses: busStats?.total_buses || 0,
                    active_buses: busStats?.active_buses || 0,
                    inactive_buses: busStats?.inactive_buses || 0,
                    today_earnings: earnings?.today_earnings || 0,
                    fname: operatorData?.fname || '',
                    chart_data: chartData || [],
                    recent_activity: activityData || []
                });
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

module.exports = Operator;