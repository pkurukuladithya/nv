// =============================================
// sensorReadingModel.js - Mongoose Schema/Model
// =============================================
// Updated to match the ESP32 / simulator MQTT payload:
// { deviceId, temperature, humidity, moisture, status, createdAt }

const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
  {
    // Identifies the device (e.g., "esp32_01")
    deviceId: {
      type: String,
      required: [true, "deviceId is required"],
      trim: true,
    },

    // DHT22 temperature in Celsius
    temperature: {
      type: Number,
      required: [true, "temperature is required"],
    },

    // DHT22 humidity in percent
    humidity: {
      type: Number,
      required: [true, "humidity is required"],
    },

    // Soil moisture (0–100 typical range)
    moisture: {
      type: Number,
      required: true,
    },
    fanState: {
      type: Boolean,
      default: null,
    },
    motorState: {
      type: Boolean,
      default: null,
    },
    systemState: {
      type: Boolean,
      default: null,
    },

    // "online" | "offline" | "warning"
    status: {
      type: String,
      default: "online",
      trim: true,
    },

    // Optional: when this record was actually received by the backend
    receivedAt: {
      type: Date,
      default: Date.now,
    },

    // Source tag: "mqtt" or "http"
    source: {
      type: String,
      default: "mqtt",
    },
  },
  {
    // Adds createdAt and updatedAt automatically.
    // createdAt will be overridden from the payload when provided.
    timestamps: true,
  }
);

const SensorReading = mongoose.model("SensorReading", sensorReadingSchema);

module.exports = SensorReading;
