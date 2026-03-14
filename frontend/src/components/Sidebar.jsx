import React from "react";
import logo from "../assets/logo.png"; // User's custom logo

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* ── Brand Section ── */}
      <div className="sidebar__brand">
        <img src={logo} alt="AgroDry-Bot Logo" className="sidebar__logo" />
        <div className="sidebar__title-group">
          <h1 className="sidebar__title">AgroDry-Bot</h1>
          <span className="sidebar__subtitle">Solar Paddy Monitor</span>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <nav className="sidebar__nav">
        <div className="sidebar__tab sidebar__tab--active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Dashboard View
        </div>
        
        {/* Placeholder for future tabs (e.g. Settings, Automation) */}
        <div className="sidebar__tab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          System Config
        </div>
      </nav>

      {/* ── Status Section Bottom ── */}
      <div className="sidebar__footer">
        <div className="sidebar__status-box">
          <div className="sidebar__status-led sidebar__status-led--active"></div>
          <span className="sidebar__status-text">System Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
