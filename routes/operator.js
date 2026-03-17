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
        if (req.user.role !== 'operator' || !req.user.operatorId) {
            return res.status(403).json({ message: 'Operator access only' });
        }

        const { from, to, period } = req.query;
        const earnings = await OperatorService.getEarnings(req.user.operatorId, from, to, period);

        return res.status(200).json(earnings);
    } catch (error) {
        console.error('Error fetching operator earnings:', error.message);

        if (error.message === 'MISSING_OPERATOR_ID') {
            return res.status(400).json({ message: 'Operator id is required' });
        }
        if (error.message === 'INVALID_DATE_FORMAT') {
            return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
        }
        if (error.message === 'INVALID_DATE_RANGE') {
            return res.status(400).json({ message: 'Provide both from and to dates, and ensure from <= to' });
        }
        if (error.message === 'INVALID_PERIOD') {
            return res.status(400).json({ message: 'Invalid period. Use one of: last24hours, last3days, last7days, last30days, last60days' });
        }
        if (error.message.startsWith('MISSING_TRANSACTION_COLUMNS:')) {
            const missing = error.message.split(':')[1] || '';
            return res.status(500).json({ message: `Transaction table missing required columns: ${missing}` });
        }

        return res.status(500).json({ error: 'Server error while fetching earnings' });
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

module.exports = router;