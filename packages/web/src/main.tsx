import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error('Root element not found. Expected <div id="root"></div> in index.html');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AuthProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </AuthProvider>
  </React.StrictMode>
);
