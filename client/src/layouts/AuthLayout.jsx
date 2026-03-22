import { Link } from "react-router-dom";

const AuthLayout = ({ children, title, subtitle, altText, altLink, altLinkText }) => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
  }}>
    {/* Smoke orbs */}
    <div style={{
      position: "fixed", top: "10%", left: "5%",
      width: "600px", height: "600px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(138,43,43,0.15) 0%, transparent 70%)",
      filter: "blur(60px)", pointerEvents: "none",
    }} />
    <div style={{
      position: "fixed", bottom: "10%", right: "5%",
      width: "500px", height: "500px", borderRadius: "50%",
      background: "radial-gradient(circle, rgba(59,10,10,0.2) 0%, transparent 70%)",
      filter: "blur(60px)", pointerEvents: "none",
    }} />

    <div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "100%", maxWidth: "440px",
        background: "var(--color-bg-card)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
      }}
    >
      {/* Top accent */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, #3b0a0a, #8a2b2b, #f2c9c9)" }} />

      <div style={{ padding: "36px 36px 32px" }}>
        {/* Logo */}
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="12" fill="#3b0a0a"/>
            <rect x="20" y="26" width="24" height="20" rx="4" fill="none" stroke="#f2c9c9" strokeWidth="2.5"/>
            <path d="M24 26v-6a8 8 0 0 1 16 0v6" stroke="#f2c9c9" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="32" cy="36" r="3" fill="#8a2b2b"/>
            <line x1="32" y1="39" x2="32" y2="43" stroke="#8a2b2b" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800, fontSize: "20px",
            letterSpacing: "0.1em",
            color: "var(--color-blush)",
          }}>
            AUTHKIT
          </span>
        </Link>

        {/* Title */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800, fontSize: "26px",
            color: "var(--color-blush)",
            letterSpacing: "0.02em",
            marginBottom: "6px",
          }}>{title}</h1>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>{subtitle}</p>
        </div>

        {children}

        {altText && (
          <p style={{
            marginTop: "24px", textAlign: "center",
            fontSize: "13px", color: "var(--color-text-muted)",
          }}>
            {altText}{" "}
            <Link to={altLink} style={{
              color: "var(--color-mid)",
              fontWeight: 600,
              transition: "color var(--t-fast)",
            }}
              onMouseEnter={(e) => (e.target.style.color = "var(--color-blush)")}
              onMouseLeave={(e) => (e.target.style.color = "var(--color-mid)")}
            >
              {altLinkText}
            </Link>
          </p>
        )}
      </div>
    </div>
  </div>
);

export default AuthLayout;
