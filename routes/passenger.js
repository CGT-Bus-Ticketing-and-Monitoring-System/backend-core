const express = require('express');
const router = express.Router();

const passengerService = require('../services/passengerService');
const busService = require('../services/busService');
const routeService = require('../services/routeService');
const authMiddleware = require('../middleware/authMiddleware');

// Route to get the latest location of the buses
router.get('/locations', async (req, res) => {
    try {
        const buses = await busService.getActiveMapBuses();
        res.json(buses);
    } catch (error) {
        res.status(500).json({ error: 'Server Error' });
    }
});

//Passenger Login Route
router.post('/login', async (req, res) => {
   try {
        const result = await passengerService.login(req.body);
        res.json(result);
   } 
   catch (error) 
   {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
   }
});

//Update passenger Route 
router.put('/update', authMiddleware, async (req, res) => {
    try {
        const updatedUser = await passengerService.updateProfile(
            req.user.id,
            { ...req.body, username: req.user.username }
        );

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.passenger_id,
                username: updatedUser.username,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                balance: updatedUser.balance,
                card_uid: updatedUser.card_uid
            }
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
});


//Change Password Route
router.put('/change_password', authMiddleware, async (req, res) => {
    try {
        await passengerService.changePassword(
            req.user.id,
            req.user.username,
            req.body.currentPassword,
            req.body.newPassword
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message || 'Server Error' });
    }
});

//Fetch Profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userProfile = await passengerService.getProfile(req.user.id);
        res.json(userProfile);
    } catch (error) {
        res.status(error.status || 500).json({message: error.message || 'Server Error'});
    }
});

router.get('/busRoutes', async (req, res) => {
    try {
        const routes = await routeService.getActiveBusRoutes();
        res.json(routes);
    } catch (error) {
        res.status(500).json({ error: 'Server Error case ' });
    }
});

module.exports = router;