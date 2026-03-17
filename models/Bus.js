const db = require('../config/db')

class Bus {
    constructor(data) {
        this.bus_id = data.bus_id;
        this.bus_name = data.bus_name;
        this.model = data.model;
        this.registration_number = data.registration_number;
        this.capacity = data.capacity;
        this.route_id = data.route_id;
        this.operator_id = data.operator_id;
        this.status = data.status || 'ACTIVE';
    }

    // Method to get the latest location of the buses
   static async getActiveBuses() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT
                    b.bus_id,
                    b.bus_name AS name,
                    b.model,
                    r.route_code AS route,
                    r.start_location,
                    r.end_location,
                    r.base_fare AS price,
                    l.latitude,
                    l.longitude,
                    (SELECT COUNT(*) FROM Trip t WHERE t.bus_id = b.bus_id AND t.status = 'ACTIVE') AS active_passengers
                FROM Bus b
                JOIN Route r ON b.route_id = r.route_id
                JOIN LocationLog l ON b.bus_id = l.bus_id
                WHERE b.status = 'ACTIVE'
                AND l.timestamp = (
                    SELECT MAX(timestamp)
                    FROM LocationLog
                    WHERE bus_id = b.bus_id
                )`;

            db.query(query, (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
   }

    // Method to update the location of the bus
    static async updateLocation(bus_id, latitude, longitude) {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO LocationLog (bus_id, latitude, longitude) VALUES (?, ?, ?)';
            db.query(query, [bus_id, latitude, longitude], (err, result) => {
                if (err) reject(err);

                resolve(result);
            })
        })
    }

    // Method to get bus details by ID
    static async getBusById(bus_id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM Bus WHERE bus_id = ?';
            db.query(query, [bus_id], (err, results) => {
                if (err) reject(err);

                if (results.length > 0) {
                    resolve(new Bus(results[0]));
                }
                else {
                    resolve(null);
                }
            });
        });
    }

    static async updateBusById(bus_id, operator_id, data) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE Bus
                SET bus_name = ?, model = ?, registration_number = ?, capacity = ?
                WHERE bus_id = ? AND operator_id = ?
            `;

            const params = [
                data.bus_name,
                data.model,
                data.registration_number,
                data.capacity,
                bus_id,
                operator_id
            ];

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }
}

module.exports = Bus;


