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
                WHERE o.status = 'ACTIVE'
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

    static deactivate(id) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE Operator SET status = 'INACTIVE' WHERE operator_id = ?`;
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }
}

module.exports = Operator;