import React from 'react';

interface IronVaultLogoProps {
  className?: string;
  size?: number;
}

export const IronVaultLogo: React.FC<IronVaultLogoProps> = ({
  className = 'w-10 h-10',
  size
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      style={style}
    >
      <rect width="100" height="100" rx="24" fill="#06080D" />
      <rect x="2" y="2" width="96" height="96" rx="22" stroke="#1E293B" strokeWidth="2" />
      <path
        d="M50 16L78 28V52C78 68.5 66 81.5 50 86C34 81.5 22 68.5 22 52V28L50 16Z"
        fill="#0B0F19"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M42 38H58M50 38V64M44 64H56"
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="51" r="3" fill="#34D399" />
      <path
        d="M34 26L38 28M66 26L62 28"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
