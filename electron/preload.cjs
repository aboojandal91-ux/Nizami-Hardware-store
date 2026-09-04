const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
const electronAPI = {
  isElectron: true,
  platform: process.platform,

  // Window Controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  toggleFullscreen: () => ipcRenderer.invoke('window-toggle-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Printer Management
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printSilent: (options) => ipcRenderer.invoke('print-silent', options),
  printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),

  // File & Dialog Management
  selectFolder: (title) => ipcRenderer.invoke('dialog-select-folder', title),
  openSaveDialog: (options) => ipcRenderer.invoke('dialog-save-file', options),
  openFileDialog: (options) => ipcRenderer.invoke('dialog-open-file', options),
  openPath: (path) => ipcRenderer.invoke('open-path', path),

  // Local Disk Backup
  saveBackup: (folderPath, filename, data) => ipcRenderer.invoke('fs-save-backup', { folderPath, filename, data }),
  readBackup: (filePath) => ipcRenderer.invoke('fs-read-backup', filePath),
  listBackups: (folderPath) => ipcRenderer.invoke('fs-list-backups', folderPath),

  // SQLite Direct Operations
  sqliteGet: (key) => ipcRenderer.invoke('sqlite-get', key),
  sqliteSet: (key, value) => ipcRenderer.invoke('sqlite-set', key, value),

  // System & App Details
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body })
};

// Safe expose through contextBridge if contextIsolation is on
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
} catch (e) {
  // If contextIsolation is false, attach directly to window
  window.electronAPI = electronAPI;
}
