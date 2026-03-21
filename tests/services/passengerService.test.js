const passengerService = require('../../services/passengerService');
const Passenger = require('../../models/Passenger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

jest.mock('../../models/Passenger');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('Unit Test: Passenger Service - Login Logic', () => {
    it('Scenario 1: Should successfully log in a user with correct credentials', async () => {
        //Setup the Fake Data
        const fakeUser = {
            passenger_id: 1,
            username: 'test_user',
            password_hash: 'hashed_password_123',
            balance: 500.00
        };

        //Program the Mocks
        Passenger.findByUsername.mockResolvedValue(fakeUser); 
        bcrypt.compare.mockResolvedValue(true);            
        jwt.sign.mockReturnValue('fake_jwt_token_999');

        //Executing Fucntion
        const result = await passengerService.login({ username: 'test_user', password: 'password123' });

        //Verify Results
        expect(result.message).toBe('Login successful');
        expect(result.token).toBe('fake_jwt_token_999');
        expect(result.user.username).toBe('test_user');

        //Verify that the code actually tried to call the DB and bcrypt
        expect(Passenger.findByUsername).toHaveBeenCalledWith('test_user');
        expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password_123');
    });

    it('Scenario 2: Should throw a 401 error if the user is not found in the database', async () => {
        
        //Programming the mock to return null
        Passenger.findByUsername.mockResolvedValue(null);

        // Try to run the function and expect it to crash with our custom error
        await expect(passengerService.login({ username: 'ghost_user', password: '123' }))
            .rejects
            .toEqual({ status: 401, message: 'User not found' });
    });

    it('Scenario 3: Should throw a 401 error if the password does not match', async () => {
        const fakeUser = { username: 'test_user', password_hash: 'real_hash' };

        Passenger.findByUsername.mockResolvedValue(fakeUser);

        bcrypt.compare.mockResolvedValue(false);

        await expect(passengerService.login({ username: 'test_user', password: 'wrong_password' }))
            .rejects
            .toEqual({ status: 401, message: 'Invalid credentials' });
    });
})
