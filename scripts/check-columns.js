const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkColumns() {
    const connection = await mysql.createConnection({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DB_NAME
    });

    const [columns] = await connection.query('DESCRIBE Operator'); // Check the Operator table
    console.table(columns);
    await connection.end();
}
checkColumns();
