const bcrypt = require('bcrypt');
const db = require('../config/db');
require('dotenv').config();

const seedPassenger = async () => {
    try {
        console.log('Connected to MySQL Database for Seeding');

        // 1. First, we need to ensure a Card exists to link to the passenger
        const testRfidUid = 'T3ST-C4RD-2026';
        await new Promise((resolve, reject) => {
            const cardQuery = `INSERT IGNORE INTO Card (rfid_uid, status) VALUES (?, 'ACTIVE')`;
            db.query(cardQuery, [testRfidUid], (err, res) => {
                if (err) reject(err);
                resolve(res);
            });
        });

        // 2. Fetch the card_id we just created (or that already existed)
        const cardId = await new Promise((resolve, reject) => {
            db.query('SELECT card_id FROM Card WHERE rfid_uid = ?', [testRfidUid], (err, results) => {
                if (err) return reject(err);
                resolve(results[0].card_id);
            });
        });

        // 3. Define the detailed Passenger data
        const passengerData = {
            username: 'traveler_prime',
            password: 'password123',
            firstName: 'Amantha',
            lastName: 'Perera',
            email: 'amantha.p@example.com',
            phone: '0775551234',
            balance: 2500.50, // Starting balance for testing fares
            cardId: cardId    // Linked to the RFID card
        };

        // 4. Hash password and Insert
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(passengerData.password, saltRounds);

        const query = `INSERT INTO Passenger 
            (username, password_hash, first_name, last_name, email, phone, balance, card_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const values = [
            passengerData.username, 
            passwordHash, 
            passengerData.firstName, 
            passengerData.lastName, 
            passengerData.email, 
            passengerData.phone,
            passengerData.balance,
            passengerData.cardId
        ];

        await new Promise((resolve, reject) => {
            db.query(query, values, (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        console.log(`Passenger ${passengerData.username} already exists.`);
                        resolve();
                    } else {
                        reject(err);
                    }
                }
                resolve(result);
            });
        });

        console.log('--- Passenger Seeded with Card & Balance ---');
        console.log(`User: ${passengerData.username} | Card UID: ${testRfidUid} | Balance: Rs. ${passengerData.balance}`);

    } catch (error) {
        console.error('Error Seeding Passenger:', error);
    } finally {
        console.log('Closing Database Connection');
        db.end();
    }
}

seedPassenger();