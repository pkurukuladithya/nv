// EmptyState.jsx — AgroDry-Bot 2026
const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="52" height="52">
        <path d="M12 22V12"/>
        <path d="M12 12C12 12 7 10 5 5c3 0 6 2 7 7z"/>
        <path d="M12 12C12 12 17 10 19 5c-3 0-6 2-7 7z"/>
        <path d="M12 12C12 8 10 4 7 2c0 3 2 7 5 10z"/>
      </svg>
    </div>
    <h3 className="empty-title">No Paddy Readings Yet</h3>
    <p className="empty-description">
      Start the Python simulator → Connect to HiveMQ Cloud → Power ON →
      click <strong>Publish Once</strong>. Readings will appear here automatically every 4 seconds.
    </p>
  </div>
);

export default EmptyState;
