import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/retro.css";
import { BrowserRouter } from "react-router-dom";

const DEFAULT_BASENAME = process.env.NODE_ENV === "production" ? "/chacalon" : "/";
const CONFIGURED_BASENAME = process.env.NODE_ENV === "production" ? process.env.PUBLIC_URL : "";
const APP_BASENAME = (CONFIGURED_BASENAME || DEFAULT_BASENAME).replace(/\/+$/, "") || "/";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter basename={APP_BASENAME}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
