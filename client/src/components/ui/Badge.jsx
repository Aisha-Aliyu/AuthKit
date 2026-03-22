const VARIANTS = {
  admin:     { bg: "rgba(242,201,201,0.15)", color: "#f2c9c9", border: "rgba(242,201,201,0.3)" },
  moderator: { bg: "rgba(138,43,43,0.2)",   color: "#e88080", border: "rgba(138,43,43,0.4)" },
  user:      { bg: "rgba(59,10,10,0.3)",    color: "#c9908f", border: "rgba(59,10,10,0.5)" },
  success:   { bg: "rgba(46,204,113,0.15)", color: "#2ecc71", border: "rgba(46,204,113,0.3)" },
  error:     { bg: "rgba(231,76,60,0.15)",  color: "#e74c3c", border: "rgba(231,76,60,0.3)" },
  warning:   { bg: "rgba(243,156,18,0.15)", color: "#f39c12", border: "rgba(243,156,18,0.3)" },
  info:      { bg: "rgba(52,152,219,0.15)", color: "#3498db", border: "rgba(52,152,219,0.3)" },
};

const Badge = ({ label, variant = "user" }) => {
  const s = VARIANTS[variant] || VARIANTS.user;
  return (
    <span style={{
      padding: "3px 10px",
      borderRadius: "var(--radius-full)",
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      fontSize: "11px",
      fontWeight: 600,
      fontFamily: "var(--font-display)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      display: "inline-flex",
      alignItems: "center",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
};

export default Badge;
