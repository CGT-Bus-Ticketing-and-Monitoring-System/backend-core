const Route = require('../models/Route');

async function getActiveRoutes() {
    return await Route.getActiveRoutes();
}

module.exports = {
    getActiveRoutes
};