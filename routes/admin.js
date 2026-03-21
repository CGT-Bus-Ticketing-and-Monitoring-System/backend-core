const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');

const Admin = require('../models/Admin');
const authMiddleware = require('../middleware/authMiddleware');
const OperatorService = require('../services/operatorService');
const PassengerService = require('../services/passengerService');
const busService = require('../services/busService');
const ScheduleService = require('../services/scheduleService');
const AdminService = require('../services/adminService');
const CardService = require('../services/cardService');
const routeService = require('../services/routeService'); 
const ReportService = require('../services/reportService');

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
        const routes = await routeService.getAllRoutes();
        res.json(routes);
    } catch (error) {
        console.error('Errors fetching routes', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

//route creation 
router.post('/routes/create', async (req, res) => {
    const {route_code, start_location, end_location, base_fare} = req.body;

    if (!route_code || !start_location || !end_location || !base_fare) {
        return res.status(400).json({message: 'All fields required'});
    }
    
    try {
        const newId = await routeService.createRoute({route_code, start_location, end_location, base_fare}); 
        res.status(201).json({message: 'Route Created', route_id: newId});
    } catch (error) {
        if (error.isDuplicate || error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({message: 'A route with this code already exists!'});
        }
        console.error('Error creating route: ', error);
        res.status(500).json({message: 'Database Error. Please try again later.'}); 
    }
});

//updating routes
router.put('/routes/update/:id', async (req, res) => {
    const {start_location, end_location, base_fare} = req.body;
    try {
        const success = await routeService.updateRoute(req.params.id, {start_location, end_location, base_fare});
        if (success) {
            res.json({message: 'Route updated Sucessfully'});
        } else {
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
        const success = await routeService.deactivateRoute(req.params.id); 
        if (success) {
            res.json({message: 'Route Deactivated'});
        } else {
            res.status(404).json({message: 'Route not found'});
        }
    } catch (error) {
        console.error('Error Deactivating route: ', error);
        res.status(500).json({error: 'Database Error'});
    }
});

//activate routes
router.put('/routes/activate/:id', async (req, res) => {
    try {
        const success = await routeService.activateRoute(req.params.id); 
        if (success) {
            res.json({message: 'Route Activated'});
        } else {
            res.status(404).json({message: 'Route not found'});
        }
    } catch (error) {
        console.error('Error Activating route: ', error);
        res.status(500).json({error: 'Database Error'});
    }
});

// Permanent delete route
router.delete('/routes/:id', async (req, res) => {
    try {
        const success = await routeService.deleteRoute(req.params.id);
        if (success) {
            res.json({ message: 'Route permanently deleted' });
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (error) {
        console.error('Error deleting route:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ message: 'Cannot delete this route because buses are currently assigned to it.' });
        }
        
        res.status(500).json({ error: 'Database Error' });
    }
});

// Load data for the dropdowns
router.get('/routes/assignment-data', async (req, res) => {
    try {
        const data = await routeService.getDropdownData(); 
        res.json(data);
    } catch (error) {
        console.error('Error fetching assignment data:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Assign a bus to a route
router.post('/routes/assign-bus', async (req, res) => {
    const { route_id, bus_reg_no } = req.body;
    
    if (!route_id || !bus_reg_no) {
        return res.status(400).json({ message: 'Route ID and Bus Registration Number are required' });
    }

    try {
        const success = await routeService.assignBusToRoute(route_id, bus_reg_no);
        if (success) {
            res.json({ message: 'Bus successfully assigned to route' });
        } else {
            res.status(404).json({ message: 'Route or Bus not found' });
        }
    } catch (error) {
        console.error('Error assigning bus:', error);
        res.status(500).json({ error: 'Database Error' });
    }
});

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
        console.error('Create Operator Error:', error.message);
        
        if (error.message.includes('already') || error.message.includes('conflicts')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error creating operator' });
    }
});

// Update an operator
router.put('/operators/update/:id', authMiddleware, async (req, res) => {
    try {
        await OperatorService.updateOperator(req.params.id, req.body);
        res.status(200).json({ message: 'Operator updated successfully' });
        
    } catch (error) {
        console.error('Update Operator Error:', error.message);
        
        if (error.message.includes('already') || error.message.includes('conflicts')) {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === 'Operator not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error updating operator' });
    }
});

// Update Operator Status
router.put('/operators/status/:id', authMiddleware, async (req, res) => {
    const { status } = req.body;
    
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
    }

    try {
        const success = await OperatorService.updateOperatorStatus(req.params.id, status);
        if (success) {
            res.json({ message: `Operator marked as ${status}` });
        } else {
            res.status(404).json({ message: 'Operator not found' });
        }
    } catch (error) {
        console.error('Error updating operator status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Permanently Delete Operator
router.delete('/operators/:id', authMiddleware, async (req, res) => {
    try {
        const success = await OperatorService.deleteOperator(req.params.id);
        if (success) {
            res.json({ message: 'Operator permanently deleted' });
        } else {
            res.status(404).json({ message: 'Operator not found' });
        }
    } catch (error) {
        console.error('Error deleting operator:', error);
        res.status(500).json({ message: 'Server Error' });
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
        if (error.message.includes('already') || error.message.includes('conflicts')) {
            return res.status(409).json({ message: error.message });
        }
        console.error('Error creating passenger:', error);
        res.status(500).json({ message: 'Database Error' });
    }
});

router.put('/passengers/update/:id', authMiddleware, async (req, res) => {
    try {
        await PassengerService.updatePassengerAdmin(req.params.id, req.body);
        res.status(200).json({ message: 'Passenger updated successfully' });
    } catch (error) {
        if (error.message.includes('already') || error.message.includes('conflicts')) {
            return res.status(409).json({ message: error.message });
        }
        console.error('Error updating passenger:', error);
        res.status(500).json({ message: 'Database Error' });
    }
});

// Update passenger status
router.put('/passengers/status/:id', authMiddleware, async (req, res) => {
    const { status } = req.body;
    try {
        await PassengerService.updatePassengerStatus(req.params.id, status);
        res.json({ message: `Passenger marked as ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Database Error' });
    }
});

// Permanently Delete Passenger
router.delete('/passengers/:id', authMiddleware, async (req, res) => {
    try {
        await PassengerService.deletePassenger(req.params.id);
        res.json({ message: 'Passenger permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database Error' });
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

//admin-mngment
router.get('/manage', authMiddleware, async (req, res) => {
    try {
        const admins = await AdminService.getAllAdmins();
        res.status(200).json(admins);
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ message: 'Server error fetching admins' });
    }
});


// Register Admin
router.post('/manage/register', authMiddleware, async (req, res) => {
    try {
        const { fname, lname, username, email, phone, password } = req.body;
        if (!fname || !username || !password) {
            return res.status(400).json({ message: 'First name, username, and password are required' });
        }

        const newId = await AdminService.registerAdmin(req.body);
        res.status(201).json({ message: 'Admin registered successfully', admin_id: newId });
        
    } catch (error) {
        console.error('Registration Error:', error.message);

        if (error.message.includes('already') || error.message.includes('conflicts')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error registering admin' });
    }
});

// Update Admin
router.put('/manage/update/:id', authMiddleware, async (req, res) => {
    try {
        await AdminService.updateAdmin(req.params.id, req.body);
        res.status(200).json({ message: 'Admin updated successfully' });
        
    } catch (error) {
        console.error('Update Error:', error.message);

        if (error.message.includes('already') || error.message.includes('conflicts')) {
            return res.status(409).json({ message: error.message });
        }
        if (error.message === 'Admin not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error updating admin' });
    }
});

// Update Admin Status
router.put('/manage/status/:id', async (req, res) => {
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
    }

    try {
        const success = await AdminService.updateAdminStatus(req.params.id, status);
        if (success) {
            res.json({ message: `Admin marked as ${status}` });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        console.error('Error updating admin status:', error);
        res.status(500).json({ message: 'Database Error. Please try again later.' });
    }
});

// Permanently Remove Admin
router.delete('/manage/:id', async (req, res) => {
    try {
        const success = await AdminService.deleteAdmin(req.params.id);
        if (success) {
            res.json({ message: 'Admin permanently deleted' });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ message: 'Database Error. Please try again later.' });
    }
});

//rfid-cards
router.get('/cards', authMiddleware, async (req, res) => {
    try {
        const cards = await CardService.getAllCards();
        res.status(200).json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ message: 'Server error fetching cards' });
    }
});


router.post('/cards/register', authMiddleware, async (req, res) => {
    try {
        const { rfid_uid } = req.body;
        if (!rfid_uid) {
            return res.status(400).json({ message: 'RFID UID is required' });
        }

        const newId = await CardService.issueCard(rfid_uid);
        res.status(201).json({ message: 'Card registered successfully', card_id: newId });
        
    } catch (error) {
        console.error('Error registering card:', error);
        if (error.message === 'This RFID UID is already registered.') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error registering card' });
    }
});

// updating Card Status (Block/Activate)
router.put('/cards/status/:id', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status) return res.status(400).json({ message: 'Status is required' });

        await CardService.changeCardStatus(req.params.id, status);
        res.status(200).json({ message: `Card status updated to ${status}` });
    } catch (error) {
        console.error('Error updating card status:', error);
        res.status(400).json({ message: error.message || 'Server error updating card' });
    }
});

// Get all active routes for dropdowns
router.get('/routes', authMiddleware, async (req, res) => {
    try {
        const routes = await routeService.getActiveRoutes();
        res.status(200).json(routes);
    } catch (error) {
        console.error('Error fetching routes:', error);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
});

// Get all active buses for dropdowns
router.get('/buses', authMiddleware, async (req, res) => {
    try {
        const buses = await busService.getActiveStatusBuses();
        res.status(200).json(buses);
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({ error: 'Failed to fetch buses' });
    }
});

// Get schedules for a specific route
router.get('/schedules/route/:routeId', authMiddleware, async (req, res) => {
    try {
        const schedules = await ScheduleService.getSchedulesByRoute(req.params.routeId);
        res.status(200).json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ message: 'Server error fetching schedules' });
    }
});

// Add a new schedule
router.post('/schedules', authMiddleware, async (req, res) => {
    try {
        const newId = await ScheduleService.addSchedule(req.body);
        res.status(201).json({ message: 'Schedule added successfully', schedule_id: newId });
    } catch (error) {
        console.error('Error adding schedule:', error);
        res.status(500).json({ message: 'Server error adding schedule' });
    }
});

// Update a schedule
router.put('/schedules/:id', authMiddleware, async (req, res) => {
    try {
        await ScheduleService.updateSchedule(req.params.id, req.body);
        res.status(200).json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ message: 'Server error updating schedule' });
    }
});

// Update Schedule Status (Activate / Deactivate)
router.put('/schedules/status/:id', async (req, res) => {
    const { status } = req.body;
    
    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
    }

    try {
        const success = await ScheduleService.updateScheduleStatus(req.params.id, status);
        if (success) {
            res.json({ message: `Schedule marked as ${status}` });
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (error) {
        console.error('Error updating schedule status:', error);
        res.status(500).json({ message: 'Database Error. Please try again later.' });
    }
});

// Delete a schedule
router.delete('/schedules/:id', authMiddleware, async (req, res) => {
    try {
        await ScheduleService.deleteSchedule(req.params.id);
        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ message: 'Server error deleting schedule' });
    }
});

// Summary Report 
router.get('/reports/summary', authMiddleware, async (req, res) => {
    console.log(`Backend hit! Requesting report for ${req.query.days} days.`);
    
    try {
        const days = req.query.days || 30; 
        const reportData = await ReportService.getSummaryReport(days);

        res.status(200).json(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;