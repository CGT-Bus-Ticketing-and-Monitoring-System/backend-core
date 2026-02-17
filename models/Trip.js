const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/active/:passengerId", (req, res) => {

  const passengerId = req.params.passengerId;

  const sql = `
    SELECT 
        t.start_time,
        t.status,
        b.registration_number,
        r.start_location,
        r.end_location
    FROM trip t
    INNER JOIN bus b 
        ON t.bus_id = b.bus_id
    INNER JOIN route r 
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

    // Send data
    res.json({
      success: true,
      data: results[0] // first active trip
    });

  });

});

module.exports = router;
