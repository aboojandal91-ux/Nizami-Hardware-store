import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Language } from '../translations';
import { KeyRound, ShieldCheck, Eye, EyeOff, X, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string; role: 'admin' | 'cashier' };
  users: UserAccount[];
  onUpdateUserPin: (userId: string, newPin: string, newFullname?: string) => void;
  lang: Language;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onUpdateUserPin,
  lang,
}) => {
  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';
  const [targetUsername, setTargetUsername] = useState(currentUser.username);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const targetAccount = users.find(u => u.username === targetUsername) || users.find(u => u.role === 'admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!targetAccount) {
      setErrorMsg(lang === 'ur' ? 'صارف اکاؤنٹ نہیں ملا!' : 'User account not found!');
      return;
    }

    // Verify current PIN (unless an admin is resetting another staff member's forgotten PIN)
    const isSelfChange = targetAccount.username === currentUser.username;
    if (isSelfChange && targetAccount.pin && targetAccount.pin !== currentPin.trim()) {
      setErrorMsg(lang === 'ur' ? 'موجودہ پاس ورڈ / پن درست نہیں ہے!' : 'Current password/PIN is incorrect!');
      return;
    }

    if (newPin.trim().length < 4) {
      setErrorMsg(lang === 'ur' ? 'نیا پاس ورڈ کم از کم 4 ہندسوں یا حروف پر مشتمل ہونا چاہیے!' : 'New password must be at least 4 characters long!');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg(lang === 'ur' ? 'نیا پاس ورڈ اور تصدیق آپس میں مطابقت نہیں رکھتے!' : 'New password and confirmation do not match!');
      return;
    }

    // Perform update
    onUpdateUserPin(targetAccount.id, newPin.trim());

    setSuccessMsg(
      lang === 'ur'
        ? `اکاؤنٹ @${targetAccount.username} کا پاس ورڈ کامیابی سے تبدیل کر دیا گیا ہے! نیا پاس ورڈ: ${newPin.trim()}`
        : `Password for @${targetAccount.username} updated successfully! New password: ${newPin.trim()}`
    );

    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');

    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
        dir={lang === 'ur' ? 'rtl' : 'ltr'}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {lang === 'ur' ? 'پاس ورڈ اور سیکیورٹی پن تبدیل کریں' : 'Change Security Password / PIN'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ur' ? 'ایڈمن یا کیشئیر کا لاگ ان پاس ورڈ اپڈیٹ کریں' : 'Update admin credentials for secure access'}
            </p>
          </div>
        </div>

        {/* Success or Error alert banner */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* If Admin, can choose which account to change */}
          {isAdmin && users.length > 1 && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                {lang === 'ur' ? 'صارف اکاؤنٹ منتخب کریں' : 'Target Account'}
              </label>
              <select
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.username}>
                    @{u.username} ({u.fullname}) - {u.role === 'admin' ? 'Manager/Admin' : 'Cashier'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current PIN (required when changing own password) */}
          {(targetUsername === currentUser.username || !isAdmin) && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                {lang === 'ur' ? 'موجودہ پاس ورڈ / پن' : 'Current Password / PIN'}
              </label>
              <div className="relative">
                <input
                  type={showPins ? "text" : "password"}
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder={lang === 'ur' ? 'موجودہ پاس ورڈ درج کریں' : 'Enter current password'}
                  className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                  required
                />
              </div>
            </div>
          )}

          {/* New PIN */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              {lang === 'ur' ? 'نیا پاس ورڈ / پن' : 'New Password / PIN'}
            </label>
            <div className="relative">
              <input
                type={showPins ? "text" : "password"}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder={lang === 'ur' ? 'نیا پاس ورڈ درج کریں (کم از کم 4 ہندسے)' : 'Enter new password (min 4 characters)'}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Confirm New PIN */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              {lang === 'ur' ? 'نئے پاس ورڈ کی تصدیق کریں' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <input
                type={showPins ? "text" : "password"}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder={lang === 'ur' ? 'دوبارہ نیا پاس ورڈ درج کریں' : 'Retype new password'}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Show/hide passwords toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{showPins ? (lang === 'ur' ? 'پاس ورڈ چھپائیں' : 'Hide passwords') : (lang === 'ur' ? 'پاس ورڈ دیکھیں' : 'Show passwords')}</span>
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              Account: @{targetAccount?.username}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-950 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ur' ? 'پاس ورڈ محفوظ کریں' : 'Save New Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
