const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

//Importing Routes
const passengerRoutes = require('./routes/passenger');
const trupRoutes = require('./models/Trip');
const adminRoutes = require('./routes/admin');


const app = express();
const PORT = process.env.PORT || 3000;

// Defining Middleware 
app.use(cors());
app.use(bodyParser.json());

//Using Routes
app.use('/api/passenger', passengerRoutes);
app.use('/api/trip', trupRoutes);
app.use('/api/admin', adminRoutes);

//Server Startup
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});