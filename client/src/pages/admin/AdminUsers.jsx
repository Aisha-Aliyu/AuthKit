import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Search, ShieldCheck, UserX, Unlock } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users?page=${page}&limit=15&search=${search}`);
      return data;
    },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }) => api.put(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { toast.success("Role updated"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const toggleActive = useMutation({
    mutationFn: (id) => api.put(`/admin/users/${id}/toggle-active`),
    onSuccess: ({ data }) => { toast.success(data.message); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  const unlock = useMutation({
    mutationFn: (id) => api.post(`/admin/users/${id}/unlock`),
    onSuccess: () => { toast.success("Account unlocked"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  const users = data?.users || [];
  const pages = data?.pagination?.pages || 1;

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "26px",
            color: "var(--color-blush)", letterSpacing: "0.04em", marginBottom: "4px" }}>
            User Management
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
            {data?.pagination?.total || 0} total users
          </p>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px",
          background: "var(--color-bg-card)", borderRadius: "var(--radius-full)",
          padding: "9px 16px", border: "1px solid var(--color-border)", minWidth: "240px" }}>
          <Search size={14} color="var(--color-text-muted)" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            style={{ flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: "13px", color: "var(--color-text)", fontFamily: "var(--font-body)" }} />
        </div>
      </div>

      <div style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
          padding: "12px 20px", borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-raised)",
        }}>
          {["User", "Role", "Provider", "Status", "2FA", "Actions"].map((h) => (
            <span key={h} style={{ fontSize: "10px", fontFamily: "var(--font-display)",
              fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--color-text-muted)" }}>
              {h}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner size={24} />
          </div>
        ) : users.map((user, i) => (
          <div key={user.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto",
              padding: "14px 20px", alignItems: "center",
              borderBottom: i < users.length - 1 ? "1px solid var(--color-border)" : "none",
              transition: "background var(--t-fast)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-raised)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {/* User */}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-blush)", marginBottom: "2px" }}>
                {user.displayName || "—"}
              </p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{user.email}</p>
            </div>

            {/* Role */}
            <select value={user.role}
              onChange={(e) => changeRole.mutate({ id: user.id, role: e.target.value })}
              style={{
                background: "var(--color-bg-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text)", fontSize: "11px",
                padding: "4px 8px", cursor: "pointer",
                fontFamily: "var(--font-display)", fontWeight: 600,
                outline: "none",
              }}>
              <option value="USER">USER</option>
              <option value="MODERATOR">MOD</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            {/* Provider */}
            <Badge label={user.provider.toLowerCase()} variant="info" />

            {/* Status */}
            <Badge
              label={!user.isActive ? "inactive" : user.lockedUntil && new Date(user.lockedUntil) > new Date() ? "locked" : "active"}
              variant={!user.isActive ? "error" : user.lockedUntil && new Date(user.lockedUntil) > new Date() ? "warning" : "success"}
            />

            {/* 2FA */}
            <Badge label={user.twoFactorEnabled ? "on" : "off"}
              variant={user.twoFactorEnabled ? "success" : "user"} />

            {/* Actions */}
            <div style={{ display: "flex", gap: "6px" }}>
              {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                <button onClick={() => unlock.mutate(user.id)} title="Unlock account"
                  style={{
                    padding: "5px", borderRadius: "var(--radius-sm)",
                    background: "rgba(46,204,113,0.1)", color: "var(--color-success)",
                    border: "none", cursor: "pointer",
                  }}>
                  <Unlock size={12} />
                </button>
              )}
              <button onClick={() => toggleActive.mutate(user.id)}
                title={user.isActive ? "Deactivate" : "Activate"}
                style={{
                  padding: "5px", borderRadius: "var(--radius-sm)",
                  background: user.isActive ? "rgba(231,76,60,0.1)" : "rgba(46,204,113,0.1)",
                  color: user.isActive ? "var(--color-error)" : "var(--color-success)",
                  border: "none", cursor: "pointer",
                }}>
                {user.isActive ? <UserX size={12} /> : <ShieldCheck size={12} />}
              </button>
            </div>
          </div>
        ))}
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
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
