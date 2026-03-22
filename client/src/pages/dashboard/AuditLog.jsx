import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";
import useAuthStore from "../../store/authStore";

const ACTION_COLORS = {
  LOGIN: "var(--color-success)",
  LOGIN_FAILED: "var(--color-error)",
  LOGOUT: "var(--color-text-muted)",
  REGISTER: "#3498db",
  PASSWORD_CHANGE: "var(--color-warning)",
  PASSWORD_RESET: "var(--color-warning)",
  TWO_FA_ENABLE: "var(--color-success)",
  TWO_FA_DISABLE: "var(--color-error)",
  SESSION_REVOKE: "var(--color-mid)",
  ACCOUNT_LOCKED: "var(--color-error)",
  OAUTH_LOGIN: "#3498db",
  default: "var(--color-text-muted)",
};

const AuditLog = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, isAdmin],
    queryFn: async () => {
      const url = isAdmin
        ? `/admin/audit-logs?page=${page}&limit=20`
        : `/admin/audit-logs?page=${page}&limit=20&userId=${user?.id}`;
      const { data } = await api.get(url);
      return data;
    },
  });

  const logs = data?.logs || [];
  const pages = data?.pages || 1;

  const formatDate = (d) => new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div style={{ maxWidth: "800px" }}>
      <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "26px",
          color: "var(--color-blush)", letterSpacing: "0.04em", marginBottom: "4px" }}>
          Audit Log
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Complete history of authentication events
        </p>
      </div>

      <div style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
            <Spinner size={26} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px" }}>
            <p style={{ color: "var(--color-text-muted)" }}>No audit logs yet</p>
          </div>
        ) : (
          logs.map((log, i) => {
            const color = ACTION_COLORS[log.action] || ACTION_COLORS.default;
            return (
              <div key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: "flex", alignItems: "center", gap: "14px",
                  padding: "14px 20px",
                  borderBottom: i < logs.length - 1 ? "1px solid var(--color-border)" : "none",
                  transition: "background var(--t-fast)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-raised)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: color, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700,
                      color, letterSpacing: "0.06em",
                    }}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                    {isAdmin && log.user?.email && (
                      <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                        {log.user.email}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {log.ipAddress || "Unknown IP"} · {log.userAgent?.slice(0, 50) || "Unknown agent"}
                    {log.userAgent?.length > 50 ? "..." : ""}
                  </p>
                </div>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {formatDate(log.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {[...Array(Math.min(pages, 10))].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              style={{
                width: 32, height: 32, borderRadius: "var(--radius-md)",
                background: page === i + 1 ? "var(--color-mid)" : "var(--color-bg-card)",
                color: page === i + 1 ? "var(--color-blush)" : "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
                fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all var(--t-fast)",
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
