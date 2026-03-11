// SensorTable.jsx — AgroDry-Bot 2026 Reading History
const SensorTable = ({ sensors = [], onDelete }) => {
  const fmt = (iso) => iso ? new Date(iso).toLocaleString() : "—";

  const statusClass = (s) => {
    if (!s) return "badge--default";
    const l = s.toLowerCase();
    if (l === "online") return "badge--online";
    if (l === "offline") return "badge--offline";
    if (l === "warning") return "badge--warning";
    if (l === "error") return "badge--error";
    return "badge--default";
  };

  return (
    <div className="table-card">
      <div className="table-card__header">
        <div className="table-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <path d="M12 22V12"/>
            <path d="M12 12C12 12 7 10 5 5c3 0 6 2 7 7z"/>
            <path d="M12 12C12 12 17 10 19 5c-3 0-6 2-7 7z"/>
          </svg>
        </div>
        <span className="table-card__title">Sensor Reading History</span>
        <span className="table-card__count">{sensors.length} records</span>
      </div>

      <div className="table-wrapper">
        <table className="sensor-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>Paddy Moisture (%)</th>
              <th>Status</th>
              <th>Source</th>
              <th>Timestamp</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((s) => (
              <tr key={s._id}>
                <td><span className="device-id">{s.deviceId || "—"}</span></td>
                <td className="numeric">
                  {s.temperature !== undefined ? s.temperature.toFixed(1) : "—"}
                </td>
                <td className="numeric">
                  {s.humidity !== undefined ? s.humidity.toFixed(1) : "—"}
                </td>
                <td className="numeric">
                  {s.moisture !== undefined ? s.moisture.toFixed(0) : "—"}
                </td>
                <td>
                  <span className={`badge ${statusClass(s.status)}`}>
                    {s.status || "—"}
                  </span>
                </td>
                <td>
                  {s.source && <span className="source-tag">{s.source}</span>}
                </td>
                <td className="timestamp">{fmt(s.createdAt || s.receivedAt)}</td>
                <td>
                  {onDelete && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sensors/${s._id}`, {
                          method: "DELETE",
                        }).then(onDelete)
                      }
                    >
                      ✕
                    </button>
                  )}
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
