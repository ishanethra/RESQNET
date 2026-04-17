import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App.jsx";
import "./src/styles/app.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
