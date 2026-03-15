const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');

const Route = require('../models/Route');
const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/authMiddleware');
const OperatorService = require('../services/operatorService');
const PassengerService = require('../services/passengerService');
const busService = require('../services/busService');

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
            token: token,
            fname: admin.fname
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// get dashboard stats
router.get('/dashboard-stats', authMiddleware, async (req, res) => {
    try {
        const stats = await Admin.getDashboardStats();        
        res.status(200).json(stats);        
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Database error fetching stats' });
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
// operator routes
router.get('/operators', authMiddleware, async (req, res) => {
    try {
        const operators = await OperatorService.getAllOperators();
        res.json(operators);
    } catch (error) {
        console.error('Error fetching operators:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});
// Create an operator
router.post('/operators/create', authMiddleware, async (req, res) => {
    const { fname, lname, username, email, phone, password } = req.body;

    if (!fname || !lname || !username || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        const newId = await OperatorService.createOperator({ 
            fname, lname, username, email, phone, password 
        });
        res.status(201).json({ message: 'Operator created', operator_id: newId });
    } catch (error) {
        console.error('Error creating operator:', error);
        res.status(500).json({ error: 'Database Error (Username/Email might already exist)' });
    }
});
// Update an operator
router.put('/operators/update/:id', authMiddleware, async (req, res) => {
    try {
        const success = await OperatorService.updateOperator(req.params.id, req.body);
        if (success) {
            res.json({ message: 'Operator updated successfully' });
        } else {
            res.status(404).json({ message: 'Operator not found' });
        }
    } catch (error) {
        console.error('Error updating operator:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});
// Deactivate an operator
router.put('/operators/deactivate/:id', authMiddleware, async (req, res) => {
    try {
        const success = await OperatorService.deactivateOperator(req.params.id);
        if (success) {
            res.json({ message: 'Operator deactivated' });
        } else {
            res.status(404).json({ message: 'Operator not found' });
        }
    } catch (error) {
        console.error('Error deactivating operator:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Passenger Routes
router.get('/passengers', authMiddleware, async (req, res) => {
    try {
        const passengers = await PassengerService.getAllPassengers();
        res.json(passengers);
    } catch (error) {
        console.error('Error fetching passengers:', error);
        res.status(500).json({ error: 'Database Error' });
    }
});

router.post('/passengers/create', authMiddleware, async (req, res) => {
    try {
        const newId = await PassengerService.createPassengerAdmin(req.body);
        res.status(201).json({ message: 'Passenger created successfully', passenger_id: newId });
    } catch (error) {
        console.error('Error creating passenger:', error);
        res.status(500).json({ error: 'Database Error' });
    }
});

router.put('/passengers/update/:id', authMiddleware, async (req, res) => {
    try {
        const success = await PassengerService.updatePassengerAdmin(req.params.id, req.body);
        if (success) {
            res.json({ message: 'Passenger updated successfully' });
        } else {
            res.status(404).json({ message: 'Passenger not found' });
        }
    } catch (error) {
        console.error('Error updating passenger:', error);
        res.status(500).json({ error: 'Database Error' });
    }
});

router.put('/passengers/deactivate/:id', authMiddleware, async (req, res) => {
    try {
        const success = await PassengerService.deactivatePassengerAdmin(req.params.id);
        if (success) {
            res.json({ message: 'Passenger deactivated' });
        } else {
            res.status(404).json({ message: 'Passenger not found' });
        }
    } catch (error) {
        console.error('Error deactivating passenger:', error);
        res.status(500).json({ error: 'Database Error' });
    }
});

//  available RFID cards dropdowns
router.get('/available-cards', authMiddleware, async (req, res) => {
    try {
        const cards = await PassengerService.getAvailableCards();
        res.json(cards);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Database Error' });
    }
});
router.post('/passengers/replace-card', authMiddleware, async (req, res) => {
    const { passenger_id, new_card_id } = req.body;
    if (!passenger_id || !new_card_id) {
        return res.status(400).json({ message: 'Passenger and New Card are required' });
    }
    try {
        const success = await PassengerService.replaceCard(passenger_id, new_card_id);
        if (success) {
            res.json({ message: 'Card replaced successfully' });
        } else {
            res.status(400).json({ message: 'Card replacement failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database Error' });
    }
});

// Current Running Bus Status
router.get('/bus-status', authMiddleware, async (req, res) => {
    try {
        const buses = await busService.getLiveBusStatus();
        
        res.status(200).json(buses);
        
    } catch (error) {
        console.error('Route Error fetching bus status:', error.message);
        
        if (error.message === 'DATABASE_ERROR') {
            return res.status(500).json({ error: 'Database error fetching bus status' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;