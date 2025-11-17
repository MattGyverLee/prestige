// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "./index.css";

import * as serviceWorker from "./serviceWorker";

import App from "./App";
import { Provider } from "react-redux";
import React from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import store from "./store/store";

// Suppress defaultProps deprecation warnings from third-party libraries
// This is specifically for @devexpress/dx-react-grid-material-ui which is in maintenance mode
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Support for defaultProps will be removed")
  ) {
    return;
  }
  originalError.call(console, ...args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Support for defaultProps will be removed")
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

console.log(`process.env: `, process.env);
if (process.env.REACT_APP_MODE === "electron") {
  console.log(`Running in Electron: Filesystem access is enabled.`);
} else {
  console.log("Running on the Web, Filesystem access disabled.");
}
// eslint:disable-next-line
const Root = () => (
  <Provider store={store}>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#363636",
          color: "#fff",
        },
      }}
    />
  </Provider>
);

// expose store when run in Cypress
// @typescript-ignore
if (window.Cypress) {
  window.store = store;
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<Root />);
}

// Enable service worker for PWA mode
// In Electron mode, service worker is not needed (direct file system access)
if (process.env.REACT_APP_MODE === "web") {
  console.log("[PWA] Registering service worker for offline support");
  serviceWorker.register({
    onSuccess: (registration) => {
      console.log("[PWA] Service worker registered successfully", registration);
    },
    onUpdate: (registration) => {
      console.log("[PWA] Service worker updated", registration);
      // Optionally show toast notification to user
      if (window.confirm("New version available! Reload to update?")) {
        window.location.reload();
      }
    },
  });
} else {
  console.log("[Electron] Service worker not needed in desktop mode");
  serviceWorker.unregister();
}
