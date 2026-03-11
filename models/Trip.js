const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/active/:passengerId", (req, res) => {
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

  db.query(sql, [passengerId], (err, results) => {

    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    // If no active trip
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active trip found"
      });
    }

    
    res.json({
      success: true,
      data: results[0] 
    });

  });

});

router.get("/history/:passengerId", (req , res) => {
  const passengerId = Number(req.params.passengerId);

  if (isNaN(passengerId)) {
    return res.status(400).json({ success: false, message: "Invalid passenger ID" });
  }

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
        AND t.status = 'COMPLETED'
  `;

  db.query(sql, [passengerId], (err, results) => {
    if (err) {
      console.error(err);
    return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "No trip history found" });
  }

    res.json({ success: true, data: results });
  });

});


router.get("/cancel/:passengerId", (req, res) => {
  const passengerId = Number(req.params.passengerId);

  if (isNaN(passengerId)) {
    return res.status(400).json({ success: false, message: "Invalid passenger ID" });
  }

  sql = `
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

  db.query(sql, [passengerId], (err, results) => {
    if (err) {
      console.error(err);
    return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "No trip history found" });
  }

    res.json({ success: true, data: results });
  });

})

module.exports = router;
