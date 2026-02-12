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
    }

    static findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM Passenger WHERE username = ? AND status = 'ACTIVE'";
            db.query(query, [username], (err, results) => {
                if (err) reject(err);

                if (results.length > 0) {
                    resolve(new Passenger(results[0]));
                }
                else {
                    resolve(null);
                }
            });
        });
    }
}

module.exports = Passenger;