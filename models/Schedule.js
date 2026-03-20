const db = require('../config/db');

class Schedule {
    // Get all schedules for a specific route
    static findByRoute(routeId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT s.schedule_id, s.departure_time, s.arrival_time, s.direction, s.status, 
                       b.registration_number, b.bus_id 
                FROM \`BusSchedule\` s
                LEFT JOIN \`Bus\` b ON s.bus_id = b.bus_id
                WHERE s.route_id = ?
                ORDER BY s.departure_time ASC
            `;
            db.query(query, [routeId], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    }

    static create(data) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO \`BusSchedule\` (bus_id, route_id, departure_time, arrival_time, direction, status) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const params = [data.bus_id, data.route_id, data.departure_time, data.arrival_time, data.direction, data.status || 'ACTIVE'];
            
            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.insertId);
            });
        });
    }

    static update(id, data) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE \`BusSchedule\` 
                SET departure_time = ?, arrival_time = ?, direction = ? 
                WHERE schedule_id = ?
            `;
            db.query(query, [data.departure_time, data.arrival_time, data.direction, id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM `BusSchedule` WHERE schedule_id = ?';
            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }
}

module.exports = Schedule;