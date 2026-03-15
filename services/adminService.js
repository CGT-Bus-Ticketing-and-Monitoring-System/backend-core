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

        return await Admin.create(adminData);
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

        const success = await Admin.update(id, updateData);
        if (!success) throw new Error('Admin not found or no changes made');
        return success;
    }

    static async deactivateAdmin(id) {
        const success = await Admin.deactivate(id);
        if (!success) throw new Error('Admin not found');
        return success;
    }
}

module.exports = AdminService;