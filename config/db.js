const mysql = require('mysql2')
require('dotenv').config();

const db = mysql.createPool({
    connectionLimit: 10,
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.DB_NAME,

    decimalNumbers: true,
    connectTimeout: 10000,
    waitForConnections: true,
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error Connecting to the Database', err.message);
        return;
    }
    else {
        console.log('Connected to MySQL Database');
        connection.release();
    }
});

module.exports = db;