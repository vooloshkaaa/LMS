import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import logger from "./utils/logger";
import { initializeAppProfilers } from "./utils/profiling/setup";
import "./utils/profiling/runProfiling"; // Автоматичне профілювання в dev режимі

// Ініціалізація профілерів
initializeAppProfilers().catch(error => {
  logger.error("Failed to initialize profilers:", error);
});

logger.info("Application started");

const basename = import.meta.env.BASE_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
