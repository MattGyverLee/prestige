// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "./index.css";

import * as serviceWorker from "./serviceWorker";

import App from "./App";
import { Provider } from "react-redux";
import React from "react";
import { createRoot } from "react-dom/client";
import { SnackbarProvider } from "notistack";
import store from "./store/store";

console.log(`process.env: `, process.env);
if (process.env.REACT_APP_MODE === "electron") {
  console.log(`Running in Electron: Filesystem access is enabled.`);
} else {
  console.log("Running on the Web, Filesystem access disabled.");
}
// eslint:disable-next-line
const Root = () => (
  <Provider store={store}>
    <SnackbarProvider maxSnack={3} autoHideDuration={1000}>
      <App />
    </SnackbarProvider>
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
