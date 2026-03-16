const Route = require('../models/Route');

async function getActiveBusRoutes() {
    return Route.getAllBusRoutes();
}

module.exports = {
    getActiveBusRoutes
};
