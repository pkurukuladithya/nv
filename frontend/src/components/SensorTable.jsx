// SensorTable.jsx - Displays all sensor readings in a table
// Shows deviceId, analog, digital, status, timestamp, and delete action

import { deleteSensor } from "../api/sensorApi";

const SensorTable = ({ sensors, onDelete }) => {
  // Format ISO date to a readable string
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // Returns a CSS class based on the status string
  const getStatusClass = (status) => {
    const map = {
      online: "badge badge--online",
      offline: "badge badge--offline",
      warning: "badge badge--warning",
      error: "badge badge--error",
    };
    return map[status?.toLowerCase()] || "badge badge--default";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this sensor reading?")) return;
    try {
      await deleteSensor(id);
      if (onDelete) onDelete(); // Refresh list in parent
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
        <h2 className="table-card__title">All Sensor Readings</h2>
        <span className="table-card__count">{sensors.length} records</span>
      </div>

      <div className="table-wrapper">
        <table className="sensor-table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Analog</th>
              <th>Digital</th>
              <th>Status</th>
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
                <td className="numeric">{sensor.analogSensor}</td>
                <td className="numeric">{sensor.digitalSensor}</td>
                <td>
                  <span className={getStatusClass(sensor.status)}>
                    {sensor.status || "unknown"}
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
