// Dashboard.jsx — AgroDry-Bot 2026
// Paddy drying monitor: temperature, humidity, moisture tracking

import { useState, useEffect, useCallback, useRef } from "react";
import { clearAllSensors } from "../api/sensorApi";
import mqttClient from "mqtt";
import SpeedometerCard from "../components/SpeedometerCard";
import HistoryChart from "../components/HistoryChart";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";

// ── Icons ───────────────────────────────────────────────────
const IconTemp = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/>
  </svg>
);
const IconDrop = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
  </svg>
);
const IconGrain = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
    <ellipse cx="12" cy="12" rx="5" ry="9"/>
    <path d="M12 3C12 3 8 6 8 12s4 9 4 9"/>
    <path d="M12 3c0 0 4 3 4 9s-4 9-4 9"/>
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
const IconFan = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M12 12c-3-3-5-3-7-1s-1 5 1 7c2.5 2.5 6 1 6-4z"/>
    <path d="M12 12c3-3 5-3 7-1s1 5-1 7c-2.5 2.5-6 1-6-4z"/>
    <path d="M12 12c-3 3-5 3-7 1s-1-5 1-7c2.5-2.5 6-1 6 4z"/>
    <path d="M12 12c3 3 5 3 7 1s1-5-1-7c-2.5-2.5-6-1-6 4z"/>
  </svg>
);
const IconMotor = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <circle cx="12" cy="12" r="8"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3"/>
  </svg>
);
const IconHistory = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconTrash = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// ── Constants ────────────────────────────────────────────────
const POLL_INTERVAL       = 4;   // seconds
const STALE_SEC           = 30;  // offline if no reading for this long
const TARGET_MOISTURE     = 14;  // % — dry paddy target
const WET_MOISTURE        = 25;  // % — starting moisture
const TARGET_TEMP         = 45;  // °C — drying temp

// ── Helpers ──────────────────────────────────────────────────
const fmt = (iso) => iso ? new Date(iso).toLocaleString() : "—";
const isStale = (iso) => !iso || (Date.now() - new Date(iso).getTime()) / 1000 > STALE_SEC;

// Paddy moisture progress: 0% fill = dry (14%), 100% fill = wet (25%)
const getMoistureProgress = (m) => {
  if (m === undefined || m === null) return 0;
  const clamped = Math.max(TARGET_MOISTURE, Math.min(WET_MOISTURE, m));
  return ((clamped - TARGET_MOISTURE) / (WET_MOISTURE - TARGET_MOISTURE)) * 100;
};

const getDryingPhase = (m, temp, online) => {
  if (!online) return { label: "Idle / Offline", cls: "drying-phase--idle" };
  if (m !== undefined && m <= TARGET_MOISTURE)
    return { label: "✅ Drying Complete!", cls: "drying-phase--done" };
  if (temp !== undefined && temp >= TARGET_TEMP - 3)
    return { label: "🔥 Drying in Progress", cls: "drying-phase--drying" };
  return { label: "⏳ Warming Up", cls: "drying-phase--idle" };
};

const getMoistureBarClass = (m) => {
  if (m === undefined) return "moisture-bar-fill--wet";
  if (m <= TARGET_MOISTURE) return "moisture-bar-fill--dry";
  if (m <= 18) return "moisture-bar-fill--mid";
  return "moisture-bar-fill--wet";
};

