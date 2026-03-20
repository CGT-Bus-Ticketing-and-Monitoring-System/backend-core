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

async function getActiveStatusBuses() {
    try {
        return await Bus.getActiveStatusBuses();
    } catch (error) {
        console.error('Error fetching active buses:', error);
        throw new Error('DATABASE_ERROR');
    }
}


async function changeBusStatus(busId, status) {
    try {
      
        const success = await Bus.updateBusStatus(busId, status);
        if (!success) {
            throw new Error('Bus not found or status already set.');
        }
        return success;
    } catch (error) {
        console.error('Error in changeBusStatus service:', error);
        throw error;
    }
}


module.exports = {
    getActiveMapBuses,
    getLiveBusStatus,
    getActiveStatusBuses,
    changeBusStatus 
};