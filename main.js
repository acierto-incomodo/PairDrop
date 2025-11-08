const { app, BrowserWindow, session, Tray, Menu } = require('electron');
const path = require('path');
// Agregamos esta línea para obtener la versión del package.json
const { version } = require('./package.json');

let tray = null;
let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // seguridad: no dar acceso Node al contenido web
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // opcional
    },
    icon: path.join(__dirname, 'icons', 'icon.png') // opcional: icono de la app
  });

  win.loadURL('https://pairdrop.net');
  mainWindow = win;

  // Agregamos este evento para asegurarnos que la ventana está lista antes de ocultarla
  win.on('ready-to-show', () => {
  });
}

app.whenReady().then(() => {
  // Opcional: colocar la carpeta de datos en un lugar controlado
  // Uncomment si quieres forzar ruta:
  // app.setPath('userData', path.join(app.getPath('appData'), 'MiAppWhatsApp'));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Modificar el evento window-all-closed
app.on('window-all-closed', () => {
  // No hacer nada, para mantener la app en segundo plano
});

// Agregar evento before-quit
app.on('before-quit', () => {
  app.isQuiting = true;
});
