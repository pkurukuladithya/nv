// Navbar.jsx — AgroDry-Bot 2026
const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-icon">
          {/* Paddy leaf / grain icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="22" height="22">
            <path d="M12 22V12"/>
            <path d="M12 12C12 12 7 10 5 5c3 0 6 2 7 7z"/>
            <path d="M12 12C12 12 17 10 19 5c-3 0-6 2-7 7z"/>
            <path d="M12 12C12 8 10 4 7 2c0 3 2 7 5 10z"/>
          </svg>
        </div>
        <div>
          <span className="navbar-title">AgroDry-Bot 2026</span>
          <span className="navbar-subtitle">Solar Paddy Drying Monitor</span>
        </div>
      </div>
      <div className="navbar-status">
        <span className="status-dot" />
        <span className="status-label">Live Monitoring</span>
      </div>
    </nav>
  );
};

export default Navbar;
