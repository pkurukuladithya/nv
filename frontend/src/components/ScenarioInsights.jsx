import { useCallback, useEffect, useRef, useState } from "react";

// ScenarioInsights.jsx - Live scenario logic + alert center for AgroDry-Bot

const CRITICAL_MOISTURE = 14;
const FAN_RESTART_TEMP = 44;
const FAN_CUTOFF_TEMP = 45;
const TOAST_DURATION_MS = 4200;
const PRIMARY_MODE_IDS = new Set(["normal", "overheat", "critical"]);

const hasNum = (value) => typeof value === "number" && Number.isFinite(value);

const scenarioBlueprints = [
  {
    id: "normal",
    badge: "NORMAL",
    title: "Normal Operation",
    severity: "success",
    condition: `Moisture >= ${CRITICAL_MOISTURE}% and Temp < ${FAN_RESTART_TEMP}°C`,
    summary: "Motor and fan run together for continuous drying with active airflow.",
    expected: { motor: true, fan: true, system: true },
  },
  {
    id: "overheat",
    badge: "HOT",
    title: "Overheating Protection",
    severity: "warning",
    condition: `Temp >= ${FAN_CUTOFF_TEMP}°C`,
    summary: "Fan enters thermal protection and restarts only when temperature drops below 44°C.",
    expected: { motor: true, fan: false, system: true },
  },
  {
    id: "critical",
    badge: "STOP",
    title: "Critical Moisture Drop",
    severity: "danger",
    condition: `Moisture < ${CRITICAL_MOISTURE}%`,
    summary: "Emergency interlock. Motor and fan are stopped to prevent over-drying and risk.",
    expected: { motor: false, fan: false, system: false },
  },
];

const getCurrentScenario = ({ online, temp, moisture }) => {
  if (!online) {
    return {
      id: "offline",
      badge: "OFFLINE",
      title: "Device Offline",
      severity: "neutral",
      condition: "No fresh telemetry",
      summary: "Waiting for new MQTT readings to validate scenario logic.",
      expected: { motor: null, fan: null, system: null },
    };
  }

  if (hasNum(moisture) && moisture < CRITICAL_MOISTURE) {
    return scenarioBlueprints[2];
  }
  if (hasNum(temp) && temp >= FAN_CUTOFF_TEMP) {
    return scenarioBlueprints[1];
  }
  if (hasNum(temp) && temp >= FAN_RESTART_TEMP && temp < FAN_CUTOFF_TEMP) {
    return {
      id: "hysteresis",
      badge: "HOLD",
      title: "Thermal Guard Band",
      severity: "info",
      condition: "44°C <= Temp < 45°C",
      summary: "Fan hysteresis zone. Relay chatter is prevented while temperature stabilizes.",
      expected: { motor: true, fan: null, system: true },
    };
  }
  return scenarioBlueprints[0];
};

const toStatusMeta = (value, normalLabel = "ON") => {
  if (value === null) return { label: "N/A", cls: "na" };
  if (value) return { label: normalLabel, cls: "on" };
  return { label: "OFF", cls: "off" };
};

const compareExpectedStates = (scenario, { motorOn, fanOn, systemOn, online }) => {
  if (!online) return [];

  const mismatch = [];
  const expected = scenario.expected || {};

  if (expected.motor !== null && expected.motor !== undefined && expected.motor !== motorOn) {
    mismatch.push(`Motor should be ${expected.motor ? "ON" : "OFF"}`);
  }
  if (expected.fan !== null && expected.fan !== undefined && expected.fan !== fanOn) {
    mismatch.push(`Fan should be ${expected.fan ? "ON" : "OFF"}`);
  }
  if (expected.system !== null && expected.system !== undefined && expected.system !== systemOn) {
    mismatch.push(`System should be ${expected.system ? "NORMAL" : "OFF"}`);
  }

  return mismatch;
};

const buildAlerts = ({ online, temp, moisture, scenario, mismatch }) => {
  if (!online) {
    return [
      {
        id: "offline",
        severity: "danger",
        title: "Telemetry Lost",
        body: "No fresh reading detected. Check broker connection, power, or network.",
      },
    ];
  }

  const alerts = [];

  if (scenario.id === "critical") {
    alerts.push({
      id: "critical-moisture",
      severity: "danger",
      title: "Emergency Stop Active",
      body: `Moisture is below ${CRITICAL_MOISTURE}%. Motor and fan must stay OFF to protect crop quality.`,
    });
  } else if (scenario.id === "overheat") {
    alerts.push({
      id: "overheat",
      severity: "warning",
      title: "Fan Thermal Protection",
      body: `Temperature is ${temp?.toFixed?.(1) ?? "high"}°C. Fan stays OFF until below ${FAN_RESTART_TEMP}°C.`,
    });
  } else if (scenario.id === "hysteresis") {
    alerts.push({
      id: "hysteresis",
      severity: "info",
      title: "Hysteresis Zone",
      body: "Temperature is in the 44-45°C guard band. Relay toggling is intentionally reduced.",
    });
  } else {
    alerts.push({
      id: "normal",
      severity: "success",
      title: "System Stable",
      body: "Drying workflow is in normal operating mode.",
    });
  }

  if (hasNum(moisture) && moisture >= CRITICAL_MOISTURE && moisture < CRITICAL_MOISTURE + 1.5) {
    alerts.push({
      id: "moisture-watch",
      severity: "warning",
      title: "Near Critical Moisture",
      body: `Moisture is close to cutoff (${moisture.toFixed(1)}%). Prepare for automatic shutdown threshold.`,
    });
  }

  if (hasNum(temp) && temp >= FAN_RESTART_TEMP - 0.5 && temp < FAN_CUTOFF_TEMP) {
    alerts.push({
      id: "temp-watch",
      severity: "info",
      title: "Approaching Fan Cutoff",
      body: `Temperature is nearing ${FAN_CUTOFF_TEMP}°C. Fan protection may activate soon.`,
    });
  }

  if (mismatch.length > 0) {
    alerts.push({
      id: "mismatch",
      severity: "danger",
      title: "Logic Mismatch Detected",
      body: mismatch.join(" | "),
    });
  }

  return alerts;
};

const ScenarioInsights = ({
  sectionId = "scenario",
  online,
  temp,
  moisture,
  motorOn,
  fanOn,
  systemOn,
}) => {
  const [toasts, setToasts] = useState([]);
  const previousScenarioIdRef = useRef(null);
  const toastIdRef = useRef(0);

  const scenario = getCurrentScenario({ online, temp, moisture });
  const mismatch = compareExpectedStates(scenario, { motorOn, fanOn, systemOn, online });
  const alerts = buildAlerts({ online, temp, moisture, scenario, mismatch });

  const motorMeta = toStatusMeta(online ? motorOn : null);
  const fanMeta = toStatusMeta(online ? fanOn : null);
  const systemMeta = toStatusMeta(online ? systemOn : null, "NORMAL");

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    setToasts((prev) => [toast, ...prev].slice(0, 3));
    window.setTimeout(() => removeToast(toast.id), TOAST_DURATION_MS);
  }, [removeToast]);

  useEffect(() => {
    const previous = previousScenarioIdRef.current;
    previousScenarioIdRef.current = scenario.id;

    if (previous === null || previous === scenario.id) return;
    if (!PRIMARY_MODE_IDS.has(scenario.id)) return;

    toastIdRef.current += 1;
    pushToast({
      id: `toast-${toastIdRef.current}`,
      severity: scenario.severity,
      title: `Mode Changed: ${scenario.title}`,
      body: scenario.summary,
    });
  }, [scenario.id, scenario.severity, scenario.summary, scenario.title, pushToast]);

  return (
    <>
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <article key={toast.id} className={`toast-popup toast-popup--${toast.severity}`}>
            <div className="toast-popup__content">
              <h4 className="toast-popup__title">{toast.title}</h4>
              <p className="toast-popup__body">{toast.body}</p>
            </div>
            <button
              className="toast-popup__close"
              type="button"
              aria-label="Close alert"
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </article>
        ))}
      </div>

      <section id={sectionId} className="section">
        <div className="section-title">Scenario Intelligence</div>

        <div className="scenario-layout">
          <article className={`scenario-live scenario-live--${scenario.severity}`}>
            <div className="scenario-live__header">
              <span className="scenario-live__badge">{scenario.badge}</span>
              <div>
                <h3 className="scenario-live__title">{scenario.title}</h3>
                <p className="scenario-live__condition">{scenario.condition}</p>
              </div>
            </div>

            <p className="scenario-live__summary">{scenario.summary}</p>

            <div className="scenario-state-grid">
              <div className="scenario-state">
                <span className="scenario-state__label">Motor</span>
                <span className={`scenario-state__pill scenario-state__pill--${motorMeta.cls}`}>{motorMeta.label}</span>
              </div>
              <div className="scenario-state">
                <span className="scenario-state__label">Fan</span>
                <span className={`scenario-state__pill scenario-state__pill--${fanMeta.cls}`}>{fanMeta.label}</span>
              </div>
              <div className="scenario-state">
                <span className="scenario-state__label">System</span>
                <span className={`scenario-state__pill scenario-state__pill--${systemMeta.cls}`}>{systemMeta.label}</span>
              </div>
            </div>
          </article>

          <article className="scenario-reference">
            <h3 className="scenario-reference__title">Rulebook</h3>
            <div className="scenario-reference__list">
              {scenarioBlueprints.map((item) => (
                <div key={item.id} className="scenario-rule">
                  <div className="scenario-rule__head">
                    <span className="scenario-rule__badge">{item.badge}</span>
                    <strong>{item.title}</strong>
                  </div>
                  <p className="scenario-rule__condition">{item.condition}</p>
                  <p className="scenario-rule__states">
                    Motor: <b>{item.expected.motor ? "ON" : "OFF"}</b> · Fan: <b>{item.expected.fan ? "ON" : "OFF"}</b> · System: <b>{item.expected.system ? "NORMAL" : "OFF"}</b>
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="alert-stack">
          {alerts.map((alert) => (
            <article key={alert.id} className={`alert-card alert-card--${alert.severity}`}>
              <h4 className="alert-card__title">{alert.title}</h4>
              <p className="alert-card__body">{alert.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
};

export default ScenarioInsights;
