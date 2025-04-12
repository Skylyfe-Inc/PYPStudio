import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Using browser router as an outer layer which is mandatory for the routing setup. */}
    <BrowserRouter future={{
    v7_relativeSplatPath: true,
  }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
