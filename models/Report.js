const db = require('../config/db');

class Report {
    // Performance Analysis
    static async getTripStats(days) {
        const query = `
            SELECT 
                COUNT(*) as total_trips,
                COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END), 0) as completed_trips,
                COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) as cancelled_trips
            FROM Trip 
            WHERE start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [rows] = await db.promise().execute(query, [days]);
        return rows[0];
    }
    
    // New Passengers Count
    static async getNewPassengerCount(days) {
        const query = `
            SELECT COUNT(*) as new_passengers 
            FROM Passenger 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const [rows] = await db.promise().execute(query, [days]);
        return rows[0].new_passengers;
    }

    // Rush Hour Analysis
    static async getRushHourStats(days) {
        const query = `
            SELECT 
                HOUR(start_time) as hour_of_day, 
                COUNT(*) as passenger_count
            FROM Trip
            WHERE status = 'COMPLETED'
              AND start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
              AND HOUR(start_time) BETWEEN 5 AND 22
            GROUP BY HOUR(start_time)
            ORDER BY hour_of_day ASC
        `;
        const [rows] = await db.promise().execute(query, [days]);
        return rows;
    }

    // Current Bus details
    static async getBusStats() {
        const query = `
            SELECT 
                COALESCE(SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END), 0) as active_buses,
                COALESCE(SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END), 0) as offline_buses
            FROM Bus
        `;
        const [rows] = await db.promise().execute(query);
        return rows[0];
    }

    // Active Routes Count
    static async getActiveRouteCount() {
        const query = `
            SELECT COUNT(*) as active_routes 
            FROM Route 
            WHERE status = 'ACTIVE'
        `;
        const [rows] = await db.promise().execute(query);
        return rows[0].active_routes;
    }
}

module.exports = Report;