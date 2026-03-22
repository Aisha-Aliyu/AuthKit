import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Lock } from "lucide-react";
import AuthLayout from "../../layouts/AuthLayout";
import InputField from "../../components/ui/InputField";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      return setErrors({ confirm: "Passwords don't match" });
    }
    if (form.password.length < 8) {
      return setErrors({ password: "Min 8 characters" });
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password: form.password });
      toast.success("Password reset! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid link." subtitle="This reset link is invalid or has expired.">
        <a href="/forgot-password" style={{ color: "var(--color-mid)", fontSize: "14px" }}>
          Request a new one
        </a>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password." subtitle="Choose a strong new password">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <InputField label="New Password" name="password" type="password"
          value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="Min 8 characters" icon={Lock} error={errors.password} />
        <InputField label="Confirm Password" name="confirm" type="password"
          value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          placeholder="Repeat password" icon={Lock} error={errors.confirm} />
        <button type="submit" disabled={loading}
          style={{
            width: "100%", padding: "13px",
            background: "linear-gradient(135deg, #3b0a0a, #8a2b2b)",
            color: "var(--color-blush)",
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "14px", letterSpacing: "0.1em", textTransform: "uppercase",
            borderRadius: "var(--radius-md)", border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
          {loading && <Spinner size={16} />}
          Reset Password
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
