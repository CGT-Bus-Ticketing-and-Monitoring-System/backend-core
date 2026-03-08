const db = require('../config/db');

class Admin {
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
}

module.exports = Admin;