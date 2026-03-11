// =============================================
// deviceController.js - Device Status Endpoints
// =============================================
// Returns per-device status by aggregating the latest reading per device.

const SensorReading = require("../models/sensorReadingModel");

// -------------------------------------------------------
// GET /api/devices/status
// Returns the last known reading for each unique deviceId.
// Useful to show a per-device status board on the dashboard.
// -------------------------------------------------------
const getDeviceStatus = async (req, res) => {
  try {
    // Use MongoDB aggregation to get distinct deviceIds and their latest reading
    const devices = await SensorReading.aggregate([
      // Sort all readings newest-first
      { $sort: { createdAt: -1 } },

      // Group by deviceId, taking the first (= latest) document per group
      {
        $group: {
          _id: "$deviceId",
          latestReading: { $first: "$$ROOT" },
        },
      },

      // Rename _id back to deviceId for clarity
      {
        $project: {
          _id: 0,
          deviceId: "$_id",
          temperature:  "$latestReading.temperature",
          humidity:     "$latestReading.humidity",
          moisture:     "$latestReading.moisture",
          status:       "$latestReading.status",
          lastSeen:     "$latestReading.createdAt",
          receivedAt:   "$latestReading.receivedAt",
          source:       "$latestReading.source",
        },
      },

      // Alphabetical sort by deviceId
      { $sort: { deviceId: 1 } },
    ]);

    res.status(200).json({
      success: true,
      count: devices.length,
      data: devices,
    });
  } catch (error) {
    console.error("Error fetching device status:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching device status" });
  }
};

module.exports = { getDeviceStatus };
