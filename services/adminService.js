const Admin = require('../models/Admin');
const bcrypt = require('bcrypt');

class AdminService {
    
    static async getAllAdmins() {
        return await Admin.findAll();
    }

    static async registerAdmin(data) {
        const existingAdmin = await Admin.findByUsername(data.username);
        if (existingAdmin) {
            throw new Error('Username is already taken');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        const adminData = {
            fname: data.fname,
            lname: data.lname,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password_hash: hashedPassword
        };

        try {
            return await Admin.create(adminData);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                const sqlMsg = error.sqlMessage || '';
                if (sqlMsg.includes('username')) throw new Error('This username is already taken. Please choose another.');
                if (sqlMsg.includes('email')) throw new Error('An admin account with this email already exists.');
                if (sqlMsg.includes('phone')) throw new Error('This phone number is already registered to another admin.');
                throw new Error('This admin already exists in the system.');
            }
            throw error; 
        }
    }

    static async updateAdmin(id, data) {
        const updateData = {
            fname: data.fname,
            lname: data.lname,
            username: data.username,
            email: data.email,
            phone: data.phone
        };

        if (data.password && data.password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(data.password, salt);
        }

        try {
            const success = await Admin.update(id, updateData);
            if (!success) throw new Error('Admin not found or no changes made');
            return success;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                const sqlMsg = error.sqlMessage || '';
                if (sqlMsg.includes('username')) throw new Error('This username is already taken by another admin.');
                if (sqlMsg.includes('email')) throw new Error('This email is already in use by another admin.');
                if (sqlMsg.includes('phone')) throw new Error('This phone number is already in use by another admin.');
                throw new Error('Data conflicts with an existing admin.');
            }
            throw error;
        }
    }

    static async updateAdminStatus(id, status) {
        return await Admin.updateStatus(id, status);
    }

    static async deleteAdmin(id) {
        const success = await Admin.delete(id);
        if (!success) throw new Error('Admin not found');
        return success;
    }
}

module.exports = AdminService;