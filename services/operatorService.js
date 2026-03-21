const Operator = require('../models/Operator');
const Transaction = require('../models/Transaction');
const Bus = require('../models/Bus');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class OperatorService {

    static normalizeDateRange(fromDate, toDate, period) {
        if (fromDate || toDate) {
            return {
                fromDate: fromDate || null,
                toDate: toDate || null
            };
        }

        if (!period) {
            return { fromDate: null, toDate: null };
        }

        const now = new Date();
        const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        let start = null;

        const normalized = String(period).toLowerCase().replace(/\s+/g, '');
        if (
            normalized === 'last24hours' ||
            normalized === '24h' ||
            normalized === 'last1day' ||
            normalized === 'last1days' ||
            normalized === '1d'
        ) {
            start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 1);
        } else if (normalized === 'last3days' || normalized === '3d') {
            start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 2);
        } else if (normalized === 'last7days' || normalized === '7d') {
            start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 6);
        } else if (normalized === 'last30days' || normalized === '30d') {
            start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 29);
        } else if (normalized === 'last60days' || normalized === '60d') {
            start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 59);
        } else {
            throw new Error('INVALID_PERIOD');
        }

        const toIsoDate = (dateObj) => dateObj.toISOString().slice(0, 10);
        return {
            fromDate: toIsoDate(start),
            toDate: toIsoDate(end)
        };
    }
    
    static async login(username, password) {
        if (!username || !password) {
            throw new Error('MISSING_DATA');
        }

        const operator = await Operator.findByUsername(username);
        
        if (!operator || operator.status !== 'ACTIVE') {
            throw new Error('INVALID_CREDENTIALS');
        }

        if (!operator.password_hash) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const isMatch = await bcrypt.compare(password, operator.password_hash);
        if (!isMatch) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const token = jwt.sign(
            { operatorId: operator.operator_id, role: 'operator' },
            process.env.JWT_SECRET || 'default_secret_key',
            { expiresIn: '8h' }
        );

        return {
            message: 'Login successful',
            token: token,
            fname: operator.fname,
            operator_id: operator.operator_id
        };
    }

    static async getProfile(operatorId) {
        const operator = await Operator.findById(operatorId);
        if (!operator) {
            throw new Error('NOT_FOUND');
        }
        
        delete operator.password_hash; 
        return operator;
    }

    static async getEarnings(operatorId, fromDate, toDate, period) {
        if (!operatorId) {
            throw new Error('MISSING_OPERATOR_ID');
        }

        const normalizedRange = OperatorService.normalizeDateRange(fromDate, toDate, period);
        const effectiveFrom = normalizedRange.fromDate;
        const effectiveTo = normalizedRange.toDate;

        if ((effectiveFrom && !effectiveTo) || (!effectiveFrom && effectiveTo)) {
            throw new Error('INVALID_DATE_RANGE');
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if ((effectiveFrom && !dateRegex.test(effectiveFrom)) || (effectiveTo && !dateRegex.test(effectiveTo))) {
            throw new Error('INVALID_DATE_FORMAT');
        }

        if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
            throw new Error('INVALID_DATE_RANGE');
        }

        const result = await Transaction.getOperatorEarningsSummary(operatorId, effectiveFrom, effectiveTo);

        const normalizedRows = (result.tableRows || []).map((row) => ({
            date: row.date,
            bus: row.bus,
            route: row.route,
            trips_count: row.trips_count,
            total_fares: row.total_fares,
            tripsCount: row.trips_count,
            totalFares: row.total_fares
        }));

        return {
            operator_id: Number(operatorId),
            operatorId: Number(operatorId),
            range: {
                from: effectiveFrom || null,
                to: effectiveTo || null,
                period: period || null
            },
            totals: result.totals,
            daily: result.dailyBreakdown,
            earnings_by_date: normalizedRows,
            earningsByDate: normalizedRows,
            rows: normalizedRows,
            data: normalizedRows,
            timestamp_column: result.timestampColumn,
            timestampColumn: result.timestampColumn,
            time_source: result.timeSource,
            timeSource: result.timeSource,
            note: result.timeSource
                ? null
                : 'No time column found in Transaction or Trip table. Date filtering and earnings-by-date breakdown are unavailable.'
        };
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
            if (error.code === 'ER_DUP_ENTRY') {
                const sqlMsg = error.sqlMessage || '';
                if (sqlMsg.includes('username')) throw new Error('This username is already taken. Please choose another.');
                if (sqlMsg.includes('email')) throw new Error('An account with this email already exists.');
                if (sqlMsg.includes('phone')) throw new Error('This phone number is already registered.');
                throw new Error('This operator already exists in the system.');
            }
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
            if (error.code === 'ER_DUP_ENTRY') {
                const sqlMsg = error.sqlMessage || '';
                if (sqlMsg.includes('username')) throw new Error('This username is already taken.');
                if (sqlMsg.includes('email')) throw new Error('This email is already in use.');
                if (sqlMsg.includes('phone')) throw new Error('This phone number is already in use.');
                throw new Error('Data conflicts with an existing operator.');
            }
            console.error('Error in updateOperator:', error);
            throw error;
        }
    }

    static async updateOperatorStatus(id, status) {
        try {
            return await Operator.updateStatus(id, status);
        } catch (error) {
            console.error('Error in updateOperatorStatus:', error);
            throw error;
        }
    }

    static async deleteOperator(id) {
        try {
            const success = await Operator.delete(id);
            if (!success) throw new Error('Operator not found');
            return success;
        } catch (error) {
            console.error('Error in deleteOperator:', error);
            throw error;
        }
    }

    static async updateBus(operatorId, busId, data) {
        if (!operatorId || !busId) {
            throw new Error('MISSING_IDS');
        }

        const normalized = {
            bus_name: String(data.bus_name || '').trim(),
            model: String(data.model || '').trim(),
            registration_number: String(data.registration_number || '').trim(),
            capacity: Number(data.capacity)
        };

        if (!normalized.bus_name || !normalized.model || !normalized.registration_number || !Number.isFinite(normalized.capacity) || normalized.capacity <= 0) {
            throw new Error('INVALID_BUS_DATA');
        }

        try {
            const updated = await Bus.updateBusById(Number(busId), Number(operatorId), normalized);
            if (!updated) {
                throw new Error('BUS_NOT_FOUND_OR_FORBIDDEN');
            }
            return true;
        } catch (error) {
            if (error && error.code === 'ER_DUP_ENTRY') {
                throw new Error('DUPLICATE_REGISTRATION_NUMBER');
            }
            throw error;
        }
    }

    static async deleteBus(busId) {
        try {
            return await Operator.deleteBus(busId); 
        } catch (error) {
            throw error;
        }
    }

    static async getMyBuses(operatorId) {
        try {
            return await Operator.findBusesByOperator(operatorId);
        } catch (error) {
            console.error('Error in getMyBuses:', error);
            throw error;
        }
    }

    static async createBus(data) {
        try {
            return await Operator.createBus(data);
        } catch (error) {
            console.error('Error in createBus:', error);
            throw error;
        }
    }

    static async getDashboardData(operatorId) {
        try {
            return await Operator.getDashboardStats(operatorId);
        } catch (error) {
            console.error('Error in getDashboardData Service:', error);
            throw error;
        }
    }

    static async updateMyProfile(operatorId, data) {
        const operator = await Operator.findById(operatorId);
        if (!operator) throw new Error('Operator not found');

        let updateData = {
            fname: data.fname,
            lname: data.lname,
            email: data.email,
            phone: data.phone
        };

        if (data.currPassword && data.newPassword) {
            const isMatch = await bcrypt.compare(data.currPassword, operator.password_hash);
            if (!isMatch) {
                throw new Error('INCORRECT_PASSWORD');
            }
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(data.newPassword, salt);
        }

        try {
            return await Operator.updateProfile(operatorId, updateData);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                const sqlMsg = error.sqlMessage || '';
                if (sqlMsg.includes('email')) throw new Error('This email is already linked to another account.');
                if (sqlMsg.includes('phone')) throw new Error('This phone number is already registered.');
                throw new Error('Data conflicts with an existing operator.');
            }
            throw error;
        }
    }
}

module.exports = OperatorService;