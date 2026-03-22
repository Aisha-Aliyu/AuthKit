import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import Spinner from "./components/ui/Spinner";
import DashLayout from "./layouts/DashLayout";

const Login         = lazy(() => import("./pages/auth/Login"));
const Register      = lazy(() => import("./pages/auth/Register"));
const ForgotPw      = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPw       = lazy(() => import("./pages/auth/ResetPassword"));
const OAuthCallback = lazy(() => import("./pages/auth/OAuthCallback"));
const Overview      = lazy(() => import("./pages/dashboard/Overview"));
const Security      = lazy(() => import("./pages/dashboard/Security"));
const Sessions      = lazy(() => import("./pages/dashboard/Sessions"));
const AuditLog      = lazy(() => import("./pages/dashboard/AuditLog"));
const DashSettings  = lazy(() => import("./pages/dashboard/DashSettings"));
const AdminStats    = lazy(() => import("./pages/admin/AdminStats"));
const AdminUsers    = lazy(() => import("./pages/admin/AdminUsers"));

const Loader = () => (
  <div style={{
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "var(--color-bg)",
  }}>
    <Spinner size={32} />
  </div>
);

const Protected = ({ children, adminOnly }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !["ADMIN", "MODERATOR"].includes(user?.role))
    return <Navigate to="/dashboard" replace />;
  return children;
};

const Public = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<Public><Login /></Public>} />
        <Route path="/register"        element={<Public><Register /></Public>} />
        <Route path="/forgot-password" element={<Public><ForgotPw /></Public>} />
        <Route path="/reset-password"  element={<ResetPw />} />
        <Route path="/oauth/callback"  element={<OAuthCallback />} />
        <Route path="/verify-email"    element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <Protected><DashLayout><Overview /></DashLayout></Protected>
        } />
        <Route path="/dashboard/security" element={
          <Protected><DashLayout><Security /></DashLayout></Protected>
        } />
        <Route path="/dashboard/sessions" element={
          <Protected><DashLayout><Sessions /></DashLayout></Protected>
        } />
        <Route path="/dashboard/logs" element={
          <Protected><DashLayout><AuditLog /></DashLayout></Protected>
        } />
        <Route path="/dashboard/settings" element={
          <Protected><DashLayout><DashSettings /></DashLayout></Protected>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <Protected adminOnly><DashLayout><AdminStats /></DashLayout></Protected>
        } />
        <Route path="/admin/users" element={
          <Protected adminOnly><DashLayout><AdminUsers /></DashLayout></Protected>
        } />
        <Route path="/admin/audit-logs" element={
          <Protected adminOnly><DashLayout><AuditLog /></DashLayout></Protected>
        } />

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
