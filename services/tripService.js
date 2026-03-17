const Trip = require('../models/Trip');

async function getActiveTripUnit(passengerId) {
    return Trip.getActiveTrips(passengerId);
}

async function getHistoryTripUnit(passengerId) {
    return Trip.getHistoryTrips(passengerId);
}

async function getCancleTripUnit(passengerId) {
    return Trip.getCancleTrips(passengerId);
}

module.exports = {
    getActiveTripUnit,
    getHistoryTripUnit,
    getCancleTripUnit
};