import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { User, Mail, CheckCircle, AlertCircle } from "lucide-react";
import InputField from "../../components/ui/InputField";
import Spinner from "../../components/ui/Spinner";
import useAuthStore from "../../store/authStore";
import api from "../../api/axios";

const DashSettings = () => {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    avatar: user?.avatar || "",
  });
  const [avatarError, setAvatarError] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: (data) => api.put("/auth/profile", data),
    onSuccess: ({ data }) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send");
    } finally {
      setResendLoading(false);
    }
  };

  const PersonIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const LinkIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );

  const Section = ({ title, children }) => (
    <div style={{
      background: "var(--color-bg-card)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      marginBottom: "16px",
    }}>
      <h2 style={{
        fontFamily: "var(--font-display)", fontWeight: 700,
        fontSize: "15px", color: "var(--color-blush)",
        letterSpacing: "0.06em", textTransform: "uppercase",
        marginBottom: "20px",
      }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: "580px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "26px", color: "var(--color-blush)",
          letterSpacing: "0.04em", marginBottom: "4px",
        }}>Settings</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Manage your account details
        </p>
      </div>

      {/* Email verification banner */}
      {!user?.isEmailVerified && (
        <div style={{
          background: "rgba(243,156,18,0.08)",
          border: "1px solid rgba(243,156,18,0.25)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          gap: "12px", flexWrap: "wrap",
          marginBottom: "16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={16} color="var(--color-warning)" />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-blush)" }}>
                Email not verified
              </p>
              <p style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={resendLoading}
            style={{
              padding: "7px 14px",
              background: "rgba(243,156,18,0.15)",
              color: "var(--color-warning)",
              border: "1px solid rgba(243,156,18,0.3)",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "12px", letterSpacing: "0.06em",
              cursor: resendLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            {resendLoading ? <Spinner size={12} color="var(--color-warning)" /> : null}
            Resend Email
          </button>
        </div>
      )}

      {user?.isEmailVerified && (
        <div style={{
          background: "rgba(46,204,113,0.08)",
          border: "1px solid rgba(46,204,113,0.2)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 18px",
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "16px",
        }}>
          <CheckCircle size={15} color="var(--color-success)" />
          <p style={{ fontSize: "13px", color: "var(--color-success)", fontWeight: 600 }}>
            Email verified — {user?.email}
          </p>
        </div>
      )}

      {/* Avatar preview */}
      <Section title="Profile">
        <div style={{
          display: "flex", alignItems: "center", gap: "16px",
          marginBottom: "20px", padding: "14px",
          background: "var(--color-bg-raised)",
          borderRadius: "var(--radius-md)",
        }}>
          {form.avatar && !avatarError ? (
            <img
              src={form.avatar}
              alt="Avatar"
              onError={() => setAvatarError(true)}
              style={{
                width: 52, height: 52, borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--color-mid)",
              }}
            />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--color-mid)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontWeight: 800,
              fontSize: "20px", color: "var(--color-blush)",
            }}>
              {(form.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-blush)", fontFamily: "var(--font-display)" }}>
              {form.displayName || "No display name"}
            </p>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              @{user?.email}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <InputField
            label="Display Name"
            name="displayName"
            value={form.displayName}
            onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="Your name"
            icon={PersonIcon}
          />
          <InputField
            label="Avatar URL"
            name="avatar"
            value={form.avatar}
            onChange={(e) => { setForm((p) => ({ ...p, avatar: e.target.value })); setAvatarError(false); }}
            placeholder="https://example.com/avatar.jpg"
            icon={LinkIcon}
          />
        </div>

        <button
          onClick={() => saveProfile(form)}
          disabled={isPending}
          style={{
            marginTop: "18px",
            padding: "11px 24px",
            background: "linear-gradient(135deg, #3b0a0a, #8a2b2b)",
            color: "var(--color-blush)",
            border: "none", borderRadius: "var(--radius-md)",
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "13px", letterSpacing: "0.08em", textTransform: "uppercase",
            cursor: isPending ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {isPending ? <Spinner size={14} /> : null}
          Save Changes
        </button>
      </Section>

      {/* Account info: read only */}
      <Section title="Account Info">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { label: "Email", value: user?.email },
            { label: "Auth Provider", value: user?.provider },
            { label: "Role", value: user?.role },
            { label: "Member Since", value: new Date(user?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", padding: "10px 0",
              borderBottom: "1px solid var(--color-border)",
            }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {label}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-blush)", fontWeight: 500 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default DashSettings;
