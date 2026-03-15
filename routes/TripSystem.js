const express = require('express');
const router = express.Router();

const tripData = require('../services/tripService');

router.get('/active/:passengerId' , async(req,res) => {
    try {
        const passengerId = req.params.passengerId;

        const trips = await tripData.getActiveTripUnit(passengerId);

        res.json(trips);

    }catch (error) {
        res.status(500).json({error : 'mmm case case'});
    }
});

router.get('/history/:passengerId', async (req,res) => {
    try{

        const passengerId = req.params.passengerId;
        const trips = await tripData.getHistoryTripUnit(passengerId);

        res.json(trips);

    }catch (error){
        res.status(500).json({error: "No return complete data case"});
    }
});

router.get('/cancel/:passengerId' , async (req, res) =>{
    try{

        const passengerId = req.params.passengerId;
        const trips = await tripData.getCancleTripUnit(passengerId);

        res.json(trips);

    }catch (error){
        res.status(500).json({error : "No return cancle trip data case "});
    }
});



module.exports = router;