import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizeMap = {
    sm: { img: 'h-8 w-8', text: 'text-lg' },
    md: { img: 'h-10 w-10', text: 'text-xl' },
    lg: { img: 'h-16 w-16', text: 'text-3xl' },
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/icon-192x192.png"
        alt="Чебоко"
        className={`${s.img} rounded-lg object-contain`}
      />
      {showText && (
        <span className={`${s.text} font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent`}>
          Чебоко
        </span>
      )}
    </div>
  );
};
