import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { ANALYTICS_EVENT_NAMES, trackError } from "./utils/analytics";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const version = import.meta.env.VITE_APP_VERSION || "dev";
    navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(version)}`).catch((error) => {
      trackError(ANALYTICS_EVENT_NAMES.serviceWorkerError, {
        reason: error instanceof Error ? error.message : "register_failed",
      });
    });
  });
}

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
