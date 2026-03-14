import { useEffect, useState } from "react";
import logo from "../assets/logo.png";

const MOBILE_BREAKPOINT = 960;

const NAV_ITEMS = [
  {
    href: "#device-status",
    label: "Device Status",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      </svg>
    ),
  },
  {
    href: "#process-status",
    label: "Process Status",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M4 12h16" />
        <path d="M12 4v16" />
      </svg>
    ),
  },
  {
    href: "#scenario",
    label: "Scenario",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12h6" />
        <path d="M12 9v6" />
      </svg>
    ),
  },
  {
    href: "#live-sensor-readings",
    label: "Live Sensor Readings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M3 3v18h18" />
        <path d="M7 15l3-3 2 2 5-6" />
      </svg>
    ),
  },
  {
    href: "#history",
    label: "History",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    href: "#about-us",
    label: "About Us",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
];

const Sidebar = () => {
  const [activeHash, setActiveHash] = useState(
    typeof window !== "undefined" && window.location.hash ? window.location.hash : "#device-status"
  );
  const [navOpen, setNavOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth > MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const onHashChange = () => {
      setActiveHash(window.location.hash || "#device-status");
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const sectionElements = NAV_ITEMS.map((item) => document.querySelector(item.href)).filter(Boolean);
    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) return;

        const nextHash = `#${visible[0].target.id}`;
        setActiveHash(nextHash);

        if (window.location.hash !== nextHash) {
          window.history.replaceState(null, "", nextHash);
        }
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    sectionElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setNavOpen(window.innerWidth > MOBILE_BREAKPOINT);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = (href) => {
    setActiveHash(href);
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setNavOpen(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand-wrap">
        <div className="sidebar__brand">
          <img src={logo} alt="AgroDry-Bot Logo" className="sidebar__logo" />
          <h1 className="sidebar__title">AgroDry-Bot</h1>
        </div>

        <button
          type="button"
          className="sidebar__menu-toggle"
          onClick={() => setNavOpen((prev) => !prev)}
          aria-expanded={navOpen}
          aria-controls="sidebar-navigation"
          aria-label="Toggle navigation"
        >
          {navOpen ? "Close" : "Menu"}
        </button>
      </div>

      <nav
        id="sidebar-navigation"
        className={`sidebar__nav${navOpen ? " sidebar__nav--open" : ""}`}
        aria-label="Section Navigation"
      >
        <div className="sidebar__nav-group">
          <p className="sidebar__group-title">Navigation</p>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar__tab${activeHash === item.href ? " sidebar__tab--active" : ""}`}
              onClick={() => handleNavClick(item.href)}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>

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
