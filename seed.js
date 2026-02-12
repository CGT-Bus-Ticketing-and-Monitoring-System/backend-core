const bcrypt = require('bcrypt');
const db = require('./db');
require('dotenv').config();

const seedPassenger = async () => {
    try {

        console.log('Connected to MySQL Database for Seeding');

        //create a sample passenger
        const username = 'testuser';
        const password = 'testpassword';
        const firstName = 'Test';
        const lastName = 'User';
        const email = 'testuser@example.com';
        const phone = '1234567890';

        //Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `INSERT INTO Passenger (username, password_hash, first_name, last_name, email, phone) 
                       VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [username, passwordHash, firstName, lastName, email, phone];

        await new Promise((resolve, reject) => {
            db.query(query, values, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
        
        console.log('Passenger Seeded Successfully');
        console.log(`Username: ${username}`);
        console.log(`Password: ${password}`);

    } 
    catch (error) 
    {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('Passenger already exists. Skipping seeding.');
        }
        else {
            console.error('Error Seeding Passenger:', error);
        }
    }
    finally {
        console.log('Closing Database Connection');
        db.end();
    }
}

seedPassenger();