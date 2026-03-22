import { useQuery } from "@tanstack/react-query";
import { Shield, Users, KeyRound, AlertTriangle, LogIn, XCircle } from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import Badge from "../../components/ui/Badge";
import api from "../../api/axios";

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div style={{
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    padding: "22px 24px",
    display: "flex", alignItems: "center", gap: "16px",
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: "var(--radius-md)",
      background: `${color}20`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, flexShrink: 0,
    }}>
      <Icon size={22} />
    </div>
    <div>
      <p style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: "28px", color: "var(--color-blush)",
        letterSpacing: "0.02em", lineHeight: 1,
      }}>{value ?? 0}</p>
      <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>{label}</p>
      {sub && <p style={{ fontSize: "11px", color, marginTop: "2px", fontWeight: 600 }}>{sub}</p>}
    </div>
  </div>
);

const AdminStats = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data.stats;
    },
    refetchInterval: 1000 * 60,
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users-recent"],
    queryFn: async () => {
      const { data } = await api.get("/admin/users?page=1&limit=5");
      return data;
    },
  });

  const { data: logsData } = useQuery({
    queryKey: ["admin-logs-recent"],
    queryFn: async () => {
      const { data } = await api.get("/admin/audit-logs?page=1&limit=8");
      return data;
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
        <Spinner size={30} />
      </div>
    );
  }

  const ACTION_COLORS = {
    LOGIN: "var(--color-success)",
    LOGIN_FAILED: "var(--color-error)",
    LOGOUT: "var(--color-text-muted)",
    REGISTER: "#3498db",
    TWO_FA_ENABLE: "var(--color-success)",
    TWO_FA_DISABLE: "var(--color-error)",
    SESSION_REVOKE: "var(--color-mid)",
    ACCOUNT_LOCKED: "var(--color-error)",
    PASSWORD_CHANGE: "var(--color-warning)",
    OAUTH_LOGIN: "#3498db",
  };

  const formatDate = (d) => new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "26px", color: "var(--color-blush)",
          letterSpacing: "0.04em", marginBottom: "4px",
        }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Platform overview and activity
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "14px",
        marginBottom: "28px",
      }}>
        <StatCard
          icon={Users}
          label="Total Users"
          value={data?.users?.total}
          sub={`${data?.users?.active} active`}
          color="#3498db"
        />
        <StatCard
          icon={Shield}
          label="Admins"
          value={data?.users?.admins}
          sub={`${data?.users?.moderators} moderators`}
          color="var(--color-mid)"
        />
        <StatCard
          icon={KeyRound}
          label="2FA Enabled"
          value={data?.users?.withTwoFA}
          sub={`${data?.users?.oauthUsers} OAuth users`}
          color="var(--color-success)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Locked Accounts"
          value={data?.users?.locked}
          color="var(--color-warning)"
        />
        <StatCard
          icon={LogIn}
          label="Logins (24h)"
          value={data?.activity?.loginsLast24h}
          color="var(--color-success)"
        />
        <StatCard
          icon={XCircle}
          label="Failed Logins (24h)"
          value={data?.activity?.failedLoginsLast24h}
          color="var(--color-error)"
        />
      </div>

      {/* Two column layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
      }}
        className="admin-grid"
      >
        {/* Recent users */}
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h3 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "14px", color: "var(--color-blush)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Recent Users
            </h3>
            <a href="/admin" style={{ fontSize: "12px", color: "var(--color-mid)" }}>
              View all
            </a>
          </div>
          {(usersData?.users || []).map((user, i) => (
            <div key={user.id} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 20px",
              borderBottom: i < 4 ? "1px solid var(--color-border)" : "none",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: "var(--color-mid)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "13px", color: "var(--color-blush)", flexShrink: 0,
              }}>
                {(user.displayName || user.email)[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: "13px", fontWeight: 600,
                  color: "var(--color-blush)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {user.displayName || user.email}
                </p>
                <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge
                label={user.role.toLowerCase()}
                variant={user.role.toLowerCase()}
              />
            </div>
          ))}
        </div>

        {/* Recent audit logs */}
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <h3 style={{
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "14px", color: "var(--color-blush)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Recent Activity
            </h3>
            <a href="/admin/audit-logs" style={{ fontSize: "12px", color: "var(--color-mid)" }}>
              View all
            </a>
          </div>
          {(logsData?.logs || []).map((log, i) => {
            const color = ACTION_COLORS[log.action] || "var(--color-text-muted)";
            return (
              <div key={log.id} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 20px",
                borderBottom: i < 7 ? "1px solid var(--color-border)" : "none",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: color, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "12px", fontFamily: "var(--font-display)",
                    fontWeight: 700, color, letterSpacing: "0.04em",
                  }}>
                    {log.action.replace(/_/g, " ")}
                  </p>
                  <p style={{
                    fontSize: "10px", color: "var(--color-text-muted)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {log.user?.email || "Unknown"}
                  </p>
                </div>
                <span style={{ fontSize: "10px", color: "var(--color-text-muted)", flexShrink: 0 }}>
                  {formatDate(log.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminStats;