// ── Dashboard ─────────────────────────────────────────────────
const Dashboard = () => {
  const [sensors, setSensors]         = useState([]);
  const [latest, setLatest]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const mqttRef = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [allRes, latestRes] = await Promise.all([
        import("../api/sensorApi").then(api => api.getAllSensors()),
        import("../api/sensorApi").then(api => api.getLatestSensor()).catch(() => ({ data: null })),
      ]);
      setSensors(allRes.data || []);
      setLatest(latestRes.data || null);
    } catch {
      setError("Cannot reach backend. Check your connection or Render deployment.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all sensor history?")) return;
    try {
      await clearAllSensors();
      // The SSE stream will send {"cleared": true} which will trigger a wipe automatically
    } catch (err) {
      alert("Failed to clear history: " + err.message);
    }
  };

  useEffect(() => {
    // 1. Always fetch initial data on mount
    fetchData();

    // 2. Setup real-time direct MQTT connection if autoRefresh is ON
    if (!autoRefresh) {
      if (mqttRef.current) {
        mqttRef.current.end();
        mqttRef.current = null;
      }
      return;
    }

    const brokerUrl = "wss://dc7dee794e454409bd21218ac1ab4796.s1.eu.hivemq.cloud:8884/mqtt";
    const options = {
      clientId: `react_dashboard_${Math.random().toString(16).slice(2, 8)}`,
      username: "iot_user",
      password: "102323pK",
      keepalive: 30,
    };
    
    console.log("🔌 Dashboard: Connecting directly to HiveMQ WebSockets...");
    const client = mqttClient.connect(brokerUrl, options);
    mqttRef.current = client;

    client.on("connect", () => {
      console.log("✅ Dashboard: Direct MQTT connection established!");
      client.subscribe("devices/+/readings", { qos: 0 });
    });

    client.on("message", (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // Ensure payload has the minimum required structure before updating state
        if (payload.deviceId && payload.temperature !== undefined) {
          setLatest(payload);
          setSensors((prev) => {
            const updated = [payload, ...prev];
            if (updated.length > 200) updated.pop();
            return updated;
          });
        }
      } catch (err) {
        console.error("MQTT parse error", err);
      }
    });

    client.on("error", (err) => {
      console.warn("⚠️ Dashboard: Direct MQTT connection error", err);
    });

    // 3. Fallback Polling (in case MQTT gets blocked by a strict firewall)
    const fallbackPoll = setInterval(() => {
      if (autoRefresh) fetchData(true);
    }, 15000); 

    return () => {
      if (mqttRef.current) {
        mqttRef.current.end();
        mqttRef.current = null;
      }
      clearInterval(fallbackPoll);
    };
  }, [autoRefresh, fetchData]);

  // Derived state
  const online        = latest && !isStale(latest.createdAt) && latest.status !== "offline";
  const deviceId      = latest?.deviceId || "—";
  const temp          = latest?.temperature;
  const humidity      = latest?.humidity;
  const moisture      = latest?.moisture;
  const fanOn         = latest?.fanState === true;
  const motorOn       = latest?.motorState === true;
  const systemOn      = online && latest?.systemState !== false; // defaults to true unless explicitly false
  const phase         = getDryingPhase(moisture, temp, online);
  const moistureProg  = getMoistureProgress(moisture);

  return (
    <main className="dashboard">

      {/* ── Hero Strip ── */}
      <div className="agro-hero">
        <div>
          <div className="agro-hero__title">AgroDry-Bot 2026 🌾</div>
          <div className="agro-hero__sub">
            Solar-powered paddy drying system — Real-time sensor monitoring
          </div>
        </div>
        <div className="agro-hero__stats">
          <div className="agro-stat">
            <span className="agro-stat__value">45°C</span>
            <span className="agro-stat__label">Target Temp</span>
          </div>
          <div className="agro-stat">
            <span className="agro-stat__value">14%</span>
            <span className="agro-stat__label">Target Moisture</span>
          </div>
          <div className="agro-stat">
            <span className="agro-stat__value">☀️</span>
            <span className="agro-stat__label">Solar Powered</span>
          </div>
        </div>
      </div>

      {/* ── Header ── */}
      <section className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Paddy Drying Monitor</h1>
          <p className="dashboard-subtitle">
            Instant real-time updates · SSE Streaming · HiveMQ Cloud MQTT
          </p>
        </div>
        <div className="header-actions">
          <div className="live-indicator">
            <span className={`live-dot${autoRefresh ? " live-dot--active" : ""}`} />
            <label className="live-label">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ marginRight: "0.35rem", accentColor: "#16a34a" }}
              />
              {autoRefresh ? "Real-time Live" : "Live Updates Off"}
            </label>
          </div>
          <button className="btn btn-secondary" onClick={() => fetchData(false)} disabled={loading}>
            {IconRefresh}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {/* ── Device Status Banner ── */}
      <section className="section">
        <div className={`device-banner ${online ? "device-banner--online" : "device-banner--offline"}`}>
          <div className="device-banner__left">
            <div className="device-banner__icon">{IconWifi}</div>
            <div>
              <p className="device-banner__small">AgroDry-Bot Device</p>
              <p className="device-banner__id">{deviceId}</p>
            </div>
          </div>

          <div className="device-banner__center">
            <div className="device-banner__stat">
              <span className="device-banner__stat-label">Connection</span>
              <span className={`device-banner__pill ${online ? "pill--green" : "pill--red"}`}>
                <span className={`pill-dot ${online ? "pill-dot--blink" : ""}`}/>
                {online ? "CONNECTED" : "DISCONNECTED"}
              </span>
            </div>
            <div className="device-banner__stat">
              <span className="device-banner__stat-label">System Power</span>
              <span className={`device-banner__pill ${systemOn ? "pill--green" : "pill--gray"}`}>
                <span className="device-banner__power-icon">{IconPower}</span>
                {systemOn ? "ON" : "OFF"}
              </span>
            </div>
            {online && latest?.fanState !== undefined && (
              <>
                <div className="device-banner__stat">
                  <span className="device-banner__stat-label">Heater Fan</span>
                  <span className={`device-banner__pill ${fanOn ? "pill--red" : "pill--gray"}`}>
                    <span className="device-banner__power-icon" style={{ animation: fanOn ? 'spin 2s linear infinite' : 'none' }}>{IconFan}</span>
                    {fanOn ? "ON" : "STDBY"}
                  </span>
                </div>
                <div className="device-banner__stat">
                  <span className="device-banner__stat-label">Tumbler Motor</span>
                  <span className={`device-banner__pill ${motorOn ? "pill--green" : "pill--gray"}`}>
                    <span className="device-banner__power-icon" style={{ animation: motorOn ? 'spin 4s linear infinite' : 'none' }}>{IconMotor}</span>
                    {motorOn ? "SPINNING" : "STOPPED"}
                  </span>
                </div>
              </>
            )}
            <div className="device-banner__stat">
              <span className="device-banner__stat-label">Drying Status</span>
              <span className={`device-banner__pill ${online ? "pill--green" : "pill--gray"}`}>
                {online ? (latest?.status || "online") : "offline"}
              </span>
            </div>
          </div>

          <div className="device-banner__right">
            <span className="device-banner__small">Last reading</span>
            <span className="device-banner__time">{fmt(latest?.createdAt)}</span>
          </div>
        </div>
      </section>

      {/* ── Drying Progress ── */}
      {online && moisture !== undefined && (
        <section className="section">
          <div className="drying-status-card">
            <div className="drying-status-card__header">
              <span className="drying-status-card__title">🌾 Paddy Drying Progress</span>
              <span className={`drying-phase ${phase.cls}`}>{phase.label}</span>
            </div>
            <div className="moisture-bar-wrap">
              <div className="moisture-bar-labels">
                <span>DRY — {TARGET_MOISTURE}% (target)</span>
                <span>Current: {moisture?.toFixed(1)}%</span>
                <span>WET — {WET_MOISTURE}%</span>
              </div>
              <div className="moisture-bar-track">
                <div
                  className={`moisture-bar-fill ${getMoistureBarClass(moisture)}`}
                  style={{ width: `${moistureProg}%` }}
                />
              </div>
              <div className="moisture-bar-note">
                {moisture <= TARGET_MOISTURE
                  ? "✅ Paddy dried! Ready to store. Bot will send farmer alert."
                  : `Remove ${(moisture - TARGET_MOISTURE).toFixed(1)}% more moisture to reach dry target`}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Live Sensor Readings ── */}
      <section className="section">
        <div className="section-title">Live Sensor Readings</div>
        {loading ? (
          <LoadingSpinner message="Fetching sensor data from AgroDry-Bot…" />
        ) : latest && online ? (
          <div className="speedometer-grid">
            <SpeedometerCard
              title="Temperature"
              value={temp}
              unit="°C"
              min={-10}
              max={60}
              icon={IconTemp}
              tone="red"
              decimals={1}
              sublabel={temp >= TARGET_TEMP - 3 ? "At drying temperature" : `Target: ${TARGET_TEMP}°C`}
            />
            <SpeedometerCard
              title="Soil Moisture"
              value={moisture}
              unit="%"
              min={0}
              max={100}
              icon={IconGrain}
              tone="teal"
              decimals={0}
              sublabel={moisture <= TARGET_MOISTURE ? "Dry target reached" : `Target: ${TARGET_MOISTURE}%`}
            />
            <SpeedometerCard
              title="Humidity"
              value={humidity}
              unit="%"
              min={0}
              max={100}
              icon={IconDrop}
              tone="blue"
              decimals={1}
              sublabel="Relative humidity inside dryer"
            />
          </div>
        ) : !loading && !latest ? (
          <p className="muted-text">
            No data yet — run the simulator, connect to HiveMQ Cloud, turn device ON,
            then click <strong>Publish Once</strong>.
          </p>
        ) : !loading && !online ? (
          <p className="muted-text">
            AgroDry-Bot is offline. Last recorded readings are shown in the history below.
          </p>
        ) : null}
      </section>

      {/* ── Sensor History Chart ── */}
      <section className="section">
        <div className="section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {IconHistory} Reading History Graph
          </div>
          {sensors.length > 0 && (
            <button 
              onClick={handleClearHistory}
              className="btn" 
              style={{ backgroundColor: "#ef4444", color: "white", padding: "0.25rem 0.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem", borderRadius: "0.375rem", border: "none", cursor: "pointer" }}
            >
              {IconTrash} Clear History
            </button>
          )}
        </div>
        
        {loading ? (
          <LoadingSpinner message="Loading history…" />
        ) : error ? (
          <div className="error-banner">{error}</div>
        ) : sensors.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="card" style={{ padding: "1rem" }}>
            <HistoryChart data={sensors} />
          </div>
        )}
      </section>

    </main>
  );
};

export default Dashboard;
