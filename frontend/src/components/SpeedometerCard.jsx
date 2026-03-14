// SpeedometerCard.jsx - Modern gauge card for live sensor values

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const SpeedometerCard = ({
  title,
  value,
  unit,
  min = 0,
  max = 100,
  icon,
  tone = "green",
  sublabel,
  decimals = 1,
}) => {
  const hasValue = isFiniteNumber(value);
  const safeValue = hasValue ? clamp(value, min, max) : min;
  const percent = max === min ? 0 : ((safeValue - min) / (max - min)) * 100;
  const angle = -90 + (percent * 180) / 100;

  return (
    <article className={`speedometer-card speedometer-card--${tone}`}>
      <header className="speedometer-card__head">
        <div className="speedometer-card__icon">{icon}</div>
        <div>
          <h3 className="speedometer-card__title">{title}</h3>
          {sublabel && <p className="speedometer-card__sublabel">{sublabel}</p>}
        </div>
      </header>

      <div className="speedometer">
        <svg viewBox="0 0 220 130" className="speedometer__svg" role="img" aria-label={`${title} gauge`}>
          <path className="speedometer__track" d="M20 110 A90 90 0 0 1 200 110" pathLength={100} />
          <path
            className="speedometer__progress"
            d="M20 110 A90 90 0 0 1 200 110"
            pathLength={100}
            style={{ strokeDasharray: `${percent} 100` }}
          />
          <line
            className="speedometer__needle"
            x1="110"
            y1="110"
            x2="110"
            y2="44"
            style={{ transform: `rotate(${angle}deg)`, transformOrigin: "110px 110px" }}
          />
          <circle className="speedometer__hub" cx="110" cy="110" r="6" />
        </svg>

        <div className="speedometer__value">
          <span className="speedometer__number">{hasValue ? safeValue.toFixed(decimals) : "—"}</span>
          <span className="speedometer__unit">{unit}</span>
        </div>
        <div className="speedometer__range">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </article>
  );
};

export default SpeedometerCard;
