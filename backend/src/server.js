// =============================================
// server.js - Entry Point
// =============================================
// Connects to MongoDB, starts the MQTT subscriber,
// then starts the HTTP server.

require("dotenv").config();

const app = require("./app");
const startMqttSubscriber = require("./services/mqttSubscriber");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Start the MQTT subscriber (runs in background, keeps data in memory)
  startMqttSubscriber();

  // 3. Start the Express HTTP server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API Health:      http://localhost:${PORT}/api/health`);
    console.log(`📊 Sensors:         http://localhost:${PORT}/api/sensors`);
    console.log(`📊 Latest:          http://localhost:${PORT}/api/sensors/latest`);
    console.log(`📊 Device Status:   http://localhost:${PORT}/api/devices/status`);
  });
};

startServer();
