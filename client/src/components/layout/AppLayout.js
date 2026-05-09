import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { path: "/dashboard", icon: "📊", label: "Dashboard" },
  { path: "/emis",      icon: "💳", label: "My EMIs"   },
  { path: "/analytics", icon: "📈", label: "Analytics" },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed]     = useState(false);
  const [isMobile, setIsMobile]       = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  const sidebarWidth = collapsed ? "70px" : "240px";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: "block" }} />
      )}

      {/* Sidebar */}
      <aside className={`desktop-sidebar ${isMobile && sidebarOpen ? "open" : ""}`} style={{
        width: isMobile ? "240px" : sidebarWidth,
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transition: "width 0.3s ease, transform 0.3s ease",
        transform: isMobile ? (sidebarOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 34, height: 34, borderRadius: "9px", background: "linear-gradient(135deg,#0ea5e9,#0369a1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", flexShrink: 0 }}>💳</div>
            {(!collapsed || isMobile) && <span style={{ fontFamily: "'Clash Display',sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--text-primary)", whiteSpace: "nowrap" }}>EMI Tracker</span>}
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "18px" }}>✕</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {navItems.map(({ path, icon, label }) => (
            <NavLink key={path} to={path} style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: "12px",
              padding: "11px 12px", borderRadius: "10px", marginBottom: "3px",
              textDecoration: "none", transition: "all 0.2s",
              background: isActive ? "rgba(14,165,233,0.12)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-secondary)",
              borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
            })}>
              <span style={{ fontSize: "18px", flexShrink: 0 }}>{icon}</span>
              {(!collapsed || isMobile) && <span style={{ fontSize: "14px", fontWeight: 500 }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border)" }}>
          {(!collapsed || isMobile) && (
            <div style={{ padding: "10px 12px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</p>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", width: "100%", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}>
            <span style={{ fontSize: "18px" }}>🚪</span>
            {(!collapsed || isMobile) && <span style={{ fontSize: "14px", fontWeight: 500 }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="page-content" style={{
        flex: 1,
        marginLeft: isMobile ? 0 : sidebarWidth,
        minHeight: "100vh",
        transition: "margin-left 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Top bar */}
        <div style={{ padding: "0 20px", height: "var(--topbar-height)", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: "12px", position: "sticky", top: 0, zIndex: 50 }}>
          {isMobile ? (
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "22px", padding: "4px", display: "flex", alignItems: "center" }}>☰</button>
          ) : (
            <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "18px", padding: "4px", borderRadius: "6px", display: "flex", alignItems: "center" }}>
              {collapsed ? "▶" : "◀"}
            </button>
          )}
          <div style={{ width: "1px", height: "20px", background: "var(--border)" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
          {isMobile && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "white" }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{ padding: isMobile ? "16px" : "24px 28px", flex: 1 }} className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav" style={{ display: isMobile ? "flex" : "none", justifyContent: "space-around", alignItems: "center", padding: "8px 0" }}>
        {navItems.map(({ path, icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink key={path} to={path} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "6px 16px", textDecoration: "none", color: isActive ? "var(--accent)" : "var(--text-secondary)", transition: "all 0.2s" }}>
              <span style={{ fontSize: "22px" }}>{icon}</span>
              <span style={{ fontSize: "10px", fontWeight: 600 }}>{label}</span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
};

export default AppLayout;
