const { app, BrowserWindow, session, Tray, Menu } = require('electron');
const path = require('path');
// Agregamos esta línea para obtener la versión del package.json
const { version } = require('./package.json');

let tray = null;
let mainWindow = null;

function createWindow() {
  // Crear/usar una sesión persistente para PairDrop APP
  // "persist:pairdrop" -> los datos quedan en disco
  const ses = session.fromPartition('persist:pairdrop');

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Agregamos esta línea para que no se muestre al inicio
    webPreferences: {
      // seguridad: no dar acceso Node al contenido web
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'), // opcional
      partition: 'persist:pairdrop' // normalmente no es necesario si usas ses en loadURL, pero es explícito
    },
    icon: path.join(__dirname, 'icons', 'icon.png') // opcional: icono de la app
  });

  // Opcional: algunas webs (PairDrop) detectan userAgent; usar uno moderno ayuda
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

  win.loadURL('https://pairdrop.net', { userAgent: ua });
  mainWindow = win;

  // Crear el icono en la bandeja del sistema
  tray = new Tray(path.join(__dirname, 'icons','icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `PairDrop APP v${version}`, // Usamos la versión del package.json
      enabled: false
    },
    {
      type: 'separator' // Añade una línea separadora
    },
    { 
      label: 'Mostrar PairDrop APP', 
      click: () => mainWindow.show() 
    },
    {
      label: 'Información',
      click: () => {
        require('electron').shell.openExternal('https://github.com/acierto-incomodo/StormStore');
      }
    },
    { 
      label: 'Salir', 
      click: () => app.quit() 
    }
  ]);

  tray.setToolTip('PairDrop APP');
  tray.setContextMenu(contextMenu);

  // Evento cuando se cierra la ventana
  mainWindow.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Opcional: click en el icono de la bandeja muestra la ventana
  tray.on('click', () => {
    mainWindow.show();
  });

  // Agregamos este evento para asegurarnos que la ventana está lista antes de ocultarla
  win.on('ready-to-show', () => {
    win.hide(); // Ocultamos la ventana al inicio
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

  // Configurar inicio automático al arrancar el sistema
  app.setLoginItemSettings({
    openAtLogin: true, // Se iniciará automáticamente
    path: process.execPath
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
