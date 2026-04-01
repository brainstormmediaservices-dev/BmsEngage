import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Much larger sizes — logo image often has internal padding so we go big
const SIZE_MAP = {
  sm: 'h-28 w-28',   // navbar, sidebar collapsed
  md: 'h-36 w-36',   // sidebar expanded, auth pages
  lg: 'h-40 w-40',   // landing page hero, footer
};

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => (
  <img
    src="/logo.png"
    alt="BMS Engage"
    className={`${SIZE_MAP[size]} object-contain ${className}`}
    draggable={false}
  />
);
