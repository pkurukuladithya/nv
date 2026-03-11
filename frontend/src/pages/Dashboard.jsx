// Dashboard.jsx - Single-device IoT Sensor Dashboard
// Shows device connection/power status, latest sensor readings, and history

import { useState, useEffect, useCallback, useRef } from "react";
import { getAllSensors, getLatestSensor } from "../api/sensorApi";
import SensorCard from "../components/SensorCard";
import SensorTable from "../components/SensorTable";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";

// ── SVG icons ──────────────────────────────────────────────
const IconThermometer = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
  </svg>
);
const IconDroplet = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
  </svg>
);
const IconLeaf = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.83M3 21c.58-3.5 2.5-6 5-8 3.5-2.5 6.5-3 9-3a9 9 0 019 9c-1 0-3.5-.5-5-3-1.95-3.12-3.19-3.91-4-4"/>
  </svg>
);
const IconWifi = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>
);
const IconRefresh = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
);
const IconPower = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
    <line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
);

// Auto-refresh interval in seconds (user set to 4)
const POLL_INTERVAL = 4;

// A reading is considered "stale" (device offline) if older than this many seconds
const STALE_THRESHOLD_SEC = 30;

// ── Helpers ────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
};

const isStale = (isoDate) => {
  if (!isoDate) return true;
  const ageSec = (Date.now() - new Date(isoDate).getTime()) / 1000;
  return ageSec > STALE_THRESHOLD_SEC;
};

// ── Component ──────────────────────────────────────────────
const Dashboard = () => {
  const [sensors, setSensors]         = useState([]);
  const [latest, setLatest]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown]     = useState(POLL_INTERVAL);
  const pollTimer  = useRef(null);
  const countTimer = useRef(null);

  // silent = background poll, no spinner
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [allRes, latestRes] = await Promise.all([
        getAllSensors(),
        getLatestSensor().catch(() => ({ data: null })),
      ]);
      setSensors(allRes.data || []);
      setLatest(latestRes.data || null);
    } catch (err) {
      setError("Failed to load data. Is the backend running?");
      console.error("Fetch error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Mount fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-polling
  useEffect(() => {
    clearInterval(pollTimer.current);
    clearInterval(countTimer.current);

    if (!autoRefresh) { setCountdown(POLL_INTERVAL); return; }

    setCountdown(POLL_INTERVAL);
    countTimer.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? POLL_INTERVAL : c - 1));
    }, 1000);

    pollTimer.current = setInterval(() => {
      fetchData(true);
    }, POLL_INTERVAL * 1000);

    return () => {
      clearInterval(pollTimer.current);
      clearInterval(countTimer.current);
    };
  }, [autoRefresh, fetchData]);

  // ── Derived device state ──────────────────────────────────
  // Device is "online" if the latest reading exists AND is recent
  const deviceOnline  = latest && !isStale(latest.createdAt) && latest.status !== "offline";
  const deviceId      = latest?.deviceId || "—";
  const lastSeenLabel = latest ? formatDate(latest.createdAt) : "Never";

  // ── Render ────────────────────────────────────────────────
  return (
    <main className="dashboard">

      {/* ── Header ── */}
      <section className="dashboard-header">
        <div>
          <h1 className="dashboard-title">IoT Sensor Dashboard</h1>
          <p className="dashboard-subtitle">
            ESP32 · Temperature · Humidity · Soil Moisture
          </p>
        </div>
        <div className="header-actions">
          {/* Live indicator */}
          <div className="live-indicator">
            <span className={`live-dot${autoRefresh ? " live-dot--active" : ""}`} />
            <label className="live-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ marginRight: "0.35rem", accentColor: "var(--green)" }}
              />
              {autoRefresh ? `Auto · ${countdown}s` : "Auto Off"}
            </label>
          </div>
          {/* Manual refresh */}
          <button className="btn btn-secondary" onClick={() => fetchData(false)} disabled={loading}>
            {IconRefresh}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {/* ── Device Status Banner ── */}
      <section className="section">
        <div className={`device-banner ${deviceOnline ? "device-banner--online" : "device-banner--offline"}`}>
          <div className="device-banner__left">
            <div className="device-banner__icon">
              {IconWifi}
            </div>
            <div>
              <p className="device-banner__small">ESP32 Device</p>
              <p className="device-banner__id">{deviceId}</p>
            </div>
          </div>

          <div className="device-banner__center">
            <div className="device-banner__stat">
              <span className="device-banner__stat-label">Connection</span>
              <span className={`device-banner__pill ${deviceOnline ? "pill--green" : "pill--red"}`}>
                <span className={`pill-dot ${deviceOnline ? "pill-dot--blink" : ""}`} />
                {deviceOnline ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>
            <div className="device-banner__stat">
              <span className="device-banner__stat-label">Device Power</span>
              <span className={`device-banner__pill ${deviceOnline ? "pill--green" : "pill--gray"}`}>
                <span className="device-banner__power-icon">{IconPower}</span>
                {deviceOnline ? "ON" : "OFF"}
              </span>
            </div>
            <div className="device-banner__stat">
              <span className="device-banner__stat-label">Status</span>
              <span className={`device-banner__pill ${deviceOnline ? "pill--green" : "pill--gray"}`}>
                {deviceOnline ? (latest?.status || "online") : "offline"}
              </span>
            </div>
          </div>

          <div className="device-banner__right">
            <span className="device-banner__small">Last reading</span>
            <span className="device-banner__time">{lastSeenLabel}</span>
          </div>
        </div>
      </section>

      {/* ── Latest Sensor Readings ── */}
      <section className="section">
        <h2 className="section-title">Latest Readings</h2>
        {loading ? (
          <LoadingSpinner message="Fetching sensor data…" />
        ) : latest && deviceOnline ? (
          <div className="cards-grid">
            <SensorCard
              title="Temperature"
              value={latest.temperature !== undefined ? latest.temperature.toFixed(1) : "—"}
              unit="°C"
              icon={IconThermometer}
              color="red"
            />
            <SensorCard
              title="Humidity"
              value={latest.humidity !== undefined ? latest.humidity.toFixed(1) : "—"}
              unit="%"
              icon={IconDroplet}
              color="blue"
            />
            <SensorCard
              title="Soil Moisture"
              value={latest.moisture !== undefined ? latest.moisture.toFixed(0) : "—"}
              unit="%"
              icon={IconLeaf}
              color="teal"
            />
          </div>
        ) : !loading && !latest ? (
          <p className="muted-text">No data yet — start the simulator and click <strong>Publish Once</strong>.</p>
        ) : !loading && !deviceOnline ? (
          <p className="muted-text">Device is offline. Last known readings are shown in the history below.</p>
        ) : null}
      </section>

      {/* ── Sensor History ── */}
      <section className="section">
        {loading ? (
          <LoadingSpinner message="Loading history…" />
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
