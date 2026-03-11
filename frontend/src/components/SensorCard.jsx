// SensorCard.jsx — AgroDry-Bot 2026
const SensorCard = ({ title, value, unit, icon, color = "green", sublabel }) => {
  return (
    <div className={`sensor-card sensor-card--${color}`}>
      <div className="sensor-card__icon">{icon}</div>
      <div>
        <div className="sensor-card__title">{title}</div>
        <div className="sensor-card__value">
          {value}
          {unit && <span className="sensor-card__unit"> {unit}</span>}
        </div>
        {sublabel && <div className="sensor-card__sublabel">{sublabel}</div>}
      </div>
    </div>
  );
};

export default SensorCard;
