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
                balance: user.balance,
                card_uid: user.card_uid,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
})

//Update passenger Route 
router.put('/update', async (req, res) => {
    const authHeader = req.headers.authorization; 

    //check token exists
    if (!authHeader) {
        return res.status(401).json({message: 'No Token Provided'});
    }

    const token = authHeader.split(' ')[1];

    try {
        //verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
        const passengerID = decoded.id;
        const username = decoded.username;

        //Update Database 
        const { first_name, last_name, email, phone} = req.body;

        await Passenger.updatePassenger(passengerID, {
            first_name,
            last_name,
            email,
            phone
        });

        //Fetching fresh user data to send back to the app
        const updatedUser = await Passenger.findByUsername(username);

        res.json({
            message: 'Profile Updated Sucessfully',
            user: {
                id: updatedUser.passenger_id,
                username: updatedUser.username,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                balance: updatedUser.balance,
                card_uid: updatedUser.card_uid, 
            }
        })
    } catch (error) {
        console.error("Update Error: ", error);
        res.status(500).json({message: 'Server Error during update'})
    }
})


//Change Password Route
router.put('/change_password', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({message: 'No Token Provided'});

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_key');
        const passengerId = decoded.id;
        const {currentPassword, newPassword} = req.body;

        const userQuery = 'SELECT * FROM Passenger WHERE passenger_id = ?';

        const user = await Passenger.findByUsername(decoded.username);

        if (!user) return res.status(404).json({message: 'User not found'});

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({message: 'Incorrect current password'});
        }

        const salt  = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        await Passenger.updatePassword(passengerId, newHash);

        res.json({message: 'Password changed successfully'});
    } catch (error) {
        console.error('Password change Error: ', error);
        res.status(500).json({message: 'Server Error'});
    }
})
module.exports = router;