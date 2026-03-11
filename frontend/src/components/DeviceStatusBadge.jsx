// DeviceStatusBadge.jsx
// Shows a colored badge for device online/offline status

const DeviceStatusBadge = ({ status }) => {
  const normalized = (status || "unknown").toLowerCase();

  const classMap = {
    online:  "badge badge--online",
    offline: "badge badge--offline",
    warning: "badge badge--warning",
    error:   "badge badge--error",
  };

  const className = classMap[normalized] || "badge badge--default";

  return <span className={className}>{normalized}</span>;
};

export default DeviceStatusBadge;
