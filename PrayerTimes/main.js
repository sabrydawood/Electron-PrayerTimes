const { app, BrowserWindow, Menu, nativeImage } = require("electron");
const path = require("node:path");
const { Init } = require("./App");
function createWindow() {
  const appIcon = nativeImage.createFromPath("Icon.ico");
  const win = new BrowserWindow({
    title: "Prayer Times",
    resizable: false,
    maximizable: false,
    width: 800,
    height: 600,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, "public", "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
  });
//   const menuTemplate = [
//     {
//       label: "File",
//       submenu: [
//         { label: "اغلاق", role: "quit" },
//         { label: "تحديث", role: "reload" },
//         { label: "خيارات المطور", role: "toggledevtools" },
//       ],
//     },
//   ];
  const menu = new Menu()
//   const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  win.loadFile("index.html");
}
app.whenReady().then(() => {
  createWindow();
  Init();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
require("./App/IpcMain");
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
