const db = require("../config/db");

console.log("Smart Bus Route Simulator Starting...");

/*BUS ROUTES (WAYPOINTS)

Each bus moves through these points
then loops back to the start
*/

const routes = {
  1: [
    { lat: 6.9344, lng: 79.8428 },
    { lat: 6.9271, lng: 79.8612 },
    { lat: 6.9147, lng: 79.8731 },
    { lat: 6.9000, lng: 79.8900 },
    { lat: 6.8860, lng: 79.9000 }
  ],

  2: [
    { lat: 6.9044, lng: 79.8528 },
    { lat: 6.9123, lng: 79.8645 },
    { lat: 6.9200, lng: 79.8800 },
    { lat: 6.9300, lng: 79.9000 },
    { lat: 6.9450, lng: 79.9150 }
  ],

  3: [
    { lat: 7.2960, lng: 80.6337 },
    { lat: 7.2800, lng: 80.6400 },
    { lat: 7.2600, lng: 80.6500 },
    { lat: 7.2400, lng: 80.6600 },
    { lat: 7.2200, lng: 80.6700 }
  ]
};

/*TRACK CURRENT TARGET POINT

Each bus remembers which waypoint
it is travelling toward
*/

const routeIndex = {};

Object.keys(routes).forEach(busId => {
  routeIndex[busId] = 0;
});

/*MOVEMENT SETTINGS*/

const speed = 0.0015; // movement distance per update

/*MAIN SIMULATION LOOP*/

const simulateMovement = () => {

  const fetchQuery = `
    SELECT ll.bus_id, ll.latitude, ll.longitude
    FROM LocationLog ll
    INNER JOIN (
        SELECT bus_id, MAX(timestamp) AS max_ts
        FROM LocationLog
        GROUP BY bus_id
    ) latest 
    ON ll.bus_id = latest.bus_id 
    AND ll.timestamp = latest.max_ts
  `;

  db.query(fetchQuery, (err, buses) => {

    if (err) {
      console.error("DB error:", err);
      return;
    }

    buses.forEach(bus => {

      const path = routes[bus.bus_id];
      if (!path) return;

      let lat = parseFloat(bus.latitude);
      let lng = parseFloat(bus.longitude);

      let targetIndex = routeIndex[bus.bus_id];
      const target = path[targetIndex];

      const dLat = target.lat - lat;
      const dLng = target.lng - lng;

      const distance = Math.sqrt(dLat*dLat + dLng*dLng);

      /*IF BUS REACHED THE WAYPOINT*/

      if (distance < 0.0002) {

        routeIndex[bus.bus_id] =
          (targetIndex + 1) % path.length;

        console.log(
          `Bus ${bus.bus_id} heading to next stop`
        );

        return;
      }

      /*MOVE BUS TOWARD TARGET*/

      const newLat =
        lat + (dLat / distance) * speed;

      const newLng =
        lng + (dLng / distance) * speed;

      const insertQuery =
        "INSERT INTO LocationLog (bus_id, latitude, longitude) VALUES (?, ?, ?)";

      db.query(insertQuery, [bus.bus_id, newLat, newLng]);

      console.log(
        `Bus ${bus.bus_id} -> ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`
      );

    });

  });

};

/*RUN EVERY 2 SECONDS*/

const interval = setInterval(simulateMovement, 2000);

process.on("SIGINT", () => {

  clearInterval(interval);

  console.log("\n Simulation Stopped");

  db.end(() => process.exit());

});