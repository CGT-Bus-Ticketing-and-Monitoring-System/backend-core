const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');

const Route = require('../models/Route');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/authMiddleware');

//login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const admin = await Admin.findByUsername(username);
        
        if (!admin) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, admin.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { adminId: admin.admin_id, role: 'admin' }, 
            process.env.JWT_SECRET || 'default_secret_key', 
            { expiresIn: '8h' } 
        );

        res.status(200).json({
            message: 'Login successful',
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

//get all routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await Route.findAll();
        res.json(routes);
    } catch (error) {
        console.error('Errors fetching routes', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//route creation 
router.post('/routes/create', async (req, res) => {
    const {route_code, start_location, end_location, base_fare} = req.body;

    //validation
    if (!route_code || !start_location || !end_location || !base_fare) {
        return res.status(400).json({message: 'All fields required'});
    }

    try {
        const newId = await Route.create({route_code, start_location, end_location, base_fare});
        res.status(201).json({message: 'Route Created', route_id: newId});
    } catch (error) {
        console.error('Error creating route: ', error)
        res.status(500).json({error: 'Database Error'});
    }
});

//updating routes
router.put('/routes/update/:id', async (req, res) => {
    const {start_location, end_location, base_fare} = req.body;

    try {
        const success = await Route.update(req.params.id, {start_location, end_location, base_fare});
        if (success) {
            res.json({message: 'Route updated Sucessfully'});
        }
        else
        {
            res.status(404).json({message: 'Route not found'});
        }
    } catch (error) {
        console.error('Error updating route: ', error);
        res.status(500).json({error: 'Database Error'});
    }
});

//deactivate routes
router.put('/routes/deactivate/:id', async (req, res) => {
    try {
        const success = await Route.deactivate(req.params.id);
        if (success) {
            res.json({message: 'Route Deactivated'});
        }
        else
        {
            res.status(404).json({message: 'Route not found'});
        }
    } catch (error) {
        console.error('Error Deactivating route: ', error);
        res.status(500).json({error: 'Database Error'});
    }
})

//get assignment data 
router.get('/routes/assignment-data', async (req, res) => {
    try {
        const data = await Route.getDropdownData();
        res.json(data);
    } catch (error) {
        console.error('Errors fetching Assignment data: ', error);
        res.status(500).json({ error: 'Database Error'});
    }
});

//assign bus routes
router.post('/routes/assign-bus', async (req, res) => {
    const { route_id, bus_reg_no } = req.body;

    if (!route_id || !bus_reg_no) {
        return res.status(400).json({message: 'Route and Bus are Required'});
    }

    try {
        const success = await Route.assignBus(route_id, bus_reg_no);
        if (success) {
            res.json({message: 'Bus assigned Sucessfully'});
        }
        else
        {
            res.status(404).json({message: 'Bus not found'});
        }
    } catch (error) {
        console.error('Errors assigning Bus: ', error);
        res.status(500).json({ error: 'Database Error'});
    }
})

module.exports = router;