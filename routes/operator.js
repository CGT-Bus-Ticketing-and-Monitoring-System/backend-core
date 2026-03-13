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

module.exports = router;