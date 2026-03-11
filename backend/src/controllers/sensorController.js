// =============================================
// sensorController.js - Request Handlers
// =============================================
// Updated for the new sensor fields: temperature, humidity, moisture.

const SensorReading = require("../models/sensorReadingModel");

// Store connected SSE clients
let sseClients = [];

// -------------------------------------------------------
// Server-Sent Events (SSE) Broadcaster
// Call this from mqttSubscriber when a new reading arrives
// -------------------------------------------------------
const broadcastNewReading = (reading) => {
  // Send to all connected clients
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${JSON.stringify(reading)}\n\n`);
    } catch (e) {
      console.error("SSE broadcast error:", e);
    }
  });
};

// -------------------------------------------------------
// GET /api/sensors/stream
// SSE endpoint for real-time updates
// -------------------------------------------------------
const streamSensors = (req, res) => {
  // SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // flush the headers to establish connection

  // Send an initial connected message
  res.write(`data: {"connected": true}\n\n`);

  // Add this client to the pool
  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Remove client when connection closes
  req.on("close", () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
};


// -------------------------------------------------------
// GET /api/sensors
// Returns all sensor readings, newest first.
// Optional query param: ?deviceId=esp32_01 to filter by device.
// -------------------------------------------------------
const getAllSensors = async (req, res) => {
  try {
    const filter = {};
    if (req.query.deviceId) {
      filter.deviceId = req.query.deviceId;
    }

    const readings = await SensorReading.find(filter)
      .sort({ createdAt: -1 })
      .limit(200); // cap at 200 records to keep responses fast

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error("Error fetching all sensors:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching sensors" });
  }
};

// -------------------------------------------------------
// GET /api/sensors/latest
// Returns the single most recent sensor reading.
// Optional: ?deviceId=esp32_01
// -------------------------------------------------------
const getLatestSensor = async (req, res) => {
  try {
    const filter = {};
    if (req.query.deviceId) {
      filter.deviceId = req.query.deviceId;
    }

    const reading = await SensorReading.findOne(filter).sort({ createdAt: -1 });

    if (!reading) {
      return res.status(404).json({ success: false, message: "No sensor readings found" });
    }

    res.status(200).json({ success: true, data: reading });
  } catch (error) {
    console.error("Error fetching latest sensor:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching latest sensor" });
  }
};

// -------------------------------------------------------
// GET /api/sensors/device/:deviceId
// Returns all readings for a specific device.
// -------------------------------------------------------
const getSensorsByDevice = async (req, res) => {
  try {
    const readings = await SensorReading.find({ deviceId: req.params.deviceId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    console.error("Error fetching sensors by device:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching device sensors" });
  }
};

// -------------------------------------------------------
// GET /api/sensors/:id
// Returns a single reading by its MongoDB _id.
// -------------------------------------------------------
const getSensorById = async (req, res) => {
  try {
    const reading = await SensorReading.findById(req.params.id);

    if (!reading) {
      return res.status(404).json({ success: false, message: "Sensor reading not found" });
    }

    res.status(200).json({ success: true, data: reading });
  } catch (error) {
    console.error("Error fetching sensor by ID:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid sensor ID format" });
    }
    res.status(500).json({ success: false, message: "Server error while fetching sensor" });
  }
};

// -------------------------------------------------------
// POST /api/sensors
// Creates a new sensor reading via HTTP (manual/test).
// Body: { deviceId, temperature, humidity, moisture, status }
// -------------------------------------------------------
const createSensor = async (req, res) => {
  try {
    const { deviceId, temperature, humidity, moisture, status } = req.body;

    if (deviceId === undefined || temperature === undefined || humidity === undefined || moisture === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: deviceId, temperature, humidity, moisture",
      });
    }

    const newReading = await SensorReading.create({
      deviceId,
      temperature,
      humidity,
      moisture,
      status: status || "online",
      source: "http",
    });

    res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    console.error("Error creating sensor reading:", error.message);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error while creating sensor reading" });
  }
};

// -------------------------------------------------------
// DELETE /api/sensors/:id
// Deletes a single reading by its MongoDB _id.
// -------------------------------------------------------
const deleteSensor = async (req, res) => {
  try {
    const reading = await SensorReading.findByIdAndDelete(req.params.id);

    if (!reading) {
      return res.status(404).json({ success: false, message: "Sensor reading not found" });
    }

    res.status(200).json({ success: true, message: "Sensor reading deleted successfully" });
  } catch (error) {
    console.error("Error deleting sensor:", error.message);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid sensor ID format" });
    }
    res.status(500).json({ success: false, message: "Server error while deleting sensor" });
  }
};

module.exports = {
  getAllSensors,
  getLatestSensor,
  getSensorsByDevice,
  getSensorById,
  createSensor,
  deleteSensor,
  streamSensors,
  broadcastNewReading,
};
