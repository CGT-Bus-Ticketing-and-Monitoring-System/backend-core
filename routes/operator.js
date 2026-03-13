const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const Operator = require('../models/Operator');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        
        const operator = await Operator.findByUsername(username);
        
        if (!operator) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        
        const isMatch = await bcrypt.compare(password, operator.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        
        const token = jwt.sign(
            { operatorId: operator.operator_id, role: 'operator' },
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '8h' }
        );

        res.status(200).json({
            message: 'Operator login successful',
            token: token,
            fname: operator.fname,
            operator_id: operator.operator_id
        });

    } catch (error) {
        console.error('Operator Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});


router.get('/profile', authMiddleware, async (req, res) => {
    try {
        
        const operator = await Operator.findByUsername(req.user.username);
        if (!operator) {
            return res.status(404).json({ message: 'Operator not found' });
        }
        
        
        delete operator.password_hash;
        res.json(operator);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

module.exports = router;