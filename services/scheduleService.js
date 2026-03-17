const Schedule = require('../models/Schedule');

async function getSchedules(routeId, busId) {
    return await Schedule.getSchedulesByRouteAndBus(routeId, busId);
}

async function createSchedule(scheduleData) {
    return await Schedule.addSchedule(scheduleData);
}

async function updateSchedule(id, scheduleData) {
    return await Schedule.updateSchedule(id, scheduleData);
}

async function deleteSchedule(id) {
    return await Schedule.deleteSchedule(id);
}

module.exports = {
    getSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule 
};