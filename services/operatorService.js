const Operator = require('../models/Operator');
const bcrypt = require('bcrypt');

class OperatorService {
    
    static async getAllOperators() {
        return await Operator.findAll();
    }

    static async createOperator(data) {
        // Hash the password here!
        const password_hash = await bcrypt.hash(data.password, 10);
        
        // Pass the hashed password down to the model
        const insertId = await Operator.create({
            fname: data.fname,
            lname: data.lname,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password_hash: password_hash
        });
        
        return insertId;
    }

    static async updateOperator(id, data) {
        let password_hash = null;
        
        // Only hash if a new password was provided
        if (data.password && data.password.trim() !== '') {
            password_hash = await bcrypt.hash(data.password, 10);
        }

        const success = await Operator.update(id, {
            fname: data.fname,
            lname: data.lname,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password_hash: password_hash
        });

        return success;
    }

    static async deactivateOperator(id) {
        return await Operator.deactivate(id);
    }
}

module.exports = OperatorService;