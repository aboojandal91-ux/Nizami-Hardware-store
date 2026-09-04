import React, { useState, useEffect } from 'react';
import { Minus, Square, Copy, X, Maximize2, Minimize2, HardDrive, Printer, Database, Sparkles, Monitor } from 'lucide-react';
import { AbooLogo } from './AbooLogo';
import { Language } from '../translations';

interface ElectronDesktopBarProps {
  onOpenBackupManager?: () => void;
  lang?: Language;
}

export const ElectronDesktopBar: React.FC<ElectronDesktopBarProps> = ({
  onOpenBackupManager,
  lang = 'en'
}) => {
  const [isElectron, setIsElectron] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [printerCount, setPrinterCount] = useState<number | null>(null);

  useEffect(() => {
    const electronAvailable = !!(window as any).electronAPI || !!(window as any).require;
    setIsElectron(electronAvailable);

    if (electronAvailable && (window as any).electronAPI) {
      // Check window maximized state
      (window as any).electronAPI.isMaximized?.().then((max: boolean) => {
        setIsMaximized(max);
      }).catch(() => {});

      // Query printers
      (window as any).electronAPI.getPrinters?.().then((printers: any[]) => {
        if (Array.isArray(printers)) {
          setPrinterCount(printers.length);
        }
      }).catch(() => {});
    }
  }, []);

  const handleMinimize = () => {
    if ((window as any).electronAPI?.minimize) {
      (window as any).electronAPI.minimize();
    } else if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer?.send('window-minimize');
    }
  };

  const handleMaximize = () => {
    if ((window as any).electronAPI?.maximize) {
      (window as any).electronAPI.maximize();
      setIsMaximized(!isMaximized);
    } else if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer?.send('window-maximize');
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI?.close) {
      (window as any).electronAPI.close();
    } else if ((window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer?.send('window-close');
    }
  };

  const handleToggleFullscreen = () => {
    if ((window as any).electronAPI?.toggleFullscreen) {
      (window as any).electronAPI.toggleFullscreen().then((fs: boolean) => {
        setIsFullscreen(fs);
      });
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
      } else {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <div 
      className="w-full bg-slate-950 text-slate-400 text-xs px-3 py-1 flex items-center justify-between border-b border-slate-800/80 select-none shrink-0 z-40 h-8"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Left: Desktop Brand Badge */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <AbooLogo size="xs" />
        <span className="font-bold text-slate-200 text-[11px] tracking-wide">
          Aboo's Software Management System
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-blue-500/20 font-semibold flex items-center gap-1">
          <Monitor className="w-2.5 h-2.5" />
          {isElectron ? 'Desktop Native App' : 'Desktop Preview Ready'}
        </span>
      </div>

      {/* Middle: Feature Indicators */}
      <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-slate-400" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div className="flex items-center gap-1.5 text-emerald-400" title="Local SQLite & Storage Synchronized">
          <Database className="w-3 h-3" />
          <span>Offline SQLite Active</span>
        </div>

        {onOpenBackupManager && (
          <button
            type="button"
            onClick={onOpenBackupManager}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-400 cursor-pointer transition"
            title="Manage Local Disk Auto-Backups"
          >
            <HardDrive className="w-3 h-3 text-cyan-400" />
            <span>Local Disk Backup</span>
          </button>
        )}

        <div className="flex items-center gap-1 text-slate-400" title="Hardware Thermal POS Printer Ready">
          <Printer className="w-3 h-3 text-amber-400" />
          <span>{printerCount !== null ? `${printerCount} Printers Ready` : 'POS Silent Print Ready'}</span>
        </div>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Fullscreen Kiosk toggle */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="p-1 px-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen" : "POS Kiosk Fullscreen Mode (F11)"}
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>

        {/* Minimize button */}
        <button
          type="button"
          onClick={handleMinimize}
          className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title="Minimize to Taskbar"
        >
          <Minus className="w-3 h-3" />
        </button>

        {/* Maximize / Restore button */}
        <button
          type="button"
          onClick={handleMaximize}
          className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
          title={isMaximized ? "Restore Window" : "Maximize Window"}
        >
          {isMaximized ? <Copy className="w-3 h-3" /> : <Square className="w-3 h-3" />}
        </button>

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="p-1 px-2 text-slate-400 hover:text-white hover:bg-rose-600 rounded transition cursor-pointer"
          title="Close Application"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
