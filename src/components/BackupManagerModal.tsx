import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Save, RefreshCw, Copy, Move, CheckCircle2 } from 'lucide-react';
import { StoreSettings, Product, Customer, Supplier, PurchaseOrder, SaleRecord, Expense, UserAccount, AuditLog } from '../types';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ur';
  storeSettings: StoreSettings;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  sales: SaleRecord[];
  expenses: Expense[];
  users: UserAccount[];
  auditLogs: AuditLog[];
  onRestoreFromPath: (filePath: string) => void;
}

export default function BackupManagerModal({
  isOpen, onClose, lang, storeSettings, products, customers, suppliers,
  purchaseOrders, sales, expenses, users, auditLogs, onRestoreFromPath
}: BackupManagerModalProps) {
  const [primaryPath, setPrimaryPath] = useState(localStorage.getItem('hw_auto_backup_path') || '');
  const [secondaryPath, setSecondaryPath] = useState(localStorage.getItem('hw_secondary_backup_path') || '');
  const [customFileName, setCustomFileName] = useState(`NIZAMIHP_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}`);
  const [pastBackups, setPastBackups] = useState<string[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Check if running in Electron
  const isElectron = !!(window as any).require;
  const fs = isElectron ? (window as any).require('fs') : null;
  const pathModule = isElectron ? (window as any).require('path') : null;
  const { ipcRenderer } = isElectron ? (window as any).require('electron') : { ipcRenderer: null };

  const getBackupData = () => ({
    appSign: "nizami-hardware-pos-ledger",
    timestamp: new Date().toISOString(),
    storeSettings, products, customers, suppliers, purchaseOrders, sales, expenses, users, auditLogs
  });

  const loadPastBackups = () => {
    if (!fs || !pathModule || !primaryPath) return;
    try {
      if (fs.existsSync(primaryPath)) {
        const files = fs.readdirSync(primaryPath);
        const backups = files.filter((f: string) => f.includes('NIZAMIHP') && f.endsWith('.json'))
          .sort((a: string, b: string) => {
            const timeA = fs.statSync(pathModule.join(primaryPath, a)).mtimeMs;
            const timeB = fs.statSync(pathModule.join(primaryPath, b)).mtimeMs;
            return timeB - timeA;
          });
        setPastBackups(backups);
      }
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && primaryPath) {
      loadPastBackups();
    }
  }, [isOpen, primaryPath]);

  const handleSavePrimaryPath = () => {
    localStorage.setItem('hw_auto_backup_path', primaryPath);
    alert(lang === 'ur' ? 'پرائمری پاتھ محفوظ ہوگیا' : 'Primary path saved successfully');
    loadPastBackups();
  };

  const handleSaveSecondaryPath = () => {
    localStorage.setItem('hw_secondary_backup_path', secondaryPath);
    alert(lang === 'ur' ? 'سیکنڈری پاتھ محفوظ ہوگیا' : 'Secondary path saved successfully');
  };

  const handleCreateManualBackup = () => {
    if (!primaryPath && isElectron) {
      alert(lang === 'ur' ? 'پہلے پرائمری پاتھ منتخب کریں' : 'Please define primary backup path first');
      return;
    }
    try {
      const finalName = customFileName.endsWith('.json') ? customFileName : customFileName + '.json';
      
      if (isElectron) {
        if (!fs.existsSync(primaryPath)) {
          fs.mkdirSync(primaryPath, { recursive: true });
        }
        const fullPath = pathModule.join(primaryPath, finalName);
        
        fs.writeFileSync(fullPath, JSON.stringify(getBackupData(), null, 2), 'utf8');
        
        // Also write to secondary
        if (secondaryPath) {
          if (!fs.existsSync(secondaryPath)) fs.mkdirSync(secondaryPath, { recursive: true });
          const seqPath = pathModule.join(secondaryPath, finalName);
          fs.writeFileSync(seqPath, JSON.stringify(getBackupData(), null, 2), 'utf8');
        }

        alert(lang === 'ur' ? 'بیک اپ کامیابی سے بن گیا' : 'Backup created successfully');
        loadPastBackups();
      } else {
        // Browser fallback (download)
        const jsonStr = JSON.stringify(getBackupData(), null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = finalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert(lang === 'ur' ? 'بیک اپ براؤزر سے ڈاؤن لوڈ ہو گیا ہے' : 'Backup downloaded via browser');
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleRestore = () => {
    if (!selectedBackup || !primaryPath) return;
    const fullPath = pathModule.join(primaryPath, selectedBackup);
    if (!window.confirm("Are you sure you want to restore from " + selectedBackup + "?")) return;
    onRestoreFromPath(fullPath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-sm">
      <div className="bg-slate-50 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-emerald-800">
              {lang === 'ur' ? 'ڈیٹا بیس بیک اپس' : 'Database Backups'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium text-sm transition">
            Close
          </button>
        </div>

        <div className="p-6 overflow-y-auto w-full space-y-6">
          {!isElectron && (
            <div className="p-4 bg-amber-50 text-amber-800 border-l-4 border-amber-500 rounded text-sm mb-4">
              Local Auto-Backup features require the Desktop App (Electron) to access local folders securely.
            </div>
          )}

          {/* Top Controls */}
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <label className="w-40 text-sm font-semibold text-slate-700 text-right">File Name</label>
              <input 
                value={customFileName} 
                onChange={(e) => setCustomFileName(e.target.value)}
                className="flex-1 border-slate-300 rounded px-3 py-1.5 text-sm"
              />
              <button 
                onClick={handleCreateManualBackup}
                className="w-32 bg-slate-100 border border-slate-300 hover:bg-slate-200 px-3 py-1.5 rounded text-sm font-semibold text-slate-700"
              >
                Create Backup
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-40 text-sm font-semibold text-slate-700 text-right">Primary backup path</label>
              <input 
                value={primaryPath} 
                onChange={(e) => setPrimaryPath(e.target.value)}
                placeholder="e.g. D:\Backups"
                className="flex-1 border-slate-300 rounded px-3 py-1.5 text-sm"
              />
              <button 
                onClick={handleSavePrimaryPath}
                className="w-32 bg-slate-100 border border-slate-300 hover:bg-slate-200 px-3 py-1.5 rounded text-sm font-semibold text-slate-700"
              >
                Save
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="w-40 text-sm font-semibold text-slate-700 text-right">Secondary backup path</label>
              <input 
                value={secondaryPath} 
                onChange={(e) => setSecondaryPath(e.target.value)}
                className="flex-1 border-slate-300 rounded px-3 py-1.5 text-sm"
              />
              <button 
                onClick={handleSaveSecondaryPath}
                className="w-32 bg-slate-100 border border-slate-300 hover:bg-slate-200 px-3 py-1.5 rounded text-sm font-semibold text-slate-700"
              >
                Save
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <button onClick={handleRestore} disabled={!selectedBackup} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded font-semibold text-sm disabled:opacity-50 transition">
              Restore Database
            </button>
            <button className="bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 px-4 py-2 rounded text-sm font-medium">New Location</button>
            <button className="bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 px-4 py-2 rounded text-sm font-medium">Move Backup</button>
            <button className="bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 px-4 py-2 rounded text-sm font-medium">Copy</button>
            <button className="bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 px-4 py-2 rounded text-sm font-medium">Open</button>
          </div>

          <div className="border border-slate-300 rounded bg-white w-full h-[300px] overflow-y-auto">
            {pastBackups.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No backups found in primary directory.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pastBackups.map(bk => (
                  <li key={bk} className={`p-2 flex items-center gap-3 w-full hover:bg-slate-50 transition ${selectedBackup === bk ? 'bg-blue-50' : ''}`}>
                    <input 
                      type="radio" 
                      name="backupSelect" 
                      checked={selectedBackup === bk}
                      onChange={() => setSelectedBackup(bk)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <div className="text-sm font-mono text-slate-700 cursor-pointer w-full text-left" onClick={() => setSelectedBackup(bk)}>
                      {primaryPath && primaryPath.endsWith('\\') ? primaryPath : primaryPath + '\\'}{bk}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-blue-600 font-semibold px-2">
            <button className="hover:underline">Sql Query</button>
            <button className="hover:underline">Database Operations</button>
          </div>

        </div>
      </div>
    </div>
  );
}

function DatabaseIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
      <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
      <path d="M3 12A9 3 0 0 0 21 12"></path>
    </svg>
  );
}
