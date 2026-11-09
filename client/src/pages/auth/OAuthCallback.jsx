import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import Spinner from "../../components/ui/Spinner";
import api from "../../api/axios";

// Tokens arrive in the URL fragment. Older server builds sent them in the query string,
// so fall back to that while both versions might be live.
const readTokens = () => {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  return {
    accessToken: hash.get("accessToken") || query.get("accessToken"),
    refreshToken: hash.get("refreshToken") || query.get("refreshToken"),
  };
};

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setFromOAuth } = useAuthStore();
  const [tokens] = useState(readTokens);

  useEffect(() => {
    // Remove the tokens from the address bar and browser history
    window.history.replaceState(null, "", window.location.pathname);

    const { accessToken, refreshToken } = tokens;
    if (!accessToken || !refreshToken) {
      toast.error("OAuth login failed");
      navigate("/login", { replace: true });
      return;
    }

    // Fetch user info with the new token
    api.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(({ data }) => {
        setFromOAuth(accessToken, refreshToken, data.user);
        toast.success("Signed in successfully");
        navigate("/dashboard", { replace: true });
      })
      .catch(() => {
        toast.error("OAuth login failed");
        navigate("/login", { replace: true });
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
