/* eslint-disable @typescript-eslint/no-var-requires */
const electron = require("electron");
const ipcMain = electron.ipcMain;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const url = require("url");
const isDev = require("electron-is-dev");

let mainWindow;
let imageWindow;
let settingsWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    minHeight: 720,
    minWidth: 720,
    icon: path.join(__dirname, "../src/assets/icons/png/64x64.png"),
    webPreferences: { webSecurity: false, nodeIntegration: true },
  });
  mainWindow.setMenuBarVisibility(false);
  imageWindow = new BrowserWindow({
    width: 600,
    height: 600,
    parent: mainWindow,
    show: false,
  });
  settingsWindow = new BrowserWindow({
    width: 600,
    height: 600,
    parent: mainWindow,
    show: false,
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  mainWindow.setMenuBarVisibility(false);
  imageWindow.loadURL(
    isDev
      ? "http://localhost:3000/image"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );
  settingsWindow.loadURL(
    isDev
      ? "http://localhost:3000/settings"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  mainWindow.on("closed", () => (mainWindow = null));

  imageWindow.on("close", (e) => {
    e.preventDefault();
    imageWindow.hide();
  });

  settingsWindow.on("close", (e) => {
    e.preventDefault();
    settingsWindow.hide();
  });
}

app.on("ready", createWindow);

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
