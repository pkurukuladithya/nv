// =============================================
// sensorController.js - Request Handlers
// =============================================
// Controllers contain the logic for each API endpoint.
// They receive (req, res) from Express routes and send back JSON responses.

const SensorReading = require("../models/sensorReadingModel");

// -------------------------------------------------------
// GET /api/sensors
// Returns all sensor readings, newest first
// -------------------------------------------------------
const getAllSensors = async (req, res) => {
  try {
    // Find all documents, sorted by createdAt descending (-1 = newest first)
    const readings = await SensorReading.find().sort({ createdAt: -1 });

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
// Returns the single most recent sensor reading
// -------------------------------------------------------
const getLatestSensor = async (req, res) => {
  try {
    // findOne with sort gives us just the most recent document
    const reading = await SensorReading.findOne().sort({ createdAt: -1 });

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
// GET /api/sensors/:id
// Returns a single reading by its MongoDB _id
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
    // Handle invalid MongoDB ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid sensor ID format" });
    }
    res.status(500).json({ success: false, message: "Server error while fetching sensor" });
  }
};

// -------------------------------------------------------
// POST /api/sensors
// Creates a new sensor reading
// Body: { deviceId, analogSensor, digitalSensor, status }
// -------------------------------------------------------
const createSensor = async (req, res) => {
  try {
    const { deviceId, analogSensor, digitalSensor, status } = req.body;

    // Basic validation - ensure required fields are present
    if (deviceId === undefined || analogSensor === undefined || digitalSensor === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: deviceId, analogSensor, digitalSensor",
      });
    }

    // Create and save the new document
    const newReading = await SensorReading.create({
      deviceId,
      analogSensor,
      digitalSensor,
      status,
    });

    res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    console.error("Error creating sensor reading:", error.message);
    // Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error while creating sensor reading" });
  }
};

// -------------------------------------------------------
// DELETE /api/sensors/:id
// Deletes a single reading by its MongoDB _id
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

// Export all controller functions so routes can use them
module.exports = {
  getAllSensors,
  getLatestSensor,
  getSensorById,
  createSensor,
  deleteSensor,
};
