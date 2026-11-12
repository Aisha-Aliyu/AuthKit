import { useEffect, useState } from "react";
import Spinner from "./Spinner";

// The health check sits next to the API, outside /api
const HEALTH_URL = `${(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "")}/health`;
const CHECK_EVERY_MS = 5000;
const MAX_CHECKS = 24;

const MESSAGES = {
  checking: "Checking the server...",
  waking: "Waking the server. After a quiet spell this takes about a minute.",
  online: "Server online",
  offline: "The server isn't answering right now. Try again in a few minutes.",
};

// The free server sleeps when nobody uses it, so start waking it as soon as the page opens
const useServerStatus = () => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let checks = 0;

    const check = async () => {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(HEALTH_URL, { cache: "no-store", signal: controller.signal });
        const body = res.ok ? await res.json() : null;
        // Only the API's own answer counts, not a page served by the host while it wakes
        if (body?.status === "OK") {
          if (!cancelled) setStatus("online");
          return;
        }
      } catch {
        // Still asleep or starting up
      } finally {
        clearTimeout(abortTimer);
      }
      if (cancelled) return;
      checks += 1;
      if (checks >= MAX_CHECKS) {
        setStatus("offline");
        return;
      }
      setStatus("waking");
      timer = setTimeout(check, CHECK_EVERY_MS);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return status;
};

const ServerStatus = () => {
  const status = useServerStatus();

  return (
    <p role="status" style={{
      display: "flex", alignItems: "center", gap: "8px",
      fontSize: "12px", lineHeight: 1.5,
      margin: "0 0 20px",
      color: status === "offline" ? "var(--color-error)" : "var(--color-text-sec)",
    }}>
      {status === "online" ? (
        <span aria-hidden="true" style={{
          width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0,
          background: "var(--color-success)",
        }} />
      ) : status !== "offline" ? <Spinner size={12} /> : null}
      {MESSAGES[status]}
    </p>
  );
};

export default ServerStatus;
