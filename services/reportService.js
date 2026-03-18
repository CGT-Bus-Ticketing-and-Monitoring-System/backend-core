const Report = require('../models/Report');

class ReportService {
    static async getSummaryReport(days) {
        const interval = parseInt(days) || 30;

        try {
            const [tripStats, newPassengers, busStats, activeRoutes, rushHourRows] = await Promise.all([
                Report.getTripStats(interval),
                Report.getNewPassengerCount(interval),
                Report.getBusStats(),
                Report.getActiveRouteCount(),
                Report.getRushHourStats(interval)
            ]);

            const labels = [];
            const data = [];

            const dbMap = {};
            rushHourRows.forEach(row => { dbMap[row.hour_of_day] = row.passenger_count; });

            for (let h = 5; h <= 22; h++) {
                const ampm = h >= 12 ? (h === 12 ? '12 PM' : (h - 12) + ' PM') : h + ' AM';
                labels.push(ampm);
                data.push(dbMap[h] || 0); 
            }

            return {
                periodAnalytics: {
                    days: interval,
                    totalTrips: tripStats.total_trips,
                    completedTrips: tripStats.completed_trips,
                    cancelledTrips: tripStats.cancelled_trips,
                    newPassengers: newPassengers
                },
                rushHourStats: {
                    labels: labels,
                    data: data
                },
                systemSnapshot: {
                    activeBuses: busStats.active_buses,
                    offlineBuses: busStats.offline_buses,
                    activeRoutes: activeRoutes
                }
            };

        } catch (error) {
            console.error('Error in getSummaryReport service:', error);
            throw new Error('Database Error');
        }
    }
}

module.exports = ReportService;