const Bus = require('../models/Bus');

async function getActiveMapBuses() {
    return Bus.getActiveBuses();
}

module.exports = {
    getActiveMapBuses
};