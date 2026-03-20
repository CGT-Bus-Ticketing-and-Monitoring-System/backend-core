const Passenger = require('../models/Passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin'); 

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
async function getProfile(passengerId) {
    const user = await  Passenger.findById(passengerId);
    if (!user) {
        throw { status: 404, message: 'User not found' };
    }
    return {
        id: user.passenger_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        balance: user.balance,
        card_uid: user.card_uid,
        email: user.email,
        phone: user.phone
    }
}

// New Admin functions

async function getAllPassengers() {
    return await Admin.findAllPassengers(); 
}
async function createPassengerAdmin(data) {
    const password_hash = await bcrypt.hash(data.password, 10);
    return await Admin.createPassenger({
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        balance: data.balance || 0.00,
        card_id: data.card_id || null,
        password_hash: password_hash
    });
}
async function updatePassengerAdmin(id, data) {
    let password_hash = null;
    if (data.password && data.password.trim() !== '') {
        password_hash = await bcrypt.hash(data.password, 10);
    }
    return await Admin.updatePassenger(id, {
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        balance: data.balance,
        password_hash: password_hash
    });
}
async function deactivatePassengerAdmin(id) {
    return await Admin.deactivatePassenger(id);
}
async function getAvailableCards() {
    return await Admin.getAvailableCards();
}
async function replaceCard(passengerId, newCardId) {
    return await Admin.replacePassengerCard(passengerId, newCardId);
}

const getAnalyticsDashboard = async (passengerId) => {
    try {
        
        const [basicStats, weeklyDbData, topRouteData] = await Promise.all([
            Passenger.getBasicAnalytics(passengerId),
            Passenger.getWeeklyTripData(passengerId),
            Passenger.getTopRoute(passengerId)
        ]);

        const totalTrips = basicStats.total_trips || 0;
        const totalSpent = basicStats.total_spent;
        const totalHours = Math.round((basicStats.total_minutes || 0) / 60);

        const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const dbDaysMap = {};
        if (weeklyDbData && weeklyDbData.length > 0) {
            weeklyDbData.forEach(row => {
                const shortDay = row.day_name.substring(0, 3);
                dbDaysMap[shortDay] = row.trip_count;
            });
        }

        const maxTrips = Math.max(...(weeklyDbData || []).map(d => d.trip_count), 1);

        const chartData = daysOfWeek.map(day => {
            const trips = dbDaysMap[day] || 0;

            const heightPercent = trips === 0 ? 5 : Math.round((trips / maxTrips) * 100);

            return {
                day: day,
                trips: trips,
                height: `${heightPercent}%`
            };
        });

        const topRoute = topRouteData ? {
            code: topRouteData.route_code,
            name: `${topRouteData.start_location} to ${topRouteData.end_location}`,
            count: topRouteData.route_count
        } : null;

        return {
            success: true,
            data: {
                totalTrips: totalTrips,
                totalSpent: totalSpent,
                totalHours: totalHours,
                weeklyChart: chartData,
                topRoute: topRoute,
            }
        };

    } catch (error) {
        console.error("Analytics Service Error:", error);
        throw new Error("Failed to generate analytics dashboard");
    }
}
module.exports = {
    login,
    updateProfile,
    changePassword,
    getProfile,
    getAnalyticsDashboard,

    getAllPassengers,
    createPassengerAdmin,
    updatePassengerAdmin,
    deactivatePassengerAdmin,
    getAvailableCards,
    replaceCard
};

