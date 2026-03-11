// Navbar.jsx - Top navigation bar
const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <span className="navbar-title">ESP32 Sensor Dashboard</span>
          <span className="navbar-subtitle">IoT Monitoring System</span>
        </div>
      </div>
      <div className="navbar-status">
        <span className="status-dot"></span>
        <span className="status-label">Live</span>
      </div>
    </nav>
  );
};

export default Navbar;
