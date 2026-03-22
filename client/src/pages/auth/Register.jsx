import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, User } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import InputField from "../../components/ui/InputField";
import Spinner from "../../components/ui/Spinner";
import useAuthStore from "../../store/authStore";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "var(--color-error)", "var(--color-warning)", "#27ae60", "var(--color-success)"][strength];

  const validate = () => {
    const e = {};
    if (!form.displayName.trim()) e.displayName = "Name required";
    if (!form.email) e.email = "Email required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (!form.password) e.password = "Password required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords don't match";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    const result = await register({
      displayName: form.displayName,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (result.success) {
      toast.success("Account created! Check your email to verify.");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
      if (result.feedback) toast(result.feedback, { icon: "💡" });
    }
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  return (
    <AuthLayout
      title="Create account."
      subtitle="Join AuthKit — enterprise-grade security"
      altText="Already have an account?"
      altLink="/login"
      altLinkText="Sign in"
    >
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <InputField label="Display Name" name="displayName" value={form.displayName}
          onChange={handleChange} placeholder="Your name"
          icon={User} error={errors.displayName} />
        <InputField label="Email" name="email" type="email" value={form.email}
          onChange={handleChange} placeholder="you@example.com"
          autoComplete="email" icon={Mail} error={errors.email} />
        <div>
          <InputField label="Password" name="password" type="password" value={form.password}
            onChange={handleChange} placeholder="Min 8 characters"
            autoComplete="new-password" icon={Lock} error={errors.password} />
          {form.password && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                {[1,2,3,4].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: "3px", borderRadius: "2px",
                    background: i <= strength ? strengthColor : "var(--color-border)",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
              <span style={{ fontSize: "11px", color: strengthColor, fontWeight: 600 }}>
                {strengthLabel}
              </span>
            </div>
          )}
        </div>
        <InputField label="Confirm Password" name="confirm" type="password" value={form.confirm}
          onChange={handleChange} placeholder="Repeat password"
          autoComplete="new-password" icon={Lock} error={errors.confirm} />

        <p style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
          By creating an account you agree to our{" "}
          <span style={{ color: "var(--color-mid)" }}>Terms of Service</span> and{" "}
          <span style={{ color: "var(--color-mid)" }}>Privacy Policy</span>.
        </p>

        <button type="submit" disabled={loading}
          style={{
            width: "100%", padding: "13px",
            background: loading ? "var(--color-bg-overlay)" : "linear-gradient(135deg, #3b0a0a, #8a2b2b)",
            color: "var(--color-blush)",
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase",
            borderRadius: "var(--radius-md)", border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: "var(--shadow-md)", transition: "all var(--t-fast)",
          }}>
          {loading && <Spinner size={16} />}
          {loading ? "Creating..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Register;
