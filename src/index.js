import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/retro.css";
import { BrowserRouter } from "react-router-dom";

const APP_BASENAME = (process.env.PUBLIC_URL || "/chacalon").replace(/\/+$/, "") || "/";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter basename={APP_BASENAME}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
