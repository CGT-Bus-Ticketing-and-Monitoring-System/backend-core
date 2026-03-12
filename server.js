const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const mysql =require('mysql2'); // Use mysql2 to avoid the Auth error

// Create the connection to the database using your .env settings
const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB_NAME

});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error Connecting to the Database:', err.message);
        return;
    }
    console.log('Connected to MySQL Database'); // This is the message you want to see!
});

//Importing Routes
const passengerRoutes = require('./routes/passenger');
const tripRoutes = require('./models/Trip');
const adminRoutes = require('./routes/admin');
const iotSystemRoutes = require('./routes/iotSystem');
const testRoutes = require('./routes/test');
const operatorRoutes = require('./routes/operator'); 


const app = express();
const PORT = process.env.PORT || 3000;

// Defining Middleware 
app.use(cors());
app.use(bodyParser.json());

//Using Routes
app.use('/api/passenger', passengerRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/iotSystem', iotSystemRoutes);
app.use('/api/test', testRoutes);
app.use('/api/operator', operatorRoutes); 

//Server Startup
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});