import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/i18n";
import "./index.css";
import App from "./App";

// The browser's back/forward cache can bring back a page exactly as it was, signed-in
// screens included, after the user signed out. Reload it so the session is checked again.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) window.location.reload();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
