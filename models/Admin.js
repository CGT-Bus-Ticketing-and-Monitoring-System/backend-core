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
}

module.exports = Admin;