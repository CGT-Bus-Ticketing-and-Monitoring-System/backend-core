const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Bus = require('../models/Bus');   
const Passenger = require('../models/Passenger');

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

//Passenger Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Passenger.findByUsername(username);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {id: user.passenger_id, username: user.username}, 
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.passenger_id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
})

module.exports = router;