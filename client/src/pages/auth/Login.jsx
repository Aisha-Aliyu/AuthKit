import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import InputField from "../../components/ui/InputField";
import Spinner from "../../components/ui/Spinner";
import useAuthStore from "../../store/authStore";

const Btn = ({ children, loading, disabled, type = "submit", onClick, variant = "primary" }) => {
  const isPrimary = variant === "primary";
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{
        width: "100%", padding: "13px",
        background: isPrimary
          ? (disabled || loading ? "var(--color-bg-overlay)" : "linear-gradient(135deg, #3b0a0a, #8a2b2b)")
          : "transparent",
        color: isPrimary ? "var(--color-blush)" : "var(--color-text-muted)",
        fontFamily: "var(--font-display)", fontWeight: 700,
        fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase",
        borderRadius: "var(--radius-md)",
        border: isPrimary ? "none" : "1px solid var(--color-border)",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        boxShadow: isPrimary && !disabled ? "var(--shadow-md)" : "none",
        transition: "all var(--t-fast)",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading && isPrimary) {
          e.currentTarget.style.boxShadow = "var(--shadow-glow)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isPrimary ? "var(--shadow-md)" : "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
};

const OAuthBtn = ({ provider, icon, onClick }) => (
  <button type="button" onClick={onClick}
    style={{
      flex: 1, padding: "11px",
      background: "var(--color-bg-raised)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-md)",
      color: "var(--color-text-sec)",
      fontSize: "13px", fontFamily: "var(--font-body)", fontWeight: 500,
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
      cursor: "pointer", transition: "all var(--t-fast)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "var(--color-border-act)";
      e.currentTarget.style.background = "var(--color-bg-overlay)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--color-border)";
      e.currentTarget.style.background = "var(--color-bg-raised)";
    }}
  >
    {icon}
    {provider}
  </button>
);

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWith2FA } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [twoFA, setTwoFA] = useState({ required: false, tempToken: "", code: "" });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = "Email required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (!form.password) e.password = "Password required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    const result = await login(form);
    setLoading(false);
    if (result.success) {
      toast.success("Welcome back");
      navigate("/dashboard");
    } else if (result.requiresTwoFactor) {
      setTwoFA((p) => ({ ...p, required: true, tempToken: result.tempToken }));
    } else {
      toast.error(result.message);
      if (result.locked) setErrors({ password: "Account temporarily locked" });
    }
  };

  const handle2FA = async (e) => {
    e.preventDefault();
    if (!twoFA.code.trim()) return;
    setLoading(true);
    const result = await loginWith2FA(twoFA.tempToken, twoFA.code);
    setLoading(false);
    if (result.success) {
      toast.success("Welcome back");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const GithubIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );

  if (twoFA.required) {
    return (
      <AuthLayout title="Two-Factor Auth" subtitle="Enter the 6-digit code from your authenticator app">
        <form onSubmit={handle2FA} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <input
            value={twoFA.code}
            onChange={(e) => setTwoFA((p) => ({ ...p, code: e.target.value }))}
            placeholder="000 000"
            maxLength={7}
            autoFocus
            style={{
              width: "100%", padding: "16px",
              textAlign: "center", fontSize: "28px",
              letterSpacing: "0.3em", fontFamily: "var(--font-display)",
              background: "var(--color-bg-raised)",
              border: "1.5px solid var(--color-border-act)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-blush)", outline: "none",
              boxShadow: "0 0 0 3px rgba(138,43,43,0.2)",
            }}
          />
          <Btn loading={loading}>Verify</Btn>
          <button type="button" onClick={() => setTwoFA({ required: false, tempToken: "", code: "" })}
            style={{ fontSize: "13px", color: "var(--color-text-muted)", background: "none", border: "none" }}>
            Back to login
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back."
      subtitle="Sign in to your AuthKit account"
      altText="No account?"
      altLink="/register"
      altLinkText="Create one"
    >
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <InputField label="Email" name="email" type="email" value={form.email}
          onChange={handleChange} placeholder="you@example.com"
          autoComplete="email" icon={Mail} error={errors.email} />
        <InputField label="Password" name="password" type="password" value={form.password}
          onChange={handleChange} placeholder="Your password"
          autoComplete="current-password" icon={Lock} error={errors.password} />

        <div style={{ textAlign: "right", marginTop: "-6px" }}>
          <Link to="/forgot-password" style={{ fontSize: "12px", color: "var(--color-text-muted)",
            transition: "color var(--t-fast)" }}
            onMouseEnter={(e) => (e.target.style.color = "var(--color-mid)")}
            onMouseLeave={(e) => (e.target.style.color = "var(--color-text-muted)")}>
            Forgot password?
          </Link>
        </div>

        <Btn loading={loading}>Sign In</Btn>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", letterSpacing: "0.08em" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <OAuthBtn provider="Google" icon={<GoogleIcon />}
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`} />
          <OAuthBtn provider="GitHub" icon={<GithubIcon />}
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`} />
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
