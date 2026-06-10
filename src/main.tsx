import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const isElectron = !!(window as any).require;

if (isElectron) {
  try {
    const { ipcRenderer } = (window as any).require('electron');
    
    const originalGetItem = localStorage.getItem.bind(localStorage);
    const originalSetItem = localStorage.setItem.bind(localStorage);

    localStorage.getItem = function(key: string) {
      if (key.startsWith('hw_')) {
        const val = ipcRenderer.sendSync('sqlite-get-sync', key);
        if (val !== null && val !== undefined) {
          return val;
        }
      }
      return originalGetItem(key);
    };

    localStorage.setItem = function(key: string, value: string) {
      if (key.startsWith('hw_')) {
        // Run async in background so we don't freeze UI during large JSON saves,
        // unless strictly required to be sync. The `sendSync` can block.
        // But App.tsx relies on sequential execution. Let's use invoke for fast async saves!
        // No wait, if App loads it immediately next, it'll use sendSync. So let's make Set async to not freeze. No, wait, if we read it immediately, it won't be there. We'll use set-sync for reliability.
        ipcRenderer.sendSync('sqlite-set-sync', key, value);
      }
      originalSetItem(key, value);
    };
  } catch (e) {
    console.error("Failed to override localStorage with SQLite", e);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

