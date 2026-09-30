'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'badge' | 'stacked';
  className?: string;
  showSlogan?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showSlogan = true,
}) => {
  const sizeMap = {
    sm: {
      box: 'w-10 h-10',
      text: 'text-sm sm:text-base',
      sub: 'text-[9px]',
      slogan: 'text-[8px] tracking-[0.25em]',
    },
    md: {
      box: 'w-12 h-12 sm:w-14 sm:h-14',
      text: 'text-base sm:text-lg',
      sub: 'text-[10px] sm:text-xs',
      slogan: 'text-[9px] sm:text-[10px] tracking-[0.3em]',
    },
    lg: {
      box: 'w-16 h-16 sm:w-20 sm:h-20',
      text: 'text-xl sm:text-2xl',
      sub: 'text-xs sm:text-sm',
      slogan: 'text-[11px] sm:text-xs tracking-[0.35em]',
    },
    xl: {
      box: 'w-24 h-24 sm:w-32 sm:h-32',
      text: 'text-2xl sm:text-3xl',
      sub: 'text-sm sm:text-base',
      slogan: 'text-xs sm:text-sm tracking-[0.4em]',
    },
  };

  const s = sizeMap[size];

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center select-none group ${className}`}>
        {/* Real Royal Velvet Gold Insignia Emblem */}
        <div
          className={`${s.box} rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] shadow-2xl shadow-[#C5A059]/30 group-hover:scale-105 transition-transform flex-shrink-0 relative overflow-hidden ring-2 ring-[#C5A059]/40`}
        >
          <img
            src="/brand-logo.jpg"
            alt="KHADIJAH-TUL-QUBRAH by Meer&Mus Logo"
            className="w-full h-full object-cover rounded-full group-hover:rotate-3 transition-transform duration-700"
          />
        </div>

        <div className="mt-3">
          <h2 className={`${s.text} font-serif font-black tracking-widest text-[#FCFBF7] leading-none uppercase`}>
            KHADIJAH-TUL-<span className="text-[#C5A059]">QUBRAH</span>
          </h2>
          <span className={`${s.sub} block text-[#C5A059] font-medium tracking-[0.25em] uppercase mt-1 font-serif`}>
            by Meer&amp;Mus
          </span>
          {showSlogan && (
            <span className={`${s.slogan} block text-[#dfbc7a] font-bold uppercase mt-1.5 font-mono`}>
              STAY HONEST , STAND LONG
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3.5 group select-none ${className}`}>
      {/* Real Royal Velvet Gold Insignia Emblem */}
      <div
        className={`${s.box} rounded-full p-0.5 bg-gradient-to-tr from-[#C5A059] via-[#F3E5AB] to-[#99752D] shadow-xl shadow-[#C5A059]/25 group-hover:scale-105 transition-transform flex-shrink-0 relative overflow-hidden ring-1 ring-[#C5A059]/50`}
      >
        <img
          src="/brand-logo.jpg"
          alt="KHADIJAH-TUL-QUBRAH by Meer&Mus"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {variant === 'full' && (
        <div className="text-left">
          <span className={`${s.text} font-serif font-black tracking-wider text-[#FCFBF7] flex items-center gap-1.5 leading-none uppercase`}>
            KHADIJAH-TUL-<span className="text-[#C5A059]">QUBRAH</span>
          </span>
          <span className={`${s.sub} block text-[#C5A059] font-serif font-bold tracking-[0.2em] uppercase mt-1`}>
            by Meer&amp;Mus
          </span>
          {showSlogan && (
            <span className={`${s.slogan} block text-[#dfbc7a]/90 font-mono font-bold uppercase mt-0.5 text-[8px] sm:text-[9px]`}>
              STAY HONEST , STAND LONG
            </span>
          )}
        </div>
      )}
    </div>
  );
};
