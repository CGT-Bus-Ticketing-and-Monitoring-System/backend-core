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
        this.card_status = data.card_status;
    }

    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    p.*,
                    c.rfid_uid,
                    c.status AS card_status
                FROM Passenger p
                LEFT JOIN Card c 
                    ON p.card_id = c.card_id
                WHERE p.username = ? 
                AND p.status = 'ACTIVE'
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
                SELECT 
                    p.*,
                    c.rfid_uid,
                    c.status AS card_status
                FROM Passenger p
                LEFT JOIN Card c 
                    ON p.card_id = c.card_id
                WHERE p.passenger_id = ? 
                AND p.status = 'ACTIVE'
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

    static getBasicAnalytics(passengerId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(t.trip_id) AS total_trips,
                    COALESCE(SUM(tr.fare_amount), 0) AS total_spent,
                    COALESCE(SUM(TIMESTAMPDIFF(MINUTE, t.start_time, t.end_time)), 0) AS total_minutes
                FROM Trip t
                LEFT JOIN Transaction tr ON t.trip_id = tr.trip_id
                WHERE t.passenger_id = ? AND t.status = 'COMPLETED'
            `;

            db.query(query, [passengerId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || {});
            });
        });
    }

    static getWeeklyTripData(passengerId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT DAYNAME(start_time) as day_name, COUNT(*) AS trip_count
                FROM Trip
                WHERE passenger_id = ?
                AND start_time >= DATE(NOW() - INTERVAL 7 DAY)
                GROUP BY DAYNAME(start_time)
            `;

            db.query(query, [passengerId], (err, results) => {
                if (err) return reject(err);
                resolve(results || []);
            });
        });
    }

    static getTopRoute(passengerId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT r.route_code, r.start_location, r.end_location, COUNT(t.trip_id) AS route_count
                FROM Trip t
                JOIN Bus b ON t.bus_id = b.bus_id
                JOIN Route r ON b.route_id = r.route_id
                WHERE t.passenger_id = ? AND t.status = 'COMPLETED'
                GROUP BY r.route_id
                ORDER BY route_count DESC
                LIMIT 1
            `;

            db.query(query, [passengerId], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Passenger Management 
    static findAllPassengers() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.passenger_id, p.first_name, p.last_name, p.username, 
                       p.email, p.phone, p.balance, p.status AS acc_status, 
                       c.card_id, c.rfid_uid AS card_number, c.status AS card_status
                FROM Passenger p
                LEFT JOIN Card c ON p.card_id = c.card_id
                ORDER BY p.passenger_id DESC
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    static createPassenger(data) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO Passenger 
                (first_name, last_name, username, email, phone, password_hash, balance, card_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const cardId = data.card_id ? data.card_id : null; 
            const params = [
                data.first_name, data.last_name, data.username, data.email, 
                data.phone, data.password_hash, data.balance, cardId
            ];
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.insertId);
            });
        });
    }

    static updatePassengerDetails(id, data) {
        return new Promise((resolve, reject) => {
            let query = `
                UPDATE Passenger 
                SET first_name = ?, last_name = ?, username = ?, email = ?, phone = ?, balance = ?
            `;
            let params = [
                data.first_name, data.last_name, data.username, data.email, data.phone, data.balance
            ];
            if (data.password_hash) {
                query += `, password_hash = ?`;
                params.push(data.password_hash);
            }
            query += ` WHERE passenger_id = ?`;
            params.push(id);
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE `Passenger` SET status = ? WHERE passenger_id = ?";
            db.query(query, [status, id], (err, results) => {
                if (err) return reject(err);
                resolve(true); 
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = "DELETE FROM `Passenger` WHERE passenger_id = ?";
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }
}

module.exports = Passenger;