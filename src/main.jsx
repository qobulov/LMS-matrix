import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import { LmsProvider } from "./data/LmsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LmsProvider>
        <App />
        <Toaster position="top-right" richColors />
      </LmsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
