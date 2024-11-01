const { app, BrowserWindow, Menu, nativeImage, Tray } = require("electron");
const path = require("node:path");
const { Init } = require("./App");
const Config = require("./App/Config");
const JsonDb = require("./App/JsonDb");
const OldDb = new JsonDb("Database");
if (!OldDb.Get()) {
  OldDb.Create({
    Id: Config.AppID,
    City: Config.DefaultDb.city,
    Country: Config.DefaultDb.country,
    Method: Config.DefaultDb.method,
  });
}
let mainWindow;
let tray = null;
const AppIcon = nativeImage.createFromPath(
  path.join(__dirname, Config.AppIcon)
);
function CreateWindow() {
  mainWindow = new BrowserWindow({
    title: Config.AppName,
    resizable: false,
    maximizable: false,
    width: 1000,
    height: 600,
    icon: AppIcon,
    roundedCorners: true,
    // show: false,
    webPreferences: {
      preload: path.join(__dirname, "public", "Js", "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });
  const menu = new Menu();
  Menu.setApplicationMenu(menu);
  mainWindow.loadFile("index.html");
  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.setThumbarButtons([]);
  mainWindow.setOverlayIcon(AppIcon, Config.AppName);
}
app.setUserTasks([]);
app.whenReady().then(() => {
  CreateWindow();
  Init();
  Minimizeing();
  require("./App/AutoUpdater");
});
require("./App/IpcMain");
app.on("before-quit", () => (app.isQuiting = true));
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length == 0) {
    CreateWindow();
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
});

function Minimizeing() {
  tray = new Tray(AppIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: "Exit",
      click: () => {
        app.isQuiting = true;
        app.quit();
        tray.destroy();
        process.exit(1);
      },
    },
  ]);
  tray.setToolTip(Config.AppName);
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

app.on("window-all-closed", (e) => e.preventDefault());
