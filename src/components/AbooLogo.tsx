import React from 'react';

interface AbooLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
  variant?: 'color' | 'mono' | 'receipt';
  className?: string;
  subtext?: string;
}

export const AbooLogo: React.FC<AbooLogoProps> = ({
  size = 'md',
  showText = false,
  textPosition = 'right',
  variant = 'color',
  className = '',
  subtext = 'Software Management System'
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6', img: 'w-6 h-6', font: 'text-xs', sub: 'text-[8px]' },
    sm: { box: 'w-9 h-9', img: 'w-9 h-9', font: 'text-sm', sub: 'text-[9px]' },
    md: { box: 'w-11 h-11', img: 'w-11 h-11', font: 'text-base', sub: 'text-[10px]' },
    lg: { box: 'w-16 h-16', img: 'w-16 h-16', font: 'text-xl', sub: 'text-xs' },
    xl: { box: 'w-24 h-24', img: 'w-24 h-24', font: 'text-2xl', sub: 'text-sm' },
  };

  const { box, img, font, sub } = sizeMap[size];

  // In receipt mode, provide high-contrast monochrome design suitable for thermal printing
  if (variant === 'receipt') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="w-12 h-12 rounded-lg border-2 border-slate-900 flex items-center justify-center p-1 bg-white mb-1">
          <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none" stroke="currentColor">
            <polygon points="50,15 85,75 70,75 58,55 42,55 30,75 15,75" fill="#000000" stroke="#000000" strokeWidth="2" />
            <polygon points="50,30 58,45 42,45" fill="#FFFFFF" />
            <circle cx="50" cy="40" r="3" fill="#000000" />
            <line x1="28" y1="62" x2="72" y2="62" stroke="#FFFFFF" strokeWidth="2" />
          </svg>
        </div>
        <div className="text-center">
          <span className="font-black tracking-wider text-xs uppercase block text-slate-900 font-sans">
            Aboo's
          </span>
          <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest block">
            Software Management System
          </span>
        </div>
      </div>
    );
  }

  const isVertical = textPosition === 'bottom';

  return (
    <div className={`flex ${isVertical ? 'flex-col items-center text-center gap-2' : 'items-center gap-3'} ${className}`}>
      {/* Emblem / Logo Container */}
      <div className={`${box} relative rounded-xl overflow-hidden shadow-md shrink-0 bg-slate-900 border border-slate-700/60 p-0.5 flex items-center justify-center group`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-indigo-600/20 opacity-80" />

        {/* Real Logo Image with Instant Fallback */}
        <img
          src="/logo.png"
          alt="Aboo's Logo"
          className={`${img} object-contain rounded-lg relative z-10`}
          onError={(e) => {
            // Fallback to SVG asset or vector mark if image fails
            const target = e.currentTarget;
            if (target.src.endsWith('/logo.png')) {
              target.src = '/logo.svg';
            } else {
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.vector-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }
          }}
        />

        {/* Vector SVG Fallback */}
        <div className="vector-fallback hidden w-full h-full flex items-center justify-center relative z-10 p-1">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            <polygon points="50,15 85,75 70,75 58,55 42,55 30,75 15,75" fill="url(#logoGrad)" />
            <polygon points="50,30 58,45 42,45" fill="#FFFFFF" />
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#0066FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Name Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1">
            <span className={`${font} font-black tracking-tight text-white flex items-center`}>
              Aboo<span className="text-cyan-400">'s</span>
            </span>
          </div>
          {subtext && (
            <span className={`${sub} text-slate-400 font-medium tracking-wide uppercase`}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
