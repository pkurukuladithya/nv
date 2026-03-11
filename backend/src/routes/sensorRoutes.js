// =============================================
// sensorRoutes.js - Sensor API Routes
// =============================================

const express = require("express");
const router = express.Router();

const {
  getAllSensors,
  getLatestSensor,
  getSensorsByDevice,
  getSensorById,
  createSensor,
  deleteSensor,
} = require("../controllers/sensorController");

// IMPORTANT: specific paths must come before parameterised paths.

// GET /api/sensors                          → all readings (optional ?deviceId=)
router.get("/", getAllSensors);

// GET /api/sensors/latest                   → most recent reading (optional ?deviceId=)
router.get("/latest", getLatestSensor);

// GET /api/sensors/device/:deviceId         → all readings for one device
router.get("/device/:deviceId", getSensorsByDevice);

// GET /api/sensors/:id                      → one reading by MongoDB _id
router.get("/:id", getSensorById);

// POST /api/sensors                         → create via HTTP (testing/manual)
router.post("/", createSensor);

// DELETE /api/sensors/:id                   → delete one reading
router.delete("/:id", deleteSensor);

module.exports = router;
