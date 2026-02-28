const db = require('./db');

console.log("🚀 Turbo Bus Simulation Engine Starting...");

// 1. INCREASED SPEEDS (10x faster) & PADDED BOUNDARIES
const movementSpeeds = {
    1: {
        // Was 0.0004 -> Now 0.004 (approx 400m per jump)
        speedLat: -0.0040, speedLng: 0.0020,
        minLat: 6.0330, maxLat: 6.8500 // Increased Max slightly for buffer
    },
    2: {
        speedLat: 0.0030, speedLng: 0.0050,
        minLat: 6.8500, maxLat: 6.9500
    },
    3: {
        speedLat: 0.0060, speedLng: -0.0010,
        minLat: 6.9200, maxLat: 7.1800
    }
};

const simulateMovement = () => {
    const fetchQuery = `
        SELECT ll.bus_id, ll.latitude, ll.longitude
        FROM LocationLog ll
        INNER JOIN (
            SELECT bus_id, MAX(timestamp) AS max_ts
            FROM LocationLog
            GROUP BY bus_id
        ) latest ON ll.bus_id = latest.bus_id AND ll.timestamp = latest.max_ts
    `;

    db.query(fetchQuery, (err, buses) => {
        if (err) {
            console.error("❌ Error fetching locations:", err);
            return;
        }

        buses.forEach(bus => {
            const config = movementSpeeds[bus.bus_id];
            if (!config) return;

            let lat = parseFloat(bus.latitude);
            let lng = parseFloat(bus.longitude);

            // 2. BUFFER ZONE CHECK (Prevents "vibrating" at the finish line)
            // Only reverse if we are WAY past the line (0.002 buffer)
            if (lat < (config.minLat - 0.002) || lat > (config.maxLat + 0.002)) {
                config.speedLat *= -1;
                config.speedLng *= -1;
                console.log(`🔄 Bus ${bus.bus_id} turning around!`);
            }

            const newLat = lat + config.speedLat;
            const newLng = lng + config.speedLng;

            const insertQuery = "INSERT INTO LocationLog (bus_id, latitude, longitude) VALUES (?, ?, ?)";
            
            db.query(insertQuery, [bus.bus_id, newLat, newLng], (insertErr) => {
                if (!insertErr) {
                    // Log simply so terminal isn't flooded
                    console.log(`🚌 Bus ${bus.bus_id} >> ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
                }
            });
        });
    });
};

// Update every 2 seconds for smoother animation
const interval = setInterval(simulateMovement, 2000);

process.on('SIGINT', () => {
    clearInterval(interval);
    console.log("\n🛑 Simulation Stopped.");
    db.end(() => process.exit());
});