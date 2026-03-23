const db = require('../config/db');

class Route {
    constructor(data) {
        this.route_id = data.route_id;
        this.route_code = data.route_code;
        this.start_location = data.start_location;
        this.end_location = data.end_location;
        this.base_fare = data.base_fare;
        this.status = data.status;
        this.assigned_buses = data.assigned_buses || 0;
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT r.*, 
                (SELECT COUNT(*) FROM Bus b WHERE b.route_id = r.route_id AND b.status = 'ACTIVE') AS assigned_buses
                FROM Route r
                ORDER BY r.route_id DESC
            `;

            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results.map(row => new Route(row)));
            });
        });
    }

static create(data) {
        return new Promise((resolve, reject) => {
            const checkQuery = `SELECT COUNT(*) as count FROM Route WHERE route_code = ?`;
            
            db.query(checkQuery, [data.route_code], (checkErr, checkResults) => {
                if (checkErr) return reject(checkErr);

                if (checkResults[0].count > 0) {
                    const error = new Error('Route code already exists');
                    error.isDuplicate = true; 
                    return reject(error);
                }

                const insertQuery = `
                    INSERT INTO Route (route_code, start_location, end_location, base_fare)
                    VALUES (?, ?, ?, ?)
                `;

                const params = [data.route_code, data.start_location, data.end_location, data.base_fare];

                db.query(insertQuery, params, (err, results) => {
                    if (err) return reject(err);
                    resolve(results.insertId);
                });
            });
        });
    }

    static update(id ,data) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE Route 
                SET start_location = ?, end_location = ?, base_fare = ?
                WHERE route_id = ? 
            `;

            const params = [data.start_location, data.end_location, data.base_fare, id];

            db.query(query, params, (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static deactivate(id) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE Route SET status = 'INACTIVE' WHERE route_id = ?`;

            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static activate(id) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE Route SET status = 'ACTIVE' WHERE route_id = ?`;

            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(true); 
            });
        });
    }

    static delete(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM Route WHERE route_id = ?`;

            db.query(query, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static assignBus(routeId,busRegNo) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE Bus SET route_id = ? WHERE registration_number = ?`;

            db.query(query, [routeId, busRegNo], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }

    static getDropdownData() {
        return new Promise((resolve, reject) => {
            const routesQuery = `SELECT route_id, route_code, start_location, end_location FROM Route WHERE status = 'ACTIVE'`;
            const busQuery = `SELECT bus_id, registration_number FROM Bus WHERE status = 'ACTIVE' AND route_id IS NULL`;

            db.query(routesQuery, (err, routes) => {
                if (err) return reject(err);

                db.query(busQuery, (err, buses) => {
                    if (err) return reject(err);
                    resolve({routes, buses});
                });  
            });
        });
    }

    static async getActiveRoutes() {
        const [rows] = await db.promise().execute("SELECT route_id, route_code FROM Route WHERE status = 'ACTIVE'");
        return rows;
    }

    static async getAllBusRoutes(){
        return new Promise((resolve , reject) => {
            const sql_bus = `
            SELECT route_id , route_code , start_location , end_location , base_fare
            FROM Route WHERE status = 'ACTIVE'
            `;
            db.query(sql_bus , (err,results)=> {
                if(err) return reject(err);
                resolve(results);
            });
        });
    }

    static async getBusSchedule(routeid){
        return new Promise((resolve , reject) => {
            const sql_bus_sch = `
            SELECT * 
            FROM BusSchedule
            WHERE route_id = ? 
            AND departure_time > ADDTIME(CURRENT_TIME, '05:30:00') 
            AND status = 'ACTIVE'
            ORDER BY departure_time ASC;
            `;

            db.query(sql_bus_sch , [routeid], (err,results) => {
                if(err) return reject(err);
                resolve(results);
            });
        });
    }
}

module.exports = Route;