// =============================================
// sensorApi.js - Axios API Functions
// =============================================
// All API calls to the backend are centralized here.
// The base URL comes from the .env file (VITE_API_BASE_URL).

import axios from "axios";

// Create an Axios instance with the base URL from environment variables
// Vite exposes .env variables with the VITE_ prefix
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Fetch all sensor readings (newest first)
export const getAllSensors = async () => {
  const response = await api.get("/sensors");
  return response.data;
};

// Fetch only the latest sensor reading
export const getLatestSensor = async () => {
  const response = await api.get("/sensors/latest");
  return response.data;
};

// Create a new sensor reading
// data: { deviceId, analogSensor, digitalSensor, status }
export const createSensor = async (data) => {
  const response = await api.post("/sensors", data);
  return response.data;
};

// Delete a sensor reading by its id
export const deleteSensor = async (id) => {
  const response = await api.delete(`/sensors/${id}`);
  return response.data;
};

// Check backend health
export const checkHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
