// =============================================
// server.js - Entry Point
// =============================================
// This is the file Node.js runs to start the server.
// It connects to the database first, then starts listening for requests.

require("dotenv").config(); // Load .env variables first

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas, then start the Express server
const startServer = async () => {
  await connectDB(); // Wait for DB connection before accepting requests

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
    console.log(`📊 Sensors:    http://localhost:${PORT}/api/sensors`);
  });
};

startServer();
