const db = require('../db');

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
}

module.exports = Passenger;