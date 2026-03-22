import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Shield, KeyRound, QrCode } from "lucide-react";
import Spinner from "../../components/ui/Spinner";
import InputField from "../../components/ui/InputField";
import { Lock } from "lucide-react";
import api from "../../api/axios";

const Security = () => {
  const queryClient = useQueryClient();
  const [qrData, setQrData] = useState(null);
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});

  const { data: twoFAData } = useQuery({
    queryKey: ["2fa-status"],
    queryFn: async () => { const { data } = await api.get("/2fa/status"); return data; },
  });

  const setup = useMutation({
    mutationFn: () => api.post("/2fa/setup"),
    onSuccess: ({ data }) => setQrData(data),
    onError: () => toast.error("Setup failed"),
  });

  const enable = useMutation({
    mutationFn: () => api.post("/2fa/enable", { code }),
    onSuccess: () => {
      toast.success("2FA enabled! Please log in again.");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      setQrData(null);
      setCode("");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Invalid code"),
  });

  const disable = useMutation({
    mutationFn: () => api.post("/2fa/disable", { code: disableCode }),
    onSuccess: () => {
      toast.success("2FA disabled");
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      setDisableCode("");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Invalid code"),
  });

  const changePassword = useMutation({
    mutationFn: () => api.put("/auth/change-password", {
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    }),
    onSuccess: () => {
      toast.success("Password changed");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const handlePwSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = "Required";
    if (pwForm.newPassword.length < 8) errs.newPassword = "Min 8 characters";
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = "Passwords don't match";
    if (Object.keys(errs).length) return setPwErrors(errs);
    changePassword.mutate();
  };

  const Section = ({ title, icon: Icon, children }) => (
    <div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: "24px",
        marginBottom: "20px",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <Icon size={18} color="var(--color-mid)" />
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px",
          color: "var(--color-blush)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: "640px" }}>
      <div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "26px",
          color: "var(--color-blush)", letterSpacing: "0.04em", marginBottom: "4px" }}>
          Security
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
          Manage your authentication and security settings
        </p>
      </div>

      {/* 2FA Section */}
      <Section title="Two-Factor Authentication" icon={KeyRound}>
        {twoFAData?.enabled ? (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 14px", background: "rgba(46,204,113,0.1)",
              borderRadius: "var(--radius-md)", border: "1px solid rgba(46,204,113,0.2)",
              marginBottom: "16px",
            }}>
              <Shield size={14} color="var(--color-success)" />
              <span style={{ fontSize: "13px", color: "var(--color-success)", fontWeight: 600 }}>
                2FA is active on your account
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "14px" }}>
              Enter your current authenticator code to disable 2FA:
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <input value={disableCode} onChange={(e) => setDisableCode(e.target.value)}
                placeholder="000000" maxLength={6}
                style={{
                  flex: 1, padding: "10px 14px",
                  background: "var(--color-bg-raised)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-blush)", fontSize: "16px",
                  letterSpacing: "0.2em", fontFamily: "var(--font-display)",
                  outline: "none",
                }}
              />
              <button onClick={() => disable.mutate()} disabled={disable.isPending || !disableCode}
                style={{
                  padding: "10px 20px",
                  background: "rgba(231,76,60,0.15)",
                  color: "var(--color-error)",
                  border: "1px solid rgba(231,76,60,0.3)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "var(--font-display)", fontWeight: 700,
                  fontSize: "12px", letterSpacing: "0.08em",
                  cursor: !disableCode || disable.isPending ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                {disable.isPending ? <Spinner size={14} color="var(--color-error)" /> : null}
                Disable
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>
              Use an authenticator app like Google Authenticator or Authy to generate time-based one-time codes.
            </p>

            <>
              {!qrData ? (
                <button onClick={() => setup.mutate()} disabled={setup.isPending}
                  style={{
                    padding: "10px 20px",
                    background: "linear-gradient(135deg, #3b0a0a, #8a2b2b)",
                    color: "var(--color-blush)",
                    border: "none", borderRadius: "var(--radius-md)",
                    fontFamily: "var(--font-display)", fontWeight: 700,
                    fontSize: "13px", letterSpacing: "0.08em",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "8px",
                    boxShadow: "var(--shadow-sm)",
                  }}>
                  {setup.isPending ? <Spinner size={14} /> : <QrCode size={14} />}
                  Set Up 2FA
                </button>
              ) : (
                <div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <p style={{ fontSize: "13px", color: "var(--color-text-muted)", marginBottom: "14px" }}>
                    Scan this QR code with your authenticator app, then enter the 6-digit code to confirm:
                  </p>
                  <img src={qrData.qrCode} alt="2FA QR Code"
                    style={{ width: "180px", height: "180px", borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)", marginBottom: "16px" }} />
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                    Manual key: <code style={{ color: "var(--color-blush)", fontSize: "12px",
                      background: "var(--color-bg-raised)", padding: "2px 6px", borderRadius: "4px" }}>
                      {qrData.secret}
                    </code>
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input value={code} onChange={(e) => setCode(e.target.value)}
                      placeholder="000000" maxLength={6}
                      style={{
                        flex: 1, padding: "10px 14px",
                        background: "var(--color-bg-raised)",
                        border: "1.5px solid var(--color-border-act)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--color-blush)", fontSize: "16px",
                        letterSpacing: "0.2em", fontFamily: "var(--font-display)", outline: "none",
                      }}
                    />
                    <button onClick={() => enable.mutate()} disabled={enable.isPending || !code}
                      style={{
                        padding: "10px 20px",
                        background: "linear-gradient(135deg, #3b0a0a, #8a2b2b)",
                        color: "var(--color-blush)",
                        border: "none", borderRadius: "var(--radius-md)",
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "12px", letterSpacing: "0.08em",
                        cursor: !code || enable.isPending ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}>
                      {enable.isPending ? <Spinner size={14} /> : null}
                      Verify
                    </button>
                  </div>
                </div>
              )}
            </>
          </div>
        )}
      </Section>

      {/* Password Change */}
      <Section title="Change Password" icon={Lock}>
        <form onSubmit={handlePwSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <InputField label="Current Password" name="currentPassword" type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Your current password" icon={Lock} error={pwErrors.currentPassword} />
          <InputField label="New Password" name="newPassword" type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="Min 8 characters" icon={Lock} error={pwErrors.newPassword} />
          <InputField label="Confirm New Password" name="confirm" type="password"
            value={pwForm.confirm}
            onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
            placeholder="Repeat new password" icon={Lock} error={pwErrors.confirm} />
          <button type="submit" disabled={changePassword.isPending}
            style={{
              padding: "11px 24px", alignSelf: "flex-start",
              background: "linear-gradient(135deg, #3b0a0a, #8a2b2b)",
              color: "var(--color-blush)",
              border: "none", borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "13px", letterSpacing: "0.08em",
              cursor: changePassword.isPending ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
            {changePassword.isPending ? <Spinner size={14} /> : null}
            Update Password
          </button>
        </form>
      </Section>
    </div>
  );
};

export default Security;
