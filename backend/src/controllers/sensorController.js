// =============================================
// sensorController.js - Request Handlers (MongoDB History)
// =============================================
// Updated for Phase 7: MongoDB history storage. SSE moved to WebSockets.

const SensorReading = require("../models/sensorReadingModel");

// -------------------------------------------------------
// GET /api/sensors
// Returns all sensor readings from MongoDB, newest first.
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
      .limit(200);

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
// Returns the single most recent sensor reading from MongoDB.
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
// Returns all readings for a specific device from MongoDB.
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
// Creates a new sensor reading via HTTP (manual/test) in MongoDB.
// -------------------------------------------------------
const createSensor = async (req, res) => {
  try {
    const { deviceId, temperature, humidity, moisture, status, fanState, motorState, systemState } = req.body;

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
      fanState:    fanState !== undefined ? fanState : null,
      motorState:  motorState !== undefined ? motorState : null,
      systemState: systemState !== undefined ? systemState : null,
      status:      status || "online",
      source:      "http",
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
// DELETE /api/sensors/clear
// Wipes the entire history in MongoDB.
// -------------------------------------------------------
const clearAllSensors = async (req, res) => {
  try {
    await SensorReading.deleteMany({}); // wipe DB

    res.status(200).json({ success: true, message: "Sensor history cleared" });
  } catch (error) {
    console.error("Error clearing sensors:", error.message);
    res.status(500).json({ success: false, message: "Server error while clearing sensors" });
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
  clearAllSensors,
  deleteSensor,
};
