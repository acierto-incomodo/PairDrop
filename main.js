const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  shell,
  ipcMain,
  dialog,
} = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

// Configuración de logs
log.transports.file.level = "info";
log.catchErrors();
autoUpdater.logger = log;

let mainWindow = null;
let tray = null;

// Evitar múltiples instancias
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    // Si se intenta abrir una segunda instancia, enfocamos la existente
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    setupTray();
    setupAutoUpdater();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Se mostrará cuando esté listo (ready-to-show)
    icon: path.join(__dirname, "icons", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // User Agent para compatibilidad y evitar bloqueos
  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  mainWindow.loadURL("https://pairdrop.net", { userAgent: ua });

  // Mostrar ventana cuando el contenido esté listo
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Comportamiento al cerrar: minimizar al tray en lugar de salir
  mainWindow.on("close", (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  // Manejo de enlaces externos (abrir en navegador predeterminado)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes("pairdrop.net")) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  createMenu();
}

function setupTray() {
  if (tray) return;

  const iconPath = path.join(__dirname, "icons", "icon.png");
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    { label: "Abrir PairDrop", click: () => showWindow() },
    { type: "separator" },
    { label: "Salir", click: () => quitApp() },
  ]);

  tray.setToolTip("PairDrop");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
  });
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

function quitApp() {
  app.isQuiting = true;
  app.quit();
}

function createMenu() {
  const template = [
    {
      label: "Archivo",
      submenu: [
        { label: "Ocultar al Tray", click: () => mainWindow.hide() },
        { label: "Salir", click: () => quitApp() },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Ayuda",
      submenu: [
        {
          label: "GitHub Repo",
          click: () =>
            shell.openExternal("https://github.com/acierto-incomodo/PairDrop"),
        },
        {
          label: "Acerca de",
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: "info",
              title: "PairDrop Desktop",
              message: `Versión: ${app.getVersion()}`,
              detail: "Cliente de escritorio no oficial para pairprop.net",
            });
          },
        },
      ],
    },
    {
      label: "Buscar Actualizaciones",
      click: () => mainWindow.loadFile("updater.html"),
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("check-for-updates", () => {
  autoUpdater.checkForUpdates();
});
ipcMain.handle("download-update", () => {
  autoUpdater.downloadUpdate();
});
ipcMain.handle("quit-and-install", () => {
  autoUpdater.quitAndInstall();
});
ipcMain.handle("go-home", () => {
  if (mainWindow) {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    mainWindow.loadURL("https://pairdrop.net", { userAgent: ua });
  }
});

// AutoUpdater
function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false; // Permitir que el usuario decida cuándo descargar

  autoUpdater.on("checking-for-update", () => {
    log.info("Buscando actualizaciones...");
  });

  autoUpdater.on("update-available", (info) => {
    log.info("Actualización disponible:", info);
    if (mainWindow) mainWindow.webContents.send("update-available", info);
  });

  autoUpdater.on("update-not-available", (info) => {
    log.info("No hay actualizaciones disponibles.");
    if (mainWindow) mainWindow.webContents.send("update-not-available", info);
  });

  autoUpdater.on("error", (err) => {
    log.error("Error en auto-updater:", err);
    if (mainWindow) mainWindow.webContents.send("update-error", err.message);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    if (mainWindow)
      mainWindow.webContents.send("download-progress", progressObj);
  });

  autoUpdater.on("update-downloaded", (info) => {
    log.info("Actualización descargada.");
    if (mainWindow) mainWindow.webContents.send("update-downloaded", info);
  });
}
