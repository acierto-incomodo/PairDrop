// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  doSomething: () => ipcRenderer.invoke('do-something')
});
