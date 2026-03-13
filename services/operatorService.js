const Operator = require('../models/Operator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class OperatorService {
    
    static async login(req, res) {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        try {
            const operator = await Operator.findByUsername(username);
            
            
            if (!operator || operator.status !== 'ACTIVE') {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            
            const isMatch = await bcrypt.compare(password, operator.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            
            const token = jwt.sign(
                { operatorId: operator.operator_id, role: 'operator' },
                process.env.JWT_SECRET || 'default_secret_key',
                { expiresIn: '8h' }
            );

            res.status(200).json({
                message: 'Login successful',
                token: token,
                fname: operator.fname,
                username: operator.username
            });
        } catch (error) {
            console.error('Operator login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    }

    
    static async getAllOperators() {
        try {
            return await Operator.findAll();
        } catch (error) {
            console.error('Error in getAllOperators:', error);
            throw error;
        }
    }

    
    static async createOperator(data) {
        try {
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);
            
            const operatorData = {
                ...data,
                password_hash: hashedPassword
            };

            return await Operator.create(operatorData);
        } catch (error) {
            console.error('Error in createOperator:', error);
            throw error;
        }
    }

    
    static async updateOperator(id, data) {
        try {
            
            if (data.password) {
                const salt = await bcrypt.genSalt(10);
                data.password_hash = await bcrypt.hash(data.password, salt);
            }
            return await Operator.update(id, data);
        } catch (error) {
            console.error('Error in updateOperator:', error);
            throw error;
        }
    }

    
    static async deactivateOperator(id) {
        try {
            return await Operator.deactivate(id);
        } catch (error) {
            console.error('Error in deactivateOperator:', error);
            throw error;
        }
    }
}

module.exports = OperatorService;