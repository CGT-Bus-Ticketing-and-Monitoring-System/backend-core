const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

//Importing Routes
const passengerRoutes = require('./routes/passenger');

const app = express();
const PORT = process.env.PORT || 3000;

// Defining Middleware 
app.use(cors());
app.use(bodyParser.json());

//Using Routes
app.use('/api/passenger', passengerRoutes);

//Server Startup
app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`);
});