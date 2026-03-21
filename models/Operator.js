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
//Dashboard-Operator
static getDashboardStats(operatorId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    fname,
                    (SELECT COUNT(*) FROM Bus WHERE operator_id = ?) AS total_buses,
                    (SELECT COUNT(*) FROM Bus WHERE operator_id = ? AND status = 'ACTIVE') AS active_buses,
                    (SELECT COUNT(*) FROM Bus WHERE operator_id = ? AND status = 'INACTIVE') AS inactive_buses,
                    (SELECT IFNULL(SUM(fare_amount), 0) FROM Transaction WHERE operator_id = ? AND DATE(created_at) = CURDATE()) AS today_earnings
                FROM Operator 
                WHERE operator_id = ?
            `;
            const params = [operatorId, operatorId, operatorId, operatorId, operatorId];

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }
    static findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM `Operator` WHERE operator_id = ?';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
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

}


module.exports = Operator;