const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/iot/tap
router.post('/tap', (req, res) => {

    const { rfid_uid, bus_id } = req.body;

    if (!rfid_uid || !bus_id) {
        return res.status(400).json({
            success: false,
            message: "rfid_uid and bus_id are required"
        });
    }

    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).json({ success: false, message: err.message });
            }

            // 1️⃣ Validate Card
            connection.query(
                "SELECT * FROM Card WHERE rfid_uid = ? AND status = 'ACTIVE'",
                [rfid_uid],
                (err, cardResult) => {

                    if (err) return rollback(err);
                    if (cardResult.length === 0)
                        return rollback("Invalid or blocked card");

                    const card = cardResult[0];

                    // 2️⃣ Get Passenger
                    connection.query(
                        "SELECT * FROM Passenger WHERE card_id = ? AND status = 'ACTIVE'",
                        [card.card_id],
                        (err, passengerResult) => {

                            if (err) return rollback(err);
                            if (passengerResult.length === 0)
                                return rollback("Passenger not found");

                            const passenger = passengerResult[0];

                            // 3️⃣ Check Active Trip
                            connection.query(
                                "SELECT * FROM Trip WHERE passenger_id = ? AND status = 'ACTIVE'",
                                [passenger.passenger_id],
                                (err, tripResult) => {

                                    if (err) return rollback(err);

                                    if (tripResult.length === 0) {
                                        // 🔵 TAP IN
                                        startTrip(passenger);
                                    } else {
                                        // 🔴 TAP OUT
                                        completeTrip(tripResult[0], passenger);
                                    }
                                }
                            );
                        }
                    );
                }
            );

            // --------------------------
            // TAP IN FUNCTION
            // --------------------------
            function startTrip(passenger) {

                connection.query(
                    "SELECT route_id FROM Bus WHERE bus_id = ?",
                    [bus_id],
                    (err, busResult) => {

                        if (err) return rollback(err);
                        if (busResult.length === 0)
                            return rollback("Bus not found");

                        const route_id = busResult[0].route_id;

                        connection.query(
                            "SELECT base_fare FROM Route WHERE route_id = ?",
                            [route_id],
                            (err, routeResult) => {

                                if (err) return rollback(err);

                                const fare = routeResult[0].base_fare;

                                if (passenger.balance < fare)
                                    return rollback("Insufficient balance");

                                connection.query(
                                    "INSERT INTO Trip (passenger_id, bus_id, start_time) VALUES (?, ?, NOW())",
                                    [passenger.passenger_id, bus_id],
                                    (err) => {

                                        if (err) return rollback(err);

                                        connection.commit(err => {
                                            if (err) return rollback(err);

                                            connection.release();
                                            return res.json({
                                                success: true,
                                                action: "TAP_IN",
                                                message: "Trip started"
                                            });
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }

            // --------------------------
            // TAP OUT FUNCTION
            // --------------------------
            function completeTrip(trip, passenger) {

                connection.query(
                    "UPDATE Trip SET end_time = NOW(), status = 'COMPLETED' WHERE trip_id = ?",
                    [trip.trip_id],
                    (err) => {

                        if (err) return rollback(err);

                        connection.query(
                            "SELECT route_id, operator_id FROM Bus WHERE bus_id = ?",
                            [trip.bus_id],
                            (err, busResult) => {

                                if (err) return rollback(err);

                                const route_id = busResult[0].route_id;
                                const operator_id = busResult[0].operator_id;

                                connection.query(
                                    "SELECT base_fare FROM Route WHERE route_id = ?",
                                    [route_id],
                                    (err, routeResult) => {

                                        if (err) return rollback(err);

                                        const fare = routeResult[0].base_fare;

                                        connection.query(
                                            "UPDATE Passenger SET balance = balance - ? WHERE passenger_id = ?",
                                            [fare, passenger.passenger_id],
                                            (err) => {

                                                if (err) return rollback(err);

                                                connection.query(
                                                    "INSERT INTO Transaction (trip_id, operator_id, fare_amount) VALUES (?, ?, ?)",
                                                    [trip.trip_id, operator_id, fare],
                                                    (err) => {

                                                        if (err) return rollback(err);

                                                        connection.commit(err => {
                                                            if (err) return rollback(err);

                                                            connection.release();
                                                            return res.json({
                                                                success: true,
                                                                action: "TAP_OUT",
                                                                fare: fare,
                                                                message: "Trip completed & fare charged"
                                                            });
                                                        });
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }

            // --------------------------
            // ROLLBACK FUNCTION
            // --------------------------
            function rollback(error) {
                connection.rollback(() => {
                    connection.release();
                    return res.status(400).json({
                        success: false,
                        message: error.toString()
                    });
                });
            }

        });
    });
});

module.exports = router;