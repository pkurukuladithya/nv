// SensorCard.jsx - Displays a single highlighted metric card
// Used to show the latest sensor reading values prominently

const SensorCard = ({ title, value, unit = "", icon, color = "blue" }) => {
  return (
    <div className={`sensor-card sensor-card--${color}`}>
      <div className="sensor-card__icon">{icon}</div>
      <div className="sensor-card__body">
        <p className="sensor-card__title">{title}</p>
        <p className="sensor-card__value">
          {value !== undefined && value !== null ? value : "—"}
          {unit && <span className="sensor-card__unit"> {unit}</span>}
        </p>
      </div>
    </div>
  );
};

export default SensorCard;
