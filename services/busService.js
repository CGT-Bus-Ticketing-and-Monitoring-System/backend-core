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

module.exports = {
    getActiveMapBuses,
    getLiveBusStatus
};