const Trip = require('../models/Trip');

async function getActiveTripUnit(passengerId) {
    return Trip.getActiveTrips(passengerId);
}

module.exports = {
    getActiveTripUnit
};