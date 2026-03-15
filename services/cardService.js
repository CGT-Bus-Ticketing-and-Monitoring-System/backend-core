const Card = require('../models/Card');

class CardService {
    static async getAllCards() {
        return await Card.findAll();
    }

    static async issueCard(rfid_uid) {
        // Prevent duplicate cards
        const existingCard = await Card.findByRfid(rfid_uid);
        if (existingCard) {
            throw new Error('This RFID UID is already registered.');
        }

        return await Card.create(rfid_uid);
    }

    static async changeCardStatus(id, status) {
        const success = await Card.updateStatus(id, status);
        if (!success) throw new Error('Card not found.');
        return success;
    }
}

module.exports = CardService;