import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./styles/global.css";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{
          duration: 3500,
          style: {
            background: "var(--color-bg-card)",
            color: "var(--color-blush)",
            border: "1px solid var(--color-border)",
            fontFamily: "var(--font-body)", fontSize: "13px",
            boxShadow: "var(--shadow-md)",
            borderRadius: "10px",
          },
          success: { iconTheme: { primary: "#2ecc71", secondary: "#0d0303" } },
          error: { iconTheme: { primary: "#e74c3c", secondary: "#0d0303" } },
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
