// =============================================
// sensorController.js - Request Handlers (In-Memory Version)
// =============================================
// Updated for the new sensor fields: temperature, humidity, moisture.
// MongoDB has been completely removed. Data is stored in memory.

// Store connected SSE clients
let sseClients = [];

// In-memory buffer to store the last 200 readings
const MAX_READINGS = 200;
let memoryBuffer = [];

// Allow MQTT subscriber to add readings to memory
const addReadingInMemory = (reading) => {
  memoryBuffer.unshift(reading); // Add to beginning (newest first)
  if (memoryBuffer.length > MAX_READINGS) {
    memoryBuffer.pop(); // Remove oldest
  }
};

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
// Keep-alive Heartbeat (Prevents Render/Nginx timeout)
// -------------------------------------------------------
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.res.write(":\\n\\n"); // Send SSE comment
    } catch (e) {
      // Ignore
    }
  });
}, 10000);

// -------------------------------------------------------
// GET /api/sensors/stream
// SSE endpoint for real-time updates
// -------------------------------------------------------
const streamSensors = (req, res) => {
  // SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  
  // CRITICAL for Render and Nginx: Disable proxy buffering
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders(); // flush the headers to establish connection

  // Prevent Node's TCP socket from buffering the stream or timing out
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);

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
// Returns all sensor readings from memory, newest first.
// Optional query param: ?deviceId=esp32_01 to filter by device.
// -------------------------------------------------------
const getAllSensors = async (req, res) => {
  try {
    let readings = memoryBuffer;
    
    if (req.query.deviceId) {
      readings = readings.filter(r => r.deviceId === req.query.deviceId);
    }

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
// Returns the single most recent sensor reading from memory.
// Optional: ?deviceId=esp32_01
// -------------------------------------------------------
const getLatestSensor = async (req, res) => {
  try {
    let readings = memoryBuffer;
    
    if (req.query.deviceId) {
      readings = readings.filter(r => r.deviceId === req.query.deviceId);
    }

    if (readings.length === 0) {
      return res.status(404).json({ success: false, message: "No sensor readings found" });
    }

    res.status(200).json({ success: true, data: readings[0] });
  } catch (error) {
    console.error("Error fetching latest sensor:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching latest sensor" });
  }
};

// -------------------------------------------------------
// GET /api/sensors/device/:deviceId
// Returns all readings for a specific device from memory.
// -------------------------------------------------------
const getSensorsByDevice = async (req, res) => {
  try {
    const readings = memoryBuffer.filter(r => r.deviceId === req.params.deviceId);

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
// Returns a single reading by its fake _id from memory.
// -------------------------------------------------------
const getSensorById = async (req, res) => {
  try {
    const reading = memoryBuffer.find(r => r._id === req.params.id);

    if (!reading) {
      return res.status(404).json({ success: false, message: "Sensor reading not found" });
    }

    res.status(200).json({ success: true, data: reading });
  } catch (error) {
    console.error("Error fetching sensor by ID:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching sensor" });
  }
};

// -------------------------------------------------------
// POST /api/sensors
// Creates a new sensor reading via HTTP (manual/test) in memory.
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

    const newReading = {
      _id:         Math.random().toString(36).substr(2, 9),
      deviceId,
      temperature,
      humidity,
      moisture,
      fanState:    fanState !== undefined ? fanState : null,
      motorState:  motorState !== undefined ? motorState : null,
      systemState: systemState !== undefined ? systemState : null,
      status:      status || "online",
      source:      "http",
      receivedAt:  new Date(),
      createdAt:   new Date(),
    };

    addReadingInMemory(newReading);
    broadcastNewReading(newReading);

    res.status(201).json({ success: true, data: newReading });
  } catch (error) {
    console.error("Error creating sensor reading:", error.message);
    res.status(500).json({ success: false, message: "Server error while creating sensor reading" });
  }
};

// -------------------------------------------------------
// DELETE /api/sensors/clear
// Wipes the entire in-memory history.
// -------------------------------------------------------
const clearAllSensors = async (req, res) => {
  try {
    memoryBuffer = []; // wipe RAM

    // Broadcast a special event to all SSE clients to clear their screens
    // Passing {"cleared": true} will be intercepted by the UI
    broadcastNewReading({ cleared: true });

    res.status(200).json({ success: true, message: "Sensor history cleared" });
  } catch (error) {
    console.error("Error clearing sensors:", error.message);
    res.status(500).json({ success: false, message: "Server error while clearing sensors" });
  }
};

// -------------------------------------------------------
// DELETE /api/sensors/:id
// Deletes a single reading by its fake _id from memory.
// -------------------------------------------------------
const deleteSensor = async (req, res) => {
  try {
    const initialLength = memoryBuffer.length;
    memoryBuffer = memoryBuffer.filter(r => r._id !== req.params.id);

    if (memoryBuffer.length === initialLength) {
      return res.status(404).json({ success: false, message: "Sensor reading not found" });
    }

    res.status(200).json({ success: true, message: "Sensor reading deleted successfully" });
  } catch (error) {
    console.error("Error deleting sensor:", error.message);
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
  streamSensors,
  broadcastNewReading,
  addReadingInMemory,
};
