import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setFromOAuth } = useAuthStore();

  useEffect(() => {
    const accessToken  = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (!accessToken || !refreshToken) {
      toast.error("OAuth login failed");
      navigate("/login");
      return;
    }

    // Fetch user info with the new token
    api.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(({ data }) => {
        setFromOAuth(accessToken, refreshToken, data.user);
        toast.success("Signed in successfully");
        navigate("/dashboard");
      })
      .catch(() => {
        toast.error("OAuth login failed");
        navigate("/login");
      });
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "16px",
    }}>
      <Spinner size={36} />
      <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
        Completing sign in...
      </p>
    </div>
  );
};

export default OAuthCallback;
