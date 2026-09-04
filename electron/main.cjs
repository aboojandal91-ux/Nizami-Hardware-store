const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

// Initialize SQLite database
let db = null;
try {
  const sqlite3 = require('sqlite3').verbose();
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database.sqlite');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
    } else {
      db.run("CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)");
    }
  });
} catch (e) {
  console.warn("SQLite3 initialization skipped or using fallback storage", e.message);
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Allows window.require and preload smoothly
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/logo.png'),
    autoHideMenuBar: true,
    title: "Aboo's Software Management System"
  });

  const isLocalDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  if (isLocalDev || isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external links safely in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// -------------------------------------------------------------
// WINDOW CONTROLS IPC HANDLERS
// -------------------------------------------------------------
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('window-toggle-fullscreen', () => {
  if (!mainWindow) return false;
  const isFullScreen = !mainWindow.isFullScreen();
  mainWindow.setFullScreen(isFullScreen);
  return isFullScreen;
});

// -------------------------------------------------------------
// PRINTER & RECEIPT THERMAL HARDWARE IPC HANDLERS
// -------------------------------------------------------------
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    return printers || [];
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

ipcMain.handle('print-silent', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No main window' };
  return new Promise((resolve) => {
    const printOptions = {
      silent: options.silent !== undefined ? options.silent : true,
      printBackground: true,
      deviceName: options.deviceName || '',
      copies: options.copies || 1,
      pageSize: options.pageSize || 'A4',
      margins: { marginType: 'none' },
      ...options
    };

    mainWindow.webContents.print(printOptions, (success, failureReason) => {
      if (!success) {
        resolve({ success: false, error: failureReason });
      } else {
        resolve({ success: true });
      }
    });
  });
});

ipcMain.handle('print-to-pdf', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No window' };
  try {
    const pdfData = await mainWindow.webContents.printToPDF(options);
    return { success: true, data: pdfData };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// -------------------------------------------------------------
// NATIVE FILE DIALOGS & DESKTOP DISK BACKUP HANDLERS
// -------------------------------------------------------------
ipcMain.handle('dialog-select-folder', async (event, title = 'Select Folder for Auto-Backup') => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title,
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('dialog-save-file', async (event, options = {}) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Save Backup File',
    defaultPath: options.defaultPath || 'Aboos_SMS_Backup.json',
    filters: options.filters || [{ name: 'JSON Backup', extensions: ['json'] }]
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('dialog-open-file', async (event, options = {}) => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Open Backup File',
    filters: options.filters || [{ name: 'JSON Backup', extensions: ['json'] }],
    properties: ['openFile']
  });
  return result.canceled || !result.filePaths ? null : result.filePaths[0];
});

ipcMain.handle('open-path', async (event, targetPath) => {
  if (!targetPath) return false;
  try {
    await shell.openPath(targetPath);
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('fs-save-backup', async (event, { folderPath, filename, data }) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const fullPath = path.join(folderPath, filename);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(fullPath, content, 'utf8');
    return { success: true, filePath: fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs-read-backup', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs-list-backups', async (event, folderPath) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) {
      return { success: true, files: [] };
    }
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.json'))
      .map(name => {
        const full = path.join(folderPath, name);
        const stat = fs.statSync(full);
        return {
          name,
          path: full,
          size: stat.size,
          mtime: stat.mtime
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message, files: [] };
  }
});

// -------------------------------------------------------------
// SQLITE DATABASE STORAGE IPC
// -------------------------------------------------------------
ipcMain.on('sqlite-get-sync', (event, key) => {
  if (!db) {
    event.returnValue = null;
    return;
  }
  db.get("SELECT value FROM store WHERE key = ?", [key], (err, row) => {
    if (err) {
      event.returnValue = null;
    } else {
      event.returnValue = row ? row.value : null;
    }
  });
});

ipcMain.on('sqlite-set-sync', (event, key, value) => {
  if (!db) {
    event.returnValue = false;
    return;
  }
  db.run("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", [key, value], function(err) {
    if (err) {
      event.returnValue = false;
    } else {
      event.returnValue = true;
    }
  });
});

ipcMain.handle('sqlite-get', (event, key) => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve(null);
    db.get("SELECT value FROM store WHERE key = ?", [key], (err, row) => {
      if (err) resolve(null);
      else resolve(row ? row.value : null);
    });
  });
});

ipcMain.handle('sqlite-set', (event, key, value) => {
  return new Promise((resolve, reject) => {
    if (!db) return resolve(false);
    db.run("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", [key, value], function(err) {
      if (err) resolve(false);
      else resolve(true);
    });
  });
});

// -------------------------------------------------------------
// APP INFO & SYSTEM NOTIFICATION
// -------------------------------------------------------------
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    userDataPath: app.getPath('userData'),
    appName: "Aboo's Software Management System"
  };
});

ipcMain.handle('show-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || "Aboo's Software Management System",
      body: body || '',
      icon: path.join(__dirname, '../public/logo.png')
    }).show();
    return true;
  }
  return false;
});

// -------------------------------------------------------------
// APP LIFECYCLE
// -------------------------------------------------------------
app.on('ready', () => {
  const { session } = require('electron');
  session.defaultSession.clearStorageData({
    storages: ['serviceworkers', 'caches']
  }).then(() => {
    createWindow();
  }).catch(() => {
    createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
