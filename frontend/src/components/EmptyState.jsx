// EmptyState.jsx - Shown when no sensor data exists yet
const EmptyState = () => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
      </div>
      <h3 className="empty-title">No Sensor Data Yet</h3>
      <p className="empty-description">
        Use the form above to add your first sensor reading, or connect your ESP32 device later.
      </p>
    </div>
  );
};

export default EmptyState;
