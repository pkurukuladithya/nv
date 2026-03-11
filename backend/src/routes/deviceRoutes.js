// =============================================
// deviceRoutes.js - Device Status API Routes
// =============================================

const express = require("express");
const router = express.Router();

const { getDeviceStatus } = require("../controllers/deviceController");

// GET /api/devices/status
// Returns the latest known reading for each unique device
router.get("/status", getDeviceStatus);

module.exports = router;
