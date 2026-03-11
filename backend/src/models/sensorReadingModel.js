// =============================================
// sensorReadingModel.js - Mongoose Schema/Model
// =============================================
// This defines the shape (schema) of sensor data stored in MongoDB.
// Mongoose will automatically create a "sensorreadings" collection.

const mongoose = require("mongoose");

// Define the schema - this is like a blueprint for each sensor record
const sensorReadingSchema = new mongoose.Schema(
  {
    // deviceId: identifies which device sent the data (e.g., "ESP32_01")
    deviceId: {
      type: String,
      required: [true, "deviceId is required"],
      trim: true, // removes leading/trailing whitespace
    },

    // analogSensor: raw analog reading (e.g., 0-4095 for ESP32 12-bit ADC)
    analogSensor: {
      type: Number,
      required: [true, "analogSensor value is required"],
    },

    // digitalSensor: 0 or 1 (or true/false) for digital pins
    digitalSensor: {
      type: Number, // stored as number (0 or 1) for simplicity
      required: [true, "digitalSensor value is required"],
    },

    // status: optional text like "online", "offline", "warning"
    status: {
      type: String,
      default: "online",
      trim: true,
    },
  },
  {
    // timestamps: true automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// Create the model from the schema
// 'SensorReading' is the model name; Mongoose will use 'sensorreadings' as the collection name
const SensorReading = mongoose.model("SensorReading", sensorReadingSchema);

module.exports = SensorReading;
