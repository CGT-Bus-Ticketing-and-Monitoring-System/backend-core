const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASSWORD,
            database: process.env.DB_NAME
        });

        // This command asks MySQL for a list of all tables in your database
        const [tables] = await connection.query('SHOW TABLES');
        console.log('--- Tables found in your database ---');
        console.table(tables);

        await connection.end();
    } catch (err) {
        console.error('Error connecting:', err.message);
    }
}

checkDatabase();