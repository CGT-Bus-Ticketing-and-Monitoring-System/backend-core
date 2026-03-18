const express = require('express');
const router = express.Router();

const OperatorService = require('../services/operatorService');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const result = await OperatorService.login(username, password);
        
        res.status(200).json(result);

    } catch (error) {
        console.error('Operator Login Error:', error.message);
        
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
        console.error('Error fetching profile:', error.message);
        
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
        console.error('Error fetching earnings:', error.message);
        if (error.message === 'MISSING_OPERATOR_ID' || error.message === 'INVALID_DATE_RANGE' || error.message === 'INVALID_DATE_FORMAT' || error.message === 'INVALID_PERIOD') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

router.get('/my-buses/:id', async (req, res) => {
    try {
        const buses = await OperatorService.getMyBuses(req.params.id);
        
        console.log(`Buses found for operator ${req.params.id}:`, buses.length);
        
        res.status(200).json(buses);
    } catch (error) {
        console.error("Route Error:", error.message);
        res.status(500).json({ message: "Error fetching buses", error: error.message });
    }
});



router.post('/create-bus', async (req, res) => {
    try {
        const result = await OperatorService.createBus(req.body);
        res.status(201).json({ message: "Bus created successfully", id: result.insertId });
    } catch (error) {
        console.error("Route Error:", error.message);
        res.status(500).json({ message: "Error saving bus", error: error.message });
    }
});

router.delete('/delete-bus/:id', async (req, res) => {
    console.log(">>> DELETE REQUEST RECEIVED FOR ID:", req.params.id); 
    try {
        if (!OperatorService) {
            throw new Error("OperatorService is not defined! Check your imports at the top.");
        }
        await OperatorService.deleteBus(req.params.id);
        console.log(">>> DELETE SUCCESSFUL");
        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        console.log(">>> !!! DELETE FAILED !!!");
        console.error("FULL ERROR:", error); 
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
        console.error('Error updating bus:', error.message);

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

//Dashboard-Operator

router.get('/dashboard-summary', async (req, res) => {
    try {
        const stats = await OperatorService.getDashboardData(req.user.operatorId);
        
        if (!stats) {
            return res.status(404).json({ message: "Operator data not found" });
        }
        
        res.status(200).json(stats);
    } catch (error) {
        console.error("Dashboard Route Error:", error.message);
        res.status(500).json({ error: 'Server error fetching dashboard' });
    }
    
});
module.exports = router;

router.get('/dashboard-summary/:id', async (req, res) => {
    try {
        const stats = await OperatorService.getDashboardData(req.params.id);
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}); 

module.exports = router;