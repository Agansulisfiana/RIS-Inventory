import React from 'react';
import risLogoImage from '../../image/logo-ris.png';

interface RisLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

export const RisLogo: React.FC<RisLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  textSize = 'md',
  theme = 'light'
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Gambar Asli Logo RIS dari src/image/logo-ris - Selalu proporsional dan tidak merubah bentuk */}
      <img
        src={risLogoImage}
        alt="Logo PT. Reycom Integrated Solusi"
        referrerPolicy="no-referrer"
        style={{ height: dimension, width: 'auto', maxHeight: dimension }}
        className="object-contain shrink-0 select-none transition-transform hover:scale-105 drop-shadow-xs"
      />

      {showText && (
        <div className="leading-tight">
          <div className={`font-black font-heading tracking-tight ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          } ${
            textSize === 'lg' ? 'text-lg' : textSize === 'sm' ? 'text-xs' : 'text-sm'
          }`}>
            RIS Inventory
          </div>
          <div className="text-[9px] font-bold text-blue-600 tracking-wider uppercase">
            Produk & Demo Unit
          </div>
        </div>
      )}
    </div>
  );
};

