const db = require('../config/db');

class Admin {
    // Method to find an admin by username
    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM Admin WHERE username = ?`;

            db.query(query, [username], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results[0]); 
            });
        });
    }

    // Method to get dashboard statistics
    static getDashboardStats() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM Bus WHERE status = 'ACTIVE') AS active_buses,
                    (SELECT COUNT(*) FROM Bus WHERE status = 'INACTIVE') AS offline_buses,
                    (SELECT COUNT(*) FROM Passenger) AS total_passengers,
                    (SELECT COUNT(*) FROM Trip WHERE DATE(start_time) = CURDATE()) AS trips_today
            `;

            db.query(query, (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results[0]); 
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
                WHERE p.status != 'INACTIVE'
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

    static updatePassenger(id, data) {
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
    static getAvailableCards() {
        return new Promise((resolve, reject) => {           
            const query = `
                SELECT card_id, rfid_uid 
                FROM Card 
                WHERE card_id NOT IN (SELECT card_id FROM Passenger WHERE card_id IS NOT NULL)
                AND status != 'BLOCKED'
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }
   static async replacePassengerCard(passengerId, newCardId) {
    try {
        //card ID linked to this passenger
        const [current] = await new Promise((res, rej) => {
            db.query('SELECT card_id FROM Passenger WHERE passenger_id = ?', [passengerId], (e, r) => e ? rej(e) : res(r));
        });
        //old card as BLOCKED 
        if (current && current.card_id) {
            await new Promise((res, rej) => {
                db.query("UPDATE Card SET status = 'INACTIVE' WHERE card_id = ?", [current.card_id], (e, r) => e ? rej(e) : res(r));
            });
        }
        //new card as ACTIVE
        await new Promise((res, rej) => {
            db.query("UPDATE Card SET status = 'ACTIVE' WHERE card_id = ?", [newCardId], (e, r) => e ? rej(e) : res(r));
        });
        //Passenger record to link the new card_id
        await new Promise((res, rej) => {
            db.query("UPDATE Passenger SET card_id = ? WHERE passenger_id = ?", [newCardId, passengerId], (e, r) => e ? rej(e) : res(r));
        });
        return true;
    } catch (error) {
        console.error("Database error during card replacement:", error);
        throw error;
    }
}
//Deactivate Passenger
    static deactivatePassenger(id) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE Passenger SET status = 'INACTIVE' WHERE passenger_id = ?";
            db.query(query, [id], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    }

    
    //admin-mngmnt
  constructor(data) {
        this.admin_id = data.admin_id;
        this.fname = data.fname;
        this.lname = data.lname;
        this.username = data.username;
        this.email = data.email;
        this.phone = data.phone;
        this.status = data.status || 'ACTIVE';
    }

    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM `Admin` WHERE username = ?'; 
            db.query(query, [username], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]); 
            });
        });
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            const query = "SELECT admin_id, fname, lname, username, email, phone, status FROM `Admin` WHERE status = 'ACTIVE' ORDER BY admin_id DESC";
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results.map(row => new Admin(row)));
            });
        });
    }

    static create(data) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO \`Admin\` (fname, lname, username, email, phone, password_hash) 
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
            let query = 'UPDATE `Admin` SET fname = ?, lname = ?, username = ?, email = ?, phone = ?';
            let params = [data.fname, data.lname, data.username, data.email, data.phone];

            if (data.password_hash) {
                query += ', password_hash = ?';
                params.push(data.password_hash);
            }

            query += ' WHERE admin_id = ?';
            params.push(id);

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static deactivate(id) {
        return new Promise((resolve, reject) => {
            const query = "UPDATE `Admin` SET status = 'INACTIVE' WHERE admin_id = ?";
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }
}




module.exports = Admin;