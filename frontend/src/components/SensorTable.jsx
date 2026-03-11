// SensorTable.jsx - Displays sensor readings history in a table
// Updated for new fields: temperature, humidity, moisture

import { deleteSensor } from "../api/sensorApi";
import DeviceStatusBadge from "./DeviceStatusBadge";

const SensorTable = ({ sensors, onDelete }) => {
  const formatDate = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sensor reading?")) return;
    try {
      await deleteSensor(id);
      if (onDelete) onDelete();
    } catch (err) {
      alert("Failed to delete. Please try again.");
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="table-card">
      <div className="table-card__header">
        <div className="table-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h2 className="table-card__title">Sensor History</h2>
        <span className="table-card__count">{sensors.length} records</span>
      </div>

      <div className="table-wrapper">
        <table className="sensor-table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>Moisture (%)</th>
              <th>Status</th>
              <th>Source</th>
              <th>Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor) => (
              <tr key={sensor._id}>
                <td>
                  <span className="device-id">{sensor.deviceId}</span>
                </td>
                <td className="numeric">{sensor.temperature ?? "—"}</td>
                <td className="numeric">{sensor.humidity ?? "—"}</td>
                <td className="numeric">{sensor.moisture ?? "—"}</td>
                <td>
                  <DeviceStatusBadge status={sensor.status} />
                </td>
                <td>
                  <span className="source-tag source-tag--{sensor.source || 'mqtt'}">
                    {sensor.source || "mqtt"}
                  </span>
                </td>
                <td className="timestamp">{formatDate(sensor.createdAt)}</td>
                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(sensor._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SensorTable;
