// =============================================
// mqttSubscriber.js - MQTT Subscriber Service
// =============================================
// Connects to the MQTT broker and subscribes to device reading topics.
// Parses incoming JSON payloads and saves valid ones to MongoDB.

const mqtt = require("mqtt");
const getMqttOptions = require("../config/mqtt");
const SensorReading = require("../models/sensorReadingModel");

const { broadcastNewReading } = require("../controllers/sensorController");

// Topic pattern: devices/+/readings
// The + is a single-level wildcard that matches any deviceId
const SUBSCRIBE_TOPIC = process.env.MQTT_TOPIC_PATTERN || "devices/+/readings";

/**
 * Validates that a parsed payload contains all required fields
 * with the correct types.
 */
const validatePayload = (payload) => {
  const { deviceId, temperature, humidity, moisture } = payload;

  if (!deviceId || typeof deviceId !== "string") {
    return "Missing or invalid deviceId";
  }
  if (temperature === undefined || typeof temperature !== "number") {
    return "Missing or invalid temperature";
  }
  if (humidity === undefined || typeof humidity !== "number") {
    return "Missing or invalid humidity";
  }
  if (moisture === undefined || typeof moisture !== "number") {
    return "Missing or invalid moisture";
  }
  return null; // null means valid
};

/**
 * Starts the MQTT subscriber.
 * Call this once from server.js after the DB is connected.
 */
const startMqttSubscriber = () => {
  const { brokerUrl, options } = getMqttOptions();

  console.log(`🔌 MQTT: Connecting to broker: ${brokerUrl}`);

  const client = mqtt.connect(brokerUrl, options);

  // -------------------------------------------------------
  // Connected to broker
  // -------------------------------------------------------
  client.on("connect", () => {
    console.log("✅ MQTT: Connected to broker");

    // Subscribe to all device reading topics
    client.subscribe(SUBSCRIBE_TOPIC, { qos: 1 }, (err, granted) => {
      if (err) {
        console.error("❌ MQTT: Subscription error:", err.message);
      } else {
        console.log(`📡 MQTT: Subscribed to topic: ${SUBSCRIBE_TOPIC}`);
        granted.forEach((g) => {
          console.log(`   → Topic: ${g.topic}  QoS: ${g.qos}`);
        });
      }
    });
  });

  // -------------------------------------------------------
  // Incoming message
  // -------------------------------------------------------
  client.on("message", async (topic, messageBuffer) => {
    const raw = messageBuffer.toString();
    console.log(`📨 MQTT: Message received on [${topic}]:`);
    console.log(`   Payload: ${raw}`);

    // --- Parse JSON safely ---
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (parseErr) {
      console.error("❌ MQTT: Failed to parse JSON payload:", parseErr.message);
      return;
    }

    // --- Validate required fields ---
    const validationError = validatePayload(payload);
    if (validationError) {
      console.error(`❌ MQTT: Invalid payload – ${validationError}`);
      return;
    }

    // --- Build the reading object ---
    let createdAt;
    if (payload.createdAt) {
      const parsed = new Date(payload.createdAt);
      createdAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      createdAt = new Date();
    }

    const reading = {
      _id:         Math.random().toString(36).substr(2, 9), // fake ID
      deviceId:    payload.deviceId,
      temperature: payload.temperature,
      humidity:    payload.humidity,
      moisture:    payload.moisture,
      fanState:    payload.fanState !== undefined ? payload.fanState : null,
      motorState:  payload.motorState !== undefined ? payload.motorState : null,
      systemState: payload.systemState !== undefined ? payload.systemState : null,
      status:      payload.status || "online",
      receivedAt:  new Date(),
      source:      "mqtt",
      createdAt,
    };

    console.log(
      `✅ MQTT: Received reading — Device: ${reading.deviceId} | ` +
      `Temp: ${reading.temperature}°C | Hum: ${reading.humidity}% | Moisture: ${reading.moisture}%`
    );
    
    // Pass to controller to store in API memory and broadcast via SSE
    const { addReadingInMemory, broadcastNewReading } = require("../controllers/sensorController");
    addReadingInMemory(reading);
    broadcastNewReading(reading);
  });

  // -------------------------------------------------------
  // Error handling
  // -------------------------------------------------------
  client.on("error", (err) => {
    console.error("❌ MQTT: Client error:", err.message);
  });

  client.on("reconnect", () => {
    console.log("🔄 MQTT: Reconnecting to broker...");
  });

  client.on("offline", () => {
    console.warn("⚠️  MQTT: Client went offline");
  });

  client.on("close", () => {
    console.log("🔌 MQTT: Connection closed");
  });

  return client; // return so it can be closed gracefully if needed
};

module.exports = startMqttSubscriber;
