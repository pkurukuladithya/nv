// =============================================
// app.js - Express Application Configuration
// =============================================

const express = require("express");
const cors = require("cors");

require("dotenv").config();

const sensorRoutes = require("./routes/sensorRoutes");
const deviceRoutes = require("./routes/deviceRoutes");

const app = express();

// -------------------------------------------------------
// MIDDLEWARE
// -------------------------------------------------------

const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());

// -------------------------------------------------------
// ROUTES
// -------------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IoT Sensor API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Sensor readings (CRUD + per-device filter)
app.use("/api/sensors", sensorRoutes);

// Device status board
app.use("/api/devices", deviceRoutes);

// -------------------------------------------------------
// 404 HANDLER
// -------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// -------------------------------------------------------
// GLOBAL ERROR HANDLER
// -------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ success: false, message: "An unexpected server error occurred" });
});

module.exports = app;
