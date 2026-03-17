const Route = require('../models/Route');

async function getActiveRoutes() {
    return await Route.getActiveRoutes();
}


async function getActiveBusRoutes() {
    return await Route.getAllBusRoutes();
}

module.exports = {
    getActiveBusRoutes,
    getActiveRoutes
};