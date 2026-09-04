import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { UserAccount } from '../types';
import { Lock, Eye, EyeOff, ShieldCheck, User, KeyRound } from 'lucide-react';
import { AbooLogo } from './AbooLogo';
import { ChangePasswordModal } from './ChangePasswordModal';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: 'admin' | 'cashier') => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  users?: UserAccount[];
  onUpdateUserPin?: (userId: string, newPin: string, newFullname?: string) => void;
}

export default function LoginScreen({
  onLoginSuccess,
  lang,
  onLanguageChange,
  users = [],
  onUpdateUserPin
}: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setIsSubmitting(true);

    const checkUser = username.trim().toLowerCase();
    const checkPass = password.trim();

    setTimeout(() => {
      let validUsers: UserAccount[] = [];
      if (users && users.length > 0) {
        validUsers = users;
      } else {
        try {
          const saved = localStorage.getItem('hw_users');
          if (saved) {
            validUsers = JSON.parse(saved);
          } else {
            validUsers = [
              { id: 'u-1', username: 'admin', fullname: 'Umar Farooq (Manager)', pin: 'forge123', role: 'admin', createdAt: '2026-05-28T00:00:00Z' },
              { id: 'u-2', username: 'staff', fullname: 'Hamza Yusuf (Cashier)', pin: 'staff123', role: 'cashier', createdAt: '2026-05-28T00:00:00Z' }
            ];
          }
        } catch (err) {
          validUsers = [
            { id: 'u-1', username: 'admin', fullname: 'Umar Farooq (Manager)', pin: 'forge123', role: 'admin', createdAt: '2026-05-28T00:00:00Z' }
          ];
        }
      }

      const matchedUser = validUsers.find(
        (u: any) => u.username.toLowerCase() === checkUser && u.pin === checkPass
      );

      if (matchedUser) {
        onLoginSuccess(matchedUser.fullname, matchedUser.role);
      } else {
        setErrorText(
          lang === 'ur'
            ? 'غلط صارف نام یا پن کوڈ! براہ مہربانی درست معلومات درج کریں۔'
            : 'Incorrect Username or Security PIN!'
        );
      }
      setIsSubmitting(false);
    }, 450);
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 relative overflow-hidden font-sans"
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      {/* Decorative Forge elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Language Bar TOP */}
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center z-10 py-2">
        <div className="flex items-center gap-2">
          <AbooLogo size="xs" />
          <span className="text-xs font-mono tracking-widest text-slate-300 font-bold">
            {t.appName}
          </span>
        </div>
        <button
          onClick={() => onLanguageChange(lang === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-950/40 border border-blue-900/40 hover:bg-blue-900/40 hover:text-white rounded transition cursor-pointer"
        >
          {t.switchLanguage}
        </button>
      </header>

      {/* Main Container Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-7 shadow-2xl backdrop-blur-md relative overflow-hidden">
          
          {/* Subtle industrial trim */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-600 to-indigo-500" />
          
          <div className="text-center mb-6 flex flex-col items-center">
            <AbooLogo size="lg" className="mb-4" />
            <h1 className="text-2xl font-black text-white tracking-tight">{t.loginTitle}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorText && (
              <div className="p-3 bg-red-950/80 border border-red-800/80 text-red-200 text-xs rounded font-medium flex items-center justify-between">
                <span>{errorText}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold text-[11px] block tracking-wide uppercase">
                {t.usernameLabel}
              </label>
              <div className="relative">
                <span className={`absolute ${lang === 'ur' ? 'right-3' : 'left-3'} top-2 px-0.5 text-slate-500`}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePrefilled}
                  className={`w-full ${lang === 'ur' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-xs text-white outline-none transition-all`}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-slate-300 font-bold text-[11px] block tracking-wide uppercase">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <span className={`absolute ${lang === 'ur' ? 'right-3' : 'left-3'} top-2 px-0.5 text-slate-500`}>
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={`w-full ${lang === 'ur' ? 'pr-9 pl-12' : 'pl-9 pr-12'} py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-xs text-white outline-none transition-all`}
                  required
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${lang === 'ur' ? 'left-3' : 'right-3'} top-2.5 text-slate-500 hover:text-slate-300`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit btn */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded font-bold text-xs transition-all shadow-lg hover:shadow-blue-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? "Authenticating..." : t.signInBtn}
            </button>

            {/* Change Password Option */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800/40 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'ur' ? 'پاس ورڈ تبدیل کریں' : 'Change Password'}</span>
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          currentUser={{ username: 'admin', role: 'admin' }}
          users={users.length > 0 ? users : [
            { id: 'u-1', username: 'admin', fullname: 'Umar Farooq (Manager)', pin: 'forge123', role: 'admin', createdAt: '2026-05-28T00:00:00Z' },
            { id: 'u-2', username: 'staff', fullname: 'Hamza Yusuf (Cashier)', pin: 'staff123', role: 'cashier', createdAt: '2026-05-28T00:00:00Z' }
          ]}
          onUpdateUserPin={onUpdateUserPin || ((userId, newPin) => {
            const saved = localStorage.getItem('hw_users');
            let userList = saved ? JSON.parse(saved) : [
              { id: 'u-1', username: 'admin', fullname: 'Umar Farooq (Manager)', pin: 'forge123', role: 'admin', createdAt: '2026-05-28T00:00:00Z' }
            ];
            userList = userList.map((u: any) => u.id === userId || u.username === userId ? { ...u, pin: newPin } : u);
            localStorage.setItem('hw_users', JSON.stringify(userList));
          })}
          lang={lang}
        />
      )}

      {/* Footer copyright */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 z-10">
        <p className="text-[10px] text-slate-500 font-mono tracking-wide">
          Aboo's Software Management System ERP • Secured preview node 3000 • ISO 27001 Cryptographic Core
        </p>
      </footer>
    </div>
  );
}
