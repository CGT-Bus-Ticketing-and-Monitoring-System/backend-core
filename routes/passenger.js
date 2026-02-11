const express = require('express');
const router = express.Router();
const Bus = require('../models/Bus');   

// Route to get the latest location of the buses
router.get('/locations', async (req, res) => {
    try {
        const buses = await Bus.getActiveBuses();
        res.json(buses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
})

module.exports = router;