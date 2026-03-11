// =============================================
// sensorRoutes.js - Express Router
// =============================================
// Routes map HTTP methods + URL paths to controller functions.
// This keeps routing logic separate from business logic.

const express = require("express");
const router = express.Router();

const {
  getAllSensors,
  getLatestSensor,
  getSensorById,
  createSensor,
  deleteSensor,
} = require("../controllers/sensorController");

// IMPORTANT: /latest must be defined BEFORE /:id
// Otherwise Express will treat "latest" as an :id parameter

// GET /api/sensors         → fetch all readings
router.get("/", getAllSensors);

// GET /api/sensors/latest  → fetch the most recent reading
router.get("/latest", getLatestSensor);

// GET /api/sensors/:id     → fetch one reading by ID
router.get("/:id", getSensorById);

// POST /api/sensors        → create a new reading
router.post("/", createSensor);

// DELETE /api/sensors/:id  → delete one reading by ID
router.delete("/:id", deleteSensor);

module.exports = router;
