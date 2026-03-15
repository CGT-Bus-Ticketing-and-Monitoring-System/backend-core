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

module.exports = router;