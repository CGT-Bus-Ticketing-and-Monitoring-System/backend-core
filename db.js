const mysql = require('mysql')
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error Connecting to the Database', err.message);
    }
    else {
        console.log('Connected to MySQL Database');
    }
});

module.exports = db;