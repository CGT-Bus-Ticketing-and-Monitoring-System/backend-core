const Schedule = require('../models/Schedule');

class ScheduleService {
    static async getSchedulesByRoute(routeId) {
        return await Schedule.findByRoute(routeId);
    }

    static async addSchedule(data) {
        return await Schedule.create(data);
    }

    static async updateSchedule(id, data) {
        const success = await Schedule.update(id, data);
        if (!success) throw new Error('Schedule not found');
        return success;
    }

    static async updateScheduleStatus(id, status) {
        return await Schedule.updateStatus(id, status);
    }

    static async deleteSchedule(id) {
        const success = await Schedule.delete(id);
        if (!success) throw new Error('Schedule not found');
        return success;
    }
}

module.exports = ScheduleService;