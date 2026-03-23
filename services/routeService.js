const Route = require('../models/Route');

async function getAllRoutes() {
    return await Route.findAll();
}

async function getActiveRoutes() {
    return await Route.getActiveRoutes();
}

async function getActiveBusRoutes() {
    return await Route.getAllBusRoutes();
}

async function getDropdownData() {
    return await Route.getDropdownData();
}

async function createRoute(data) {
    return await Route.create(data);
}

async function updateRoute(id, data) {
    return await Route.update(id, data);
}

async function deactivateRoute(id) {
    return await Route.deactivate(id);
}

async function activateRoute(id) {
    return await Route.activate(id);
}

async function deleteRoute(id) {
    const success = await Route.delete(id);
    if (!success) throw new Error('Route not found');
    return success;
}

async function bus_schdule(route_id) {
    return await Route.getBusSchedule(route_id);
}

async function assignBusToRoute(routeId, busRegNo) {
    return await Route.assignBus(routeId, busRegNo);
}

module.exports = {
    getAllRoutes,
    getActiveRoutes,
    getActiveBusRoutes,
    getDropdownData,
    createRoute,
    updateRoute,
    deactivateRoute,
    bus_schdule,
    activateRoute,
    assignBusToRoute,
    deleteRoute 
};