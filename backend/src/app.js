// =============================================
// app.js - Express Application Configuration
// =============================================
// This file sets up the Express app with middleware and routes.
// It is kept separate from server.js so it can be tested independently.

const express = require("express");
const cors = require("cors");

// Load environment variables from .env file
require("dotenv").config();

const sensorRoutes = require("./routes/sensorRoutes");

const app = express();

// -------------------------------------------------------
// MIDDLEWARE
// -------------------------------------------------------

// CORS - allow requests from the frontend origin
// In production, CORS_ORIGIN should be set to your Vercel frontend URL
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Parse incoming JSON request bodies
app.use(express.json());

// -------------------------------------------------------
// ROUTES
// -------------------------------------------------------

// Health check endpoint - useful to verify the server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "IoT Sensor API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// Mount sensor routes at /api/sensors
app.use("/api/sensors", sensorRoutes);

// -------------------------------------------------------
// 404 HANDLER - catches any undefined routes
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
