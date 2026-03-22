const express = require('express');
const router = express.Router();

const OperatorService = require('../services/operatorService');
const authMiddleware = require('../middleware/authMiddleware');
const busService = require('../services/busService');
const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await OperatorService.login(username, password);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === 'MISSING_DATA') {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        if (error.message === 'INVALID_CREDENTIALS') {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const profile = await OperatorService.getProfile(req.user.operatorId);
        res.status(200).json(profile);
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ message: 'Operator not found' });
        }
        res.status(500).json({ error: 'Server Error' });
    }
});

router.get('/earnings', authMiddleware, async (req, res) => {
    try {
        const { fromDate, toDate, period } = req.query;
        const operatorId = req.user.operatorId;
        const earningsData = await OperatorService.getEarnings(operatorId, fromDate, toDate, period);
        res.status(200).json(earningsData);
    } catch (error) {
        if (error.message === 'MISSING_OPERATOR_ID' || error.message === 'INVALID_DATE_RANGE' || error.message === 'INVALID_DATE_FORMAT' || error.message === 'INVALID_PERIOD') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.get('/my-buses/:id', async (req, res) => {
    try {
        const buses = await OperatorService.getMyBuses(req.params.id);
        res.status(200).json(buses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching buses", error: error.message });
    }
});

router.post('/create-bus', async (req, res) => {
    try {
        const result = await OperatorService.createBus(req.body);
        res.status(201).json({ message: "Bus created successfully", id: result.insertId });
    } catch (error) {
        if (error.message === 'DUPLICATE_REGISTRATION_NUMBER') {
            return res.status(409).json({ 
                message: "A bus with this registration number already exists." 
            });
        }

        console.error("Error creating bus:", error);
        res.status(500).json({ message: "Error saving bus", error: error.message });
    }
});

router.delete('/delete-bus/:id', async (req, res) => {
    try {
        await OperatorService.deleteBus(req.params.id);
        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-bus/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'operator' || !req.user.operatorId) {
            return res.status(403).json({ message: 'Operator access only' });
        }
        await OperatorService.updateBus(req.user.operatorId, req.params.id, req.body || {});
        return res.status(200).json({ message: 'Bus updated successfully' });
    } catch (error) {
        if (error.message === 'MISSING_IDS') {
            return res.status(400).json({ message: 'Bus id and operator id are required' });
        }
        if (error.message === 'INVALID_BUS_DATA') {
            return res.status(400).json({ message: 'Invalid bus data. Provide bus_name, model, registration_number, and positive capacity' });
        }
        if (error.message === 'BUS_NOT_FOUND_OR_FORBIDDEN') {
            return res.status(404).json({ message: 'Bus not found for this operator' });
        }
        if (error.message === 'DUPLICATE_REGISTRATION_NUMBER') {
            return res.status(409).json({ message: 'Registration number already exists' });
        }
        return res.status(500).json({ error: 'Server error while updating bus' });
    }
});

// Dashboard-Operator
router.get('/dashboard-summary/:id', async (req, res) => {
    try {
        const operatorId = req.params.id;
        const period = req.query.period || '30days';
        const stats = await OperatorService.getDashboardData(operatorId, period);
        
        if (!stats) {
            return res.status(404).json({ message: "Operator data not found" });
        }
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching dashboard data' });
    }
});

router.put('/update-bus-status/:id', async (req, res) => {
    try {
        const busId = req.params.id;
        const { status } = req.body;

        if (!status || (status !== 'ACTIVE' && status !== 'INACTIVE')) {
            return res.status(400).json({ message: 'Valid status is required' });
        }

        await busService.changeBusStatus(busId, status);
        res.status(200).json({ message: `Bus status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error updating bus status' });
    }
});

router.put('/profile/update', authMiddleware, async (req, res) => {
    try {
        const operatorId = req.user.operatorId || req.user.id; 
        await OperatorService.updateMyProfile(operatorId, req.body);
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {

        if (error.message === 'INCORRECT_PASSWORD') {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        if (error.message.includes('already linked') || error.message.includes('already registered') || error.message.includes('conflicts')) {
            return res.status(409).json({ message: error.message });
        }

        console.error("Profile Update Error:", error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

module.exports = router;