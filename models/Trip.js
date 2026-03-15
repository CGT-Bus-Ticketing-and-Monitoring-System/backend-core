const db = require("../config/db");

//Basic OOP? :0

class Trip {
  constructor(data) {
    this.trip_id = data.trip_id;
    this.passenger_id = data.passenger_id;
    this.bus_id = data.bus_id;
    this.start_time = data.start_time;
    this.end_time = data.end_time;
    this.status = data.status;
  }

  static async getActiveTrips(passengerId){
    return new Promise((resolve , reject) => {
      const sql = `
        SELECT 
            t.start_time,
            t.status,
            b.registration_number,
            r.start_location,
            r.end_location
        FROM Trip t
        INNER JOIN Bus b 
            ON t.bus_id = b.bus_id
        INNER JOIN Route r 
            ON b.route_id = r.route_id
        WHERE 
            t.passenger_id = ?
            AND t.status = 'ACTIVE'
        `;
      
        db.query(sql, [passengerId] , (err,results) => {
          if(err) return reject(err);
          resolve(results);
        });
    });

  }
  static async getHistoryTrips(passengerId){
    return new Promise((resolve , reject) => {
        const sql_his = `
          SELECT 
            t.start_time,
            t.status,
            b.registration_number,
            r.start_location,
            r.end_location
          FROM Trip t
          INNER JOIN Bus b 
              ON t.bus_id = b.bus_id
          INNER JOIN Route r 
              ON b.route_id = r.route_id
          WHERE 
              t.passenger_id = ?
              AND t.status = 'COMPLETED'
        `;

        db.query(sql_his , [passengerId] , (err,results) => {
          if(err) return reject(err);
          resolve(results);
        });
    });

  }

  static async getCancleTrips(passengerId){
    return new Promise((resolve , reject) => {
        const sql_cancle = `
          SELECT 
            t.start_time,
            t.status,
            b.registration_number,
            r.start_location,
            r.end_location
          FROM Trip t
          INNER JOIN Bus b 
              ON t.bus_id = b.bus_id
          INNER JOIN Route r 
              ON b.route_id = r.route_id
          WHERE 
              t.passenger_id = ?
              AND t.status = 'CANCELLED'
        `;

        db.query(sql_cancle, [passengerId], (err , results) => {
          if(err) return reject(err);
          resolve(results);
        });
    });
  }


}

module.exports = Trip;