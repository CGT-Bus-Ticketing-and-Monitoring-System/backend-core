const request = require('supertest');
const app = require('../../server');

describe('Integration Test: IoT System Routing (/api/iotSystem/tap)', () => {
    it('Scenario 1: Should reject a TAP request if the hardware fails to send an RFID UID', async () => {
        
        //Simulating a broken scanner that only sends bus_id
        const response = await request(app)
            .post('/api/iotSystem/tap')
            .send({ bus_id: 5 });

        //Expects the route to catch and throw a 404 bad request
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('RFID and BusId required');
    });

    it('Scenario 2: Should reject a TAP request if the GPS fails to send the Bus ID', async () => {
        // Simulating a scanner that reads the card but doesn't know what bus it's on
        const response = await request(app)
            .post('/api/iotSystem/tap')
            .send({ rfid_uid: 'A1B2C3D4' }); 

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('RFID and BusId required');
    });

    // NOTE: Testing a successful Tap-In/Tap-Out requires the real database to be seeded.
    // GitHub Actions will handle the full DB tests, but these validation tests prove 
    // the route layer is secure!
})