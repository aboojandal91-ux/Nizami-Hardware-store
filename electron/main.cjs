const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Initialize SQLite database
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    // Create a generic key-value table to replace local storage
    db.run("CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT)");
  }
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    autoHideMenuBar: true
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for database operations
ipcMain.on('sqlite-get-sync', (event, key) => {
  db.get("SELECT value FROM store WHERE key = ?", [key], (err, row) => {
    if (err) {
      event.returnValue = null;
    } else {
      event.returnValue = row ? row.value : null;
    }
  });
});

ipcMain.on('sqlite-set-sync', (event, key, value) => {
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
    db.get("SELECT value FROM store WHERE key = ?", [key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.value : null);
      }
    });
  });
});

ipcMain.handle('sqlite-set', (event, key, value) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", [key, value], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
});

app.on('ready', createWindow);

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

