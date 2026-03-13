const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Bus = require('../models/Bus');

// /tap is the main entry

router.post('/tap' , (req,res) => {
    const {rfid_uid , bus_id} = req.body;

    if(!rfid_uid || !bus_id){
        return res.status(400).json({message : "RFID and BusId required", success: false});

    }

    db.getConnection((err, connection) => {
        if(err){
            return res.status(500).json({success: false , message : err.message});
            //This will give a internal server error, basically we are creating this to check if the cloud db is working :) 
        }
        
        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.status(500).json({ success: false, message: err.message });
            }

            connection.query(
                "SELECT * FROM Card WHERE rfid_uid = ? AND status = 'ACTIVE'",
                // check if the RFID is valid 
                [rfid_uid],
                (err , CardResult) => {
                    
                    if(err) return rollback(err);
                    if(CardResult.length === 0)
                        return rollback("Invalid or Blocked Card");

                    const card = CardResult[0];

                    //passenger data
                    connection.query(
                        "SELECT * FROM Passenger WHERE Card_id = ? AND status = 'ACTIVE'",
                        [card.card_id],
                        (err , passengerResult) => {
                            if(err) return rollback(err);
                            if(passengerResult.length === 0)
                                return rollback("Passenger not Found");

                            const passenger = passengerResult[0];

                            //Now let's check if passenger has any active trips that are ongoing :)
                            connection.query(
                                "SELECT * FROM Trip WHERE passenger_id = ? AND status = 'ACTIVE'",
                                [passenger.passenger_id],
                                (err , tripResult) => {
                                    if(err) return rollback(err);

                                    if(tripResult.length === 0){
                                        //Evoke a function
                                        startTrip(passenger);
                                    }else{
                                        completeTrip(tripResult[0], passenger);

                                    }
                                }
                            );

                        }
                    );
                }
            );

            //StartTrip Function 

            function startTrip(passenger){

                connection.query(
                    "SELECT route_id FROM Bus WHERE bus_id = ?",
                    [bus_id],
                    (err , BusResult) => {

                        if(err) return rollback(err);
                        if(BusResult.length === 0)
                            return rollback("Bus Not Found");

                        const route_id = BusResult[0].route_id;

                        connection.query(
                            "SELECT base_fare FROM Route WHERE route_id = ?",
                            [route_id],
                            (err , routeResult) => {
                                if(err) return rollback(err);

                                const fare = routeResult[0].base_fare;

                                if(passenger.balance < fare)
                                    return rollback("Insufficient Account Balance");

                                connection.query(
                                    "INSERT INTO Trip (passenger_id , bus_id , start_time) VALUES (?,?,NOW())",
                                    [passenger.passenger_id , bus_id],
                                    (err) => {
                                        if(err) return rollback(err);

                                        connection.commit(err => {
                                            if(err) return rollback(err);

                                            connection.release();
                                            return res.json({
                                                success : true,
                                                action : "TAP IN Successful",
                                                message : `Trip Started. Fare: ${fare}`
                                            });
                                        });
                                    }
                                );

                            }
                        );

                    }
                );
            }
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
            
            
            function rollback(error){
                connection.rollback(() => {
                    connection.release();
                    return res.status(400).json({
                        success : false,
                        message : error.toString()
                    });
                });
            }

        });
    });
});

//Location Fetching logic
router.post('/update-location', async (req, res) => {
    try {
        
        const { bus_id, latitude, longitude } = req.body;

        if (!bus_id || !latitude || !longitude) {
            return res.status(400).json({ error: "Missing parameters" });
        }

        await Bus.updateLocation(bus_id, latitude, longitude);

        res.json({
            message: "Location updated successfully"
        });
    } catch (error) {
        console.error(error)

        res.status(500).json({
            error: "Server error"
        });
    }
});

module.exports = router;
