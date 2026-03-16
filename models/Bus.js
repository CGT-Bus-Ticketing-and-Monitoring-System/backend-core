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
                LEFT JOIN LocationLog l ON b.bus_id = l.bus_id
                WHERE b.status = 'ACTIVE'
                AND l.timestamp = (
                    SELECT MAX(timestamp)
                    FROM LocationLog
                    WHERE bus_id = b.bus_id
                )
            `;

            db.query(query, (err, results) => {
                if (err) reject(err);
                resolve(results);
                console.log("Query Running");
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

    // Method to get current running buses with their details
    static getAllBusesWithDetails() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.registration_number, 
                    b.bus_name, 
                    r.route_code,
                    (SELECT MAX(timestamp) FROM LocationLog WHERE bus_id = b.bus_id) AS last_gps_update,
                    (SELECT COUNT(*) FROM Trip WHERE bus_id = b.bus_id AND status = 'ACTIVE') AS passenger_count
                FROM Bus b
                LEFT JOIN Route r ON b.route_id = r.route_id
                WHERE b.status = 'ACTIVE' 
                ORDER BY b.bus_id DESC
            `;

            db.query(query, (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results); 
            });
        });
    }

    static async getActiveBuses() {
        const [rows] = await db.promise().execute("SELECT bus_id, bus_name FROM Bus WHERE status = 'ACTIVE'");
        return rows;
    }
}

module.exports = Bus;


