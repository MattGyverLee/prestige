/* eslint-disable @typescript-eslint/no-var-requires */
const electron = require("electron");
const ipcMain = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");

// TODO: Remove this and follow instructions here:
// https://github.com/electron/electron/blob/master/docs/tutorial/security.md#electron-security-warnings
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

let mainWindow;
let imageWindow;
let settingsWindow;

function createWindow() {
  // Check isDev inside the function after electron is initialized
  const isDev = require("electron-is-dev");
  // Use VITE_DEV_SERVER_PORT env var if set, otherwise default to 5173 (Vite's default)
  const devPort = process.env.VITE_DEV_SERVER_PORT || "5173";
  const devUrl = `http://localhost:${devPort}`;

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minHeight: 720,
    minWidth: 720,
    title: "Prestige",
    icon: path.join(__dirname, "../src/assets/icons/png/64x64.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Required for nodeIntegration to work
      webSecurity: false,
      sandbox: false, // Disable sandbox to fix the error
    },
  });
  imageWindow = new BrowserWindow({
    width: 600,
    height: 600,
    parent: mainWindow,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
    },
  });
  settingsWindow = new BrowserWindow({
    width: 600,
    height: 600,
    parent: mainWindow,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL(
    isDev
      ? devUrl
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  imageWindow.loadURL(
    isDev
      ? `${devUrl}/image`
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  settingsWindow.loadURL(
    isDev
      ? `${devUrl}/settings`
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => (mainWindow = null));

  imageWindow.on("close", (e) => {
    e.preventDefault();
    imageWindow.hide();
  });

  settingsWindow.on("close", (e) => {
    e.preventDefault();
    settingsWindow.hide();
  });
  /* mainWindow.webContents.on('did-finish-load', () => {
    let windowTitle = "Prestige: " + appMode+ "- " + envMode
    mainWindow.setTitle(windowTitle)
  }) */
}

app.on("ready", async () => {
  // Load electron-devtools-installer after app is ready
  const {
    default: installExtension,
    REDUX_DEVTOOLS,
  } = require("electron-devtools-installer");
  const { session } = require("electron");

  // Install Redux DevTools extension using the new API
  try {
    const name = await installExtension(REDUX_DEVTOOLS, {
      loadExtensionOptions: { allowFileAccess: true },
      forceDownload: false,
    });
    console.log(`Added Extension: ${name}`);
  } catch (err) {
    console.log("Could not install Redux DevTools:", err.message);
  }

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("toggle-image", (event, arg) => {
  imageWindow.show();
  imageWindow.webContents.send("image", arg);
});

ipcMain.on("toggle-settings", () => {
  settingsWindow.isVisible() ? settingsWindow.hide() : settingsWindow.show();
});
