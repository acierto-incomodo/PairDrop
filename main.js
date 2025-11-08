const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');
const Store = require('electron-store').default;
const { version } = require('./package.json');

const store = new Store();

let tray = null;
let mainWindow = null;

function createWindow() {
  // Recuperamos tamaño y posición guardada
  const windowState = store.get('windowState') || { width: 1200, height: 800 };

  const win = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
  });

  // Guardar tamaño y posición al mover o redimensionar
  win.on('close', () => {
    store.set('windowState', win.getBounds());
  });

  // User agent moderno para PairDrop APP
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
  win.loadURL('https://pairdrop.net', { userAgent: ua });
  mainWindow = win;

  // Bandeja del sistema
  tray = new Tray(path.join(__dirname, 'icons','icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: `PairDrop APP v${version}`, enabled: false },
    { type: 'separator' },
    { label: 'Mostrar PairDrop APP', click: () => mainWindow.show() },
    { label: 'Información', click: () => shell.openExternal('https://github.com/acierto-incomodo/StormStore') },
    { label: 'Salir', click: () => app.quit() }
  ]);

  tray.setToolTip('PairDrop APP');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => mainWindow.show());

  win.on('ready-to-show', () => win.hide());

  // Ocultar ventana al cerrar
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath
  });
});

app.on('window-all-closed', () => { /* no hacemos nada */ });

app.on('before-quit', () => { app.isQuiting = true; });
