const db = require('../config/db');

class Card {
    constructor(data) {
        this.card_id = data.card_id;
        this.rfid_uid = data.rfid_uid;
        this.status = data.status || 'ACTIVE';
        
        // Combine first and last name if a passenger is assigned
        if (data.first_name && data.last_name) {
            this.passenger_name = `${data.first_name} ${data.last_name}`;
        } else {
            this.passenger_name = 'Unassigned';
        }
    }

    static findByRfid(rfid_uid) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM `Card` WHERE rfid_uid = ?';
            db.query(query, [rfid_uid], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });
    }

    static findAll() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.card_id, c.rfid_uid, c.status, p.first_name, p.last_name 
                FROM \`Card\` c
                LEFT JOIN \`Passenger\` p ON c.card_id = p.card_id
                ORDER BY c.card_id DESC
            `;
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results.map(row => new Card(row)));
            });
        });
    }

    static create(rfid_uid) {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO `Card` (rfid_uid, status) VALUES (?, ?)';
            db.query(query, [rfid_uid, 'ACTIVE'], (err, results) => {
                if (err) return reject(err);
                resolve(results.insertId);
            });
        });
    }

    static updateStatus(id, newStatus) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE `Card` SET status = ? WHERE card_id = ?';
            db.query(query, [newStatus, id], (err, results) => {
                if (err) return reject(err);
                resolve(results.affectedRows > 0);
            });
        });
    }
}

module.exports = Card;