import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Shield, MonitorSmartphone,
  ScrollText, Settings, LogOut, Users, Menu, X,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import { toast } from "react-hot-toast";

const NAV = [
  { path: "/dashboard",          label: "Overview",  icon: LayoutDashboard },
  { path: "/dashboard/security", label: "Security",  icon: Shield },
  { path: "/dashboard/sessions", label: "Sessions",  icon: MonitorSmartphone },
  { path: "/dashboard/logs",     label: "Audit Log", icon: ScrollText },
  { path: "/dashboard/settings", label: "Settings",  icon: Settings },
];

const ADMIN_NAV = [
  { path: "/admin",            label: "Stats",    icon: LayoutDashboard },
  { path: "/admin/users",      label: "Users",    icon: Users },
  { path: "/admin/audit-logs", label: "All Logs", icon: ScrollText },
];

const NavItem = ({ path, label, icon: Icon, onClick }) => (
  <NavLink
    to={path}
    end={path === "/dashboard"}
    onClick={onClick}
    style={({ isActive }) => ({
      display: "flex", alignItems: "center", gap: "10px",
      padding: "9px 12px", borderRadius: "var(--radius-md)",
      color: isActive ? "var(--color-blush)" : "var(--color-text-muted)",
      background: isActive ? "rgba(138,43,43,0.2)" : "transparent",
      fontFamily: "var(--font-display)", fontWeight: isActive ? 600 : 500,
      fontSize: "13px", letterSpacing: "0.04em",
      textDecoration: "none", transition: "all var(--t-fast)",
      borderLeft: isActive ? "2px solid var(--color-mid)" : "2px solid transparent",
    })}
  >
    <Icon size={15} />
    {label}
  </NavLink>
);

const SidebarContent = ({ user, onLogout, onNavClick }) => {
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--color-border)", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="12" fill="#3b0a0a"/>
            <rect x="20" y="26" width="24" height="20" rx="4" fill="none" stroke="#f2c9c9" strokeWidth="2.5"/>
            <path d="M24 26v-6a8 8 0 0 1 16 0v6" stroke="#f2c9c9" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="32" cy="36" r="3" fill="#8a2b2b"/>
          </svg>
          <span style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: "16px", letterSpacing: "0.1em", color: "var(--color-blush)",
          }}>AUTHKIT</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 10px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        <p style={{
          fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: 700,
          letterSpacing: "0.12em", color: "var(--color-text-muted)",
          textTransform: "uppercase", padding: "0 10px", marginBottom: "6px",
        }}>Account</p>

        {NAV.map((item) => (
          <NavItem key={item.path} {...item} onClick={onNavClick} />
        ))}

        {isAdmin && (
          <>
            <p style={{
              fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: 700,
              letterSpacing: "0.12em", color: "var(--color-text-muted)",
              textTransform: "uppercase", padding: "12px 10px 6px", marginTop: "8px",
            }}>Admin</p>
            {ADMIN_NAV.map((item) => (
              <NavItem key={item.path} {...item} onClick={onNavClick} />
            ))}
          </>
        )}
      </nav>

      {/* User card */}
      <div style={{ padding: "16px 10px 0", borderTop: "1px solid var(--color-border)", margin: "0 10px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", borderRadius: "var(--radius-md)",
          background: "var(--color-bg-raised)", marginBottom: "8px",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--color-mid)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "13px", color: "var(--color-blush)", flexShrink: 0,
          }}>
            {(user?.displayName || user?.email || "U")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: "12px", fontWeight: 600, color: "var(--color-blush)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {user?.displayName || "User"}
            </p>
            <p style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%", padding: "9px 12px",
            display: "flex", alignItems: "center", gap: "10px",
            color: "var(--color-text-muted)", fontSize: "13px",
            fontFamily: "var(--font-display)", fontWeight: 500,
            borderRadius: "var(--radius-md)",
            transition: "all var(--t-fast)", background: "none", border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error)"; e.currentTarget.style.background = "rgba(231,76,60,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "none"; }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

const DashLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside style={{
        width: "220px", flexShrink: 0,
        background: "var(--color-bg-card)",
        borderRight: "1px solid var(--color-border)",
        padding: "24px 0",
        position: "sticky", top: 0, height: "100vh",
        overflowY: "auto",
      }} className="dash-sidebar">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 200,
          }}
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <div style={{
        position: "fixed", top: 0, left: 0,
        width: "260px", height: "100vh",
        background: "var(--color-bg-card)",
        borderRight: "1px solid var(--color-border)",
        padding: "24px 0",
        zIndex: 201,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
        overflowY: "auto",
      }} className="dash-drawer">
        <SidebarContent
          user={user}
          onLogout={handleLogout}
          onNavClick={() => setMobileOpen(false)}
        />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Mobile top bar */}
        <header style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky", top: 0, zIndex: 100,
        }} className="dash-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="12" fill="#3b0a0a"/>
              <rect x="20" y="26" width="24" height="20" rx="4" fill="none" stroke="#f2c9c9" strokeWidth="2.5"/>
              <path d="M24 26v-6a8 8 0 0 1 16 0v6" stroke="#f2c9c9" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <span style={{
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "15px", letterSpacing: "0.1em", color: "var(--color-blush)",
            }}>AUTHKIT</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              padding: "8px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border)",
              color: "var(--color-blush)", display: "flex",
            }}
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }} className="dash-main">
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dash-sidebar { display: none !important; }
          .dash-topbar  { display: flex !important; }
          .dash-main    { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
};

export default DashLayout;
