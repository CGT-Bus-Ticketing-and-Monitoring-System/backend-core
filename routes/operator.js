const express = require('express');
const router = express.Router();
const operatorService = require('../services/operatorService');

// Handle the POST request from your frontend login page
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Call the service to check the database
        const result = await operatorService.login(username, password);
        
        if (result.success) {
            res.status(200).json({ 
                message: 'Login successful', 
                user: result.user 
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;