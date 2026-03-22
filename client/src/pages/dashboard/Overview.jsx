import { useQuery } from "@tanstack/react-query";
import { Shield, MonitorSmartphone, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    style={{
      background: "var(--color-bg-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "22px 24px",
      display: "flex", alignItems: "center", gap: "16px",
    }}
  >
    <div style={{
      width: 44, height: 44, borderRadius: "var(--radius-md)",
      background: `${color}20`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, flexShrink: 0,
    }}>
      <Icon size={20} />
    </div>
    <div>
      <p style={{ fontSize: "22px", fontWeight: 800, fontFamily: "var(--font-display)", color: "var(--color-blush)" }}>{value}</p>
      <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{label}</p>
    </div>
  </div>
);

const Overview = () => {
  const { user } = useAuthStore();

  const { data: sessionsData } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => { const { data } = await api.get("/sessions"); return data; },
  });

  const { data: twoFAData } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: async () => { const { data } = await api.get("/2fa/status"); return data; },
  });

  const sessions = sessionsData?.sessions || [];

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "32px" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "28px", color: "var(--color-blush)",
          letterSpacing: "0.04em", marginBottom: "6px",
        }}>
          Welcome back, {user?.displayName?.split(" ")[0] || "there"}.
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Here's your account security overview
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <StatCard icon={Shield} label="Account Role" value={user?.role} color="var(--color-mid)" delay={0.05} />
        <StatCard icon={MonitorSmartphone} label="Active Sessions" value={sessions.length} color="#3498db" delay={0.1} />
        <StatCard icon={KeyRound} label="Two-Factor Auth" value={twoFAData?.enabled ? "Enabled" : "Disabled"}
          color={twoFAData?.enabled ? "var(--color-success)" : "var(--color-warning)"} delay={0.15} />
      </div>

      {/* Account info card */}
      <div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "24px", marginBottom: "20px",
        }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px",
          color: "var(--color-blush)", letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: "18px" }}>
          Account Details
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {[
            { label: "Email", value: user?.email },
            { label: "Display Name", value: user?.displayName || "Not set" },
            { label: "Account Type", value: <Badge label={user?.role?.toLowerCase()} variant={user?.role?.toLowerCase()} /> },
            { label: "Provider", value: <Badge label={user?.provider?.toLowerCase()} variant="info" /> },
            { label: "Email Verified", value: user?.isEmailVerified
              ? <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={14} /> Verified</span>
              : <span style={{ color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={14} /> Unverified</span> },
            { label: "Member Since", value: new Date(user?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "var(--font-display)",
                fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                {label}
              </p>
              <p style={{ fontSize: "14px", color: "var(--color-text)", display: "flex", alignItems: "center" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Security prompt if 2FA not enabled */}
      {twoFAData && !twoFAData.enabled && (
        <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{
            background: "rgba(243,156,18,0.08)",
            border: "1px solid rgba(243,156,18,0.2)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "16px", flexWrap: "wrap",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertCircle size={18} color="var(--color-warning)" />
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-blush)" }}>
                Two-factor authentication is off
              </p>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <Link to="/dashboard/security" style={{
            padding: "8px 18px",
            background: "rgba(243,156,18,0.15)",
            color: "var(--color-warning)",
            borderRadius: "var(--radius-md)",
            fontSize: "13px", fontWeight: 600,
            fontFamily: "var(--font-display)",
            border: "1px solid rgba(243,156,18,0.3)",
            transition: "all var(--t-fast)",
          }}>
            Enable 2FA
          </Link>
        </div>
      )}
    </div>
  );
};

export default Overview;
