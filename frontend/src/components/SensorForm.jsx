// SensorForm.jsx - Manual sensor data entry form
// Submits new readings to the backend POST /api/sensors endpoint

import { useState } from "react";
import { createSensor } from "../api/sensorApi";

const SensorForm = ({ onSuccess }) => {
  // Form field state
  const [formData, setFormData] = useState({
    deviceId: "",
    analogSensor: "",
    digitalSensor: "",
    status: "online",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Handle input changes for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      // Convert numeric fields from string to number
      await createSensor({
        deviceId: formData.deviceId.trim(),
        analogSensor: Number(formData.analogSensor),
        digitalSensor: Number(formData.digitalSensor),
        status: formData.status.trim(),
      });

      setSuccessMsg("✅ Sensor reading added successfully!");
      // Clear form
      setFormData({ deviceId: "", analogSensor: "", digitalSensor: "", status: "online" });
      // Notify parent to refresh the list
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit reading. Check console.";
      setError(`❌ ${msg}`);
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-card__header">
        <div className="form-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <h2 className="form-card__title">Add Sensor Reading</h2>
      </div>

      <form onSubmit={handleSubmit} className="sensor-form">
        <div className="form-grid">
          {/* Device ID */}
          <div className="form-group">
            <label className="form-label" htmlFor="deviceId">Device ID</label>
            <input
              id="deviceId"
              className="form-input"
              type="text"
              name="deviceId"
              placeholder="e.g., ESP32_01"
              value={formData.deviceId}
              onChange={handleChange}
              required
            />
          </div>

          {/* Analog Sensor */}
          <div className="form-group">
            <label className="form-label" htmlFor="analogSensor">Analog Sensor</label>
            <input
              id="analogSensor"
              className="form-input"
              type="number"
              name="analogSensor"
              placeholder="e.g., 1234"
              value={formData.analogSensor}
              onChange={handleChange}
              required
            />
          </div>

          {/* Digital Sensor */}
          <div className="form-group">
            <label className="form-label" htmlFor="digitalSensor">Digital Sensor</label>
            <input
              id="digitalSensor"
              className="form-input"
              type="number"
              name="digitalSensor"
              placeholder="0 or 1"
              min="0"
              max="1"
              value={formData.digitalSensor}
              onChange={handleChange}
              required
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label" htmlFor="status">Status</label>
            <select
              id="status"
              className="form-input form-select"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Feedback messages */}
        {error && <p className="form-message form-message--error">{error}</p>}
        {successMsg && <p className="form-message form-message--success">{successMsg}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Reading"}
        </button>
      </form>
    </div>
  );
};

export default SensorForm;
