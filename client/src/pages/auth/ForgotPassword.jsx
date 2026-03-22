import { useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import InputField from "../../components/ui/InputField";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (_) {
      setSent(true); // Always show success and prevents enumeration
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Check your inbox." subtitle="If an account exists, a reset link was sent">
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(138,43,43,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Mail size={24} color="var(--color-mid)" />
          </div>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "20px" }}>
            Check <strong style={{ color: "var(--color-blush)" }}>{email}</strong> for a link to reset your password.
          </p>
          <Link to="/login" style={{ fontSize: "13px", color: "var(--color-mid)", fontWeight: 600 }}>
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send a reset link"
      altText="Remember it?"
      altLink="/login"
      altLinkText="Sign in"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <InputField label="Email" name="email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com" autoComplete="email" icon={Mail} />
        <button type="submit" disabled={loading || !email}
          style={{
            width: "100%", padding: "13px",
            background: !email || loading ? "var(--color-bg-overlay)" : "linear-gradient(135deg, #3b0a0a, #8a2b2b)",
            color: "var(--color-blush)",
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase",
            borderRadius: "var(--radius-md)", border: "none",
            cursor: !email || loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: "var(--shadow-md)",
          }}>
          {loading && <Spinner size={16} />}
          Send Reset Link
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
