const Passenger = require('../models/Passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function login({username, password}) {
    const user = await Passenger.findByUsername(username);

    if (!user) {
        throw { status: 401, message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        throw { status: 401, message: 'Invalid credentials' };
    }

    const token = jwt.sign(
        {id: user.passenger_id, username: user.username},
        process.env.JWT_SECRET || 'default_secret_key',
        {expiresIn: '7d'}
    );

    return {
        message: 'Login successful',
        token,
        user: {
            id: user.passenger_id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            balance: user.balance,
            card_uid: user.card_uid,
            email: user.email,
            phone: user.phone
        }
    };
}

async function updateProfile(passengerId, data) {
    await Passenger.updatePassenger(passengerId, data);
    const updatedUser = await Passenger.findByUsername(data.username);

    return updatedUser;
}

async function changePassword(passengerId, username, currentPassword, newPassword) {
    const user = await Passenger.findByUsername(username);

    if (!user) {
        throw { status: 404, message: 'User not found' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
        throw { status: 400, message: 'Incorrect current password' };
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    
    await Passenger.updatePassword(passengerId, newHash);
}

module.exports = {
    login,
    updateProfile,
    changePassword
};

