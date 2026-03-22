import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Monitor, Smartphone, Trash2, ShieldOff } from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

const Sessions = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => { const { data } = await api.get("/sessions"); return data; },
  });

  const revoke = useMutation({
    mutationFn: (id) => api.delete(`/sessions/${id}`),
    onSuccess: () => {
      toast.success("Session revoked");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: () => toast.error("Failed to revoke session"),
  });

  const revokeAll = useMutation({
    mutationFn: () => api.delete("/sessions"),
    onSuccess: () => {
      toast.success("All sessions revoked — please log in again");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setTimeout(() => window.location.href = "/login", 1500);
    },
  });

  const sessions = data?.sessions || [];

  const getDeviceIcon = (info = "") => {
    if (info.toLowerCase().includes("mobile") || info.toLowerCase().includes("ios") || info.toLowerCase().includes("android")) {
      return <Smartphone size={16} />;
    }
    return <Monitor size={16} />;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  return (
    <div style={{ maxWidth: "700px" }}>
      <div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "26px",
            color: "var(--color-blush)", letterSpacing: "0.04em", marginBottom: "4px" }}>
            Active Sessions
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            {sessions.length} active session{sessions.length !== 1 ? "s" : ""} across your devices
          </p>
        </div>

        {sessions.length > 1 && (
          <button onClick={() => revokeAll.mutate()} disabled={revokeAll.isPending}
            style={{
              padding: "9px 16px",
              background: "rgba(231,76,60,0.1)",
              color: "var(--color-error)",
              border: "1px solid rgba(231,76,60,0.2)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "12px", letterSpacing: "0.08em",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
            <ShieldOff size={13} />
            Revoke All
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
          <Spinner size={28} />
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "48px",
          background: "var(--color-bg-card)",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
        }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>No active sessions found</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <>
            {sessions.map((session, i) => (
              <div key={session.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: "16px",
                  justifyContent: "space-between",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "var(--radius-md)",
                    background: "var(--color-bg-raised)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--color-mid)", flexShrink: 0,
                  }}>
                    {getDeviceIcon(session.deviceInfo)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-blush)", marginBottom: "2px" }}>
                      {session.deviceInfo || "Unknown Device"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      {session.ipAddress || "Unknown IP"} · Last active {formatDate(session.lastUsedAt)}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      Created {formatDate(session.createdAt)} · Expires {formatDate(session.expiresAt)}
                    </p>
                  </div>
                </div>
                <button onClick={() => revoke.mutate(session.id)}
                  disabled={revoke.isPending}
                  style={{
                    padding: "8px", borderRadius: "var(--radius-md)",
                    color: "var(--color-text-muted)",
                    background: "none", border: "none",
                    cursor: "pointer", transition: "all var(--t-fast)",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error)"; e.currentTarget.style.background = "rgba(231,76,60,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; e.currentTarget.style.background = "none"; }}
                  title="Revoke session">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </>
        </div>
      )}
    </div>
  );
};

export default Sessions;
