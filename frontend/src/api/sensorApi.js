// =============================================
// sensorApi.js - Axios API Functions
// =============================================
// All API calls to the backend are centralized here.

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Fetch all sensor readings (newest first)
// Optional: pass deviceId string to filter by device
export const getAllSensors = async (deviceId = null) => {
  const params = deviceId ? { deviceId } : {};
  const response = await api.get("/sensors", { params });
  return response.data;
};

// Fetch only the latest sensor reading
// Optional: pass deviceId to get latest for that device
export const getLatestSensor = async (deviceId = null) => {
  const params = deviceId ? { deviceId } : {};
  const response = await api.get("/sensors/latest", { params });
  return response.data;
};

// Fetch all readings for a specific device
export const getSensorsByDevice = async (deviceId) => {
  const response = await api.get(`/sensors/device/${deviceId}`);
  return response.data;
};

// Create a new sensor reading via HTTP
// data: { deviceId, temperature, humidity, moisture, status }
export const createSensor = async (data) => {
  const response = await api.post("/sensors", data);
  return response.data;
};

// Delete a sensor reading by its id
export const deleteSensor = async (id) => {
  const response = await api.delete(`/sensors/${id}`);
  return response.data;
};

// Get the latest known reading per device (device status board)
export const getDeviceStatus = async () => {
  const response = await api.get("/devices/status");
  return response.data;
};

// Check backend health
export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
