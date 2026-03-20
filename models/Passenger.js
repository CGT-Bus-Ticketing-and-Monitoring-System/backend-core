const db = require('../config/db');

class Passenger {
    constructor(data) {
        this.passenger_id = data.passenger_id;
        this.username = data.username;
        this.password_hash = data.password_hash;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.email = data.email;
        this.phone = data.phone;
        this.balance = data.balance || 0.0;
        
        this.card_id = data.card_id;
        this.card_uid = data.rfid_uid;
    }

    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, c.rfid_uid FROM Passenger p
                LEFT JOIN Card c ON p.card_id = c.card_id
                WHERE p.username = ? AND p.status = 'ACTIVE'
            `;
            db.query(query, [username], (err, results) => {
                if (err) { 
                    return reject(err);
                }
                if (results.length > 0) {
                    resolve(new Passenger(results[0]));
                }
                else {
                    resolve(null);
                }
            });
        });
    }

    static findById(id) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, c.rfid_uid FROM Passenger p
                LEFT JOIN Card c ON p.card_id = c.card_id
                WHERE p.passenger_id = ? AND p.status = 'ACTIVE'
            `;
            db.query(query, [id], (err, results) => {
                if (err) { 
                    return reject(err);
                }
                if (results.length > 0) {
                    resolve(new Passenger(results[0]));
                }
                else {
                    resolve(null);
                }
            });
        });
    }

    static async updatePassenger(id, data) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE Passenger
                SET first_name = ?, last_name = ?, email = ?, phone = ? WHERE passenger_id = ? 
            `;

            const params = [
                data.first_name,
                data.last_name,
                data.email,
                data.phone,
                id
            ];

            db.query(query, params, (err, results) => {
                if (err) {
                    return reject(err);
                }

                resolve(results.affectedRows > 0);
            });
        });
    }

    static updatePassword(id, newPasswordHash) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE Passenger SET password_hash = ? WHERE passenger_id = ?';
            db.query(query, [newPasswordHash, id], (err, results) => {
                if (err) {
                    return reject(err);   
                }

                resolve(results.affectedRows > 0);
            });
        });
    }

    static async getBasicAnalytics(passengerId) {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(t.trip_id) AS total_trips,
                SUM(tr.fare_amount) AS total_spent,
                SUM(TIMESTAMPDIFF(MINUTE, t.start_time, t.end_time)) AS total_minutes
             FROM Trip t
             LEFT JOIN Transaction tr ON t.trip_id = tr.trip_id
             WHERE t.passenger_id = ? AND t.status = 'COMPLETED'
            `, [passengerId]
        );
        return rows;
    }

    static async getWeeklyTripData(passengerId) {
        const [rows] = await db.execute(
            `SELECT DAYNAME(start_time) as day_name, COUNT(*) AS trip_count
             FROM Trip
             WHERE passenger_id = ?
             AND start_time >= DATE(NOW() - INTERVAL 7 DAY)
             GROUP BY DAYNAME(start_time)`, [passengerId]
        );
        return rows;
    }

    static async getTopRoute(passengerId) {
        const [rows] = await db.execute(
            `SELECT r.route_code, r.start_location, r.end_location, COUNT(t.trip_id) AS route_count
             FROM Trip t
             JOIN Bus b ON t.bus_id = b.bus_id
             JOIN Route r ON b.route_id = r.route_id
             WHERE t.passenger_id = ? AND t.status = 'COMPLETED'
             GROUP BY r.route_id
             ORDER BY route_count DESC
             LIMIT 1`, [passengerId]
        );
        return rows;
    }
}

module.exports = Passenger;