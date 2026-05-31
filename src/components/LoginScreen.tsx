import React, { useState } from 'react';
import { translations, Language } from '../translations';
import { Lock, Hammer, Eye, EyeOff, ShieldCheck, User, Sparkles } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: 'admin' | 'cashier') => void;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LoginScreen({ onLoginSuccess, lang, onLanguageChange }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setIsSubmitting(true);

    const checkUser = username.trim().toLowerCase();
    const checkPass = password.trim();

    setTimeout(() => {
      let validUsers = [];
      try {
        const saved = localStorage.getItem('hw_users');
        if (saved) {
          validUsers = JSON.parse(saved);
        } else {
          validUsers = [
            { username: 'admin', fullname: 'Umar Farooq (Manager)', pin: 'forge123', role: 'admin' },
            { username: 'staff', fullname: 'Hamza Yusuf (Cashier)', pin: 'staff123', role: 'cashier' }
          ];
        }
      } catch (err) {
        validUsers = [
          { username: 'admin', fullname: 'Umar Farooq (Manager)', pin: 'forge123', role: 'admin' }
        ];
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

  const handleShortcutLogin = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setErrorText('');
  };

  return (
    <div 
      className="min-h-screen bg-slate-950 flex flex-col justify-between p-4 relative overflow-hidden font-sans"
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
    >
      {/* Decorative Forge elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/30 rounded-full border border-slate-800/40 pointer-events-none" />

      {/* Language Bar TOP */}
      <header className="max-w-4xl mx-auto w-full flex justify-between items-center z-10 py-2">
        <div className="flex items-center gap-1.5">
          <Hammer className="w-5 h-5 text-blue-500 animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-slate-400 font-bold">
            {t.appName}
          </span>
        </div>
        
        <button
          onClick={() => onLanguageChange(lang === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-2 px-3  py-1.5 text-xs font-bold text-blue-400 bg-blue-950/40 border border-blue-900/40 hover:bg-blue-900/40 hover:text-white rounded transition cursor-pointer"
        >
          {t.switchLanguage}
        </button>
      </header>

      {/* Main Container Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
          
          {/* Subtle industrial trim */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-amber-500" />
          
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-blue-950/80 border border-blue-900/40 rounded-lg text-blue-400 mb-3 shadow-inner">
              <Hammer className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{t.loginTitle}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{t.loginSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorText && (
              <div className="p-3 bg-red-950/45 border border-red-900/30 rounded text-red-400 text-xs font-medium text-center animate-shake leading-snug">
                {errorText}
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
          </form>

          {/* Quick Access Credentials drawer */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t.demoCredsHint}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleShortcutLogin('admin', 'forge123')}
                className="p-2 bg-slate-950 border border-slate-850 hover:border-blue-900/50 hover:bg-slate-900/60 transition text-left rounded text-[10px] text-slate-300 group"
              >
                <span className="block font-bold text-blue-400 group-hover:text-blue-300">Manager Profile</span>
                <span className="font-mono text-[9px] text-slate-500 block">admin / forge123</span>
              </button>
              
              <button
                onClick={() => handleShortcutLogin('staff', 'staff123')}
                className="p-2 bg-slate-950 border border-slate-850 hover:border-blue-900/50 hover:bg-slate-900/60 transition text-left rounded text-[10px] text-slate-300 group"
              >
                <span className="block font-bold text-teal-400 group-hover:text-teal-300">Staff Cashier</span>
                <span className="font-mono text-[9px] text-slate-500 block">staff / staff123</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer copyright */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 z-10">
        <p className="text-[10px] text-slate-600 font-mono tracking-wide">
          Nizami Hardware store ERP • Secured preview node 3000 • ISO 27001 Cryptographic Core
        </p>
      </footer>
    </div>
  );
}
