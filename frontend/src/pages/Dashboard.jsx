// Dashboard.jsx - Main dashboard page
// Fetches and displays sensor data: latest reading cards + full table + form

import { useState, useEffect, useCallback } from "react";
import { getAllSensors, getLatestSensor } from "../api/sensorApi";
import SensorCard from "../components/SensorCard";
import SensorForm from "../components/SensorForm";
import SensorTable from "../components/SensorTable";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";

// SVG icon helpers
const IconAnalog = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const IconDigital = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <path d="M8 21h8M12 17v4"/>
  </svg>
);
const IconDevice = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>
);
const IconStatus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const Dashboard = () => {
  const [sensors, setSensors] = useState([]);        // All readings
  const [latest, setLatest] = useState(null);         // Latest reading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch both all sensors and latest in parallel
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allRes, latestRes] = await Promise.all([
        getAllSensors(),
        getLatestSensor().catch(() => ({ data: null })), // graceful if empty
      ]);
      setSensors(allRes.data || []);
      setLatest(latestRes.data || null);
    } catch (err) {
      setError("Failed to load sensor data. Is the backend running?");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main className="dashboard">
      {/* Page header */}
      <section className="dashboard-header">
        <div>
          <h1 className="dashboard-title">ESP32 Sensor Web Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor and manage your IoT device sensor readings in real time
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* Latest reading cards */}
      <section className="section">
        <h2 className="section-title">Latest Reading</h2>
        {loading ? (
          <LoadingSpinner message="Fetching latest data..." />
        ) : latest ? (
          <div className="cards-grid">
            <SensorCard title="Device" value={latest.deviceId} icon={IconDevice} color="blue" />
            <SensorCard title="Analog Sensor" value={latest.analogSensor} unit="ADC" icon={IconAnalog} color="purple" />
            <SensorCard title="Digital Sensor" value={latest.digitalSensor} icon={IconDigital} color="teal" />
            <SensorCard title="Status" value={latest.status} icon={IconStatus} color="green" />
          </div>
        ) : (
          <p className="muted-text">No data available yet. Submit your first reading below.</p>
        )}
      </section>

      {/* Manual data entry form */}
      <section className="section">
        <SensorForm onSuccess={fetchData} />
      </section>

      {/* All sensor readings table */}
      <section className="section">
        {loading ? (
          <LoadingSpinner message="Loading sensor records..." />
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : sensors.length === 0 ? (
          <EmptyState />
        ) : (
          <SensorTable sensors={sensors} onDelete={fetchData} />
        )}
      </section>
    </main>
  );
};

export default Dashboard;
