const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
    console.log("Starting Database Seeding process...");

    try {
        const sqlFilePath = path.join(__dirname, 'schema.sql');
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf-8');

        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || 'rootpassword',
            database: process.env.DB_NAME || 'test_db',
            multipleStatements: true 
        });

        console.log("DB Successfully connected to the Docker container!");

        console.log("Executing schema.sql...");
        await connection.query(sqlQuery);

        console.log("DB Successfully Seeded! All tables are ready");

        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed", error);
        process.exit(1);
    }
}

seedDatabase();