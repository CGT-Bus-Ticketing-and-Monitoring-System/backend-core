const Bus = require('../models/Bus');

async function getActiveMapBuses() {
    return Bus.getActiveBuses();
}

async function getLiveBusStatus() {
    try {
        const buses = await Bus.getAllBusesWithDetails();

        return buses;
    } catch (error) {
        console.error('Error in getLiveBusStatus service:', error);
        throw new Error('DATABASE_ERROR');
    }
}

async function getActiveBuses() {
    try {
        return await Bus.getActiveBuses();
    } catch (error) {
        console.error('Error fetching active buses:', error);
        throw new Error('DATABASE_ERROR');
    }
}

module.exports = {
    getActiveMapBuses,
    getLiveBusStatus,
    getActiveBuses
};