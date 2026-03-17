const db = require('../config/db'); 

class Schedule {
    // Get Schedules by Route and Bus
    static async getSchedulesByRouteAndBus(routeId, busId) {
        const [rows] = await db.promise().execute(
            'SELECT * FROM BusSchedule WHERE route_id = ? AND bus_id = ? ORDER BY departure_time ASC',
            [routeId, busId] 
        );
        return rows;
    }

    // Add Schedule
    static async addSchedule(data) {
        const [result] = await db.promise().execute(
            'INSERT INTO BusSchedule (bus_id, route_id, departure_time, arrival_time, direction, status) VALUES (?, ?, ?, ?, ?, ?)',
            [data.bus_id, data.route_id, data.departure_time, data.arrival_time, data.direction, data.status]
        );
        return result.insertId;
    }

    // Update Schedule
    static async updateSchedule(id, data) {
        const [result] = await db.promise().execute(
            'UPDATE BusSchedule SET departure_time = ?, arrival_time = ?, direction = ? WHERE schedule_id = ?',
            [data.departure_time, data.arrival_time, data.direction, id]
        );
        return result.affectedRows;
    }

    // Delete Schedule
    static async deleteSchedule(id) {
        const [result] = await db.promise().execute(
            'DELETE FROM BusSchedule WHERE schedule_id = ?',
            [id]
        );
        return result.affectedRows;
    }
}

module.exports = Schedule;