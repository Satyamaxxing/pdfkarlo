import React from "react";

export const ZeroServerUploadsShieldSvg: React.FC<{ className?: string }> = ({
  className = "w-7 h-7",
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="trustShieldMain" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="trustShieldBevel" x1="7" y1="7" x2="25" y2="25" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" stopOpacity="0.85" />
        <stop offset="1" stopColor="#065F46" stopOpacity="0.25" />
      </linearGradient>
      <filter id="trustShieldGlow" x="-2" y="-2" width="36" height="36" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#059669" floodOpacity="0.25" />
      </filter>
    </defs>
    {/* Outer Shield Shell */}
    <path
      d="M16 3L6 7.5V15.5C6 22.2 10.3 28.2 16 29.8C21.7 28.2 26 22.2 26 15.5V7.5L16 3Z"
      fill="url(#trustShieldMain)"
      filter="url(#trustShieldGlow)"
    />
    {/* Inner Inset Bevel */}
    <path
      d="M16 5.2L8 8.8V15.5C8 20.8 11.4 25.8 16 27.2C20.6 25.8 24 20.8 24 15.5V8.8L16 5.2Z"
      fill="url(#trustShieldBevel)"
    />
    {/* Glossy Top Glass Highlight */}
    <path
      d="M16 6L9 9.2V14C9 16 11 18 16 19C16 19 16 6 16 6Z"
      fill="#ffffff"
      fillOpacity="0.28"
    />
    {/* Precision White Checkmark */}
    <path
      d="M11.5 15.5L14.5 18.5L20.5 12.5"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClientSideWebWorkersChipSvg: React.FC<{ className?: string }> = ({
  className = "w-7 h-7",
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="trustChipBody" x1="16" y1="6" x2="16" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="trustChipCore" x1="16" y1="11" x2="16" y2="21" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#A7F3D0" />
      </linearGradient>
    </defs>
    {/* External Connection Pins */}
    <path
      d="M11 2V6M16 2V6M21 2V6M11 26V30M16 26V30M21 26V30M2 11H6M2 16H6M2 21H6M26 11H30M26 16H30M26 21H30"
      stroke="#059669"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Silicon Die */}
    <rect
      x="6"
      y="6"
      width="20"
      height="20"
      rx="5"
      fill="url(#trustChipBody)"
      stroke="#34D399"
      strokeWidth="1.5"
    />
    {/* Inner Core Processing Unit */}
    <rect x="11" y="11" width="10" height="10" rx="2.5" fill="url(#trustChipCore)" />
    {/* Parallel Multi-Thread Trace */}
    <path d="M16 13V19M13 16H19" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="16" r="1.5" fill="#F97316" />
  </svg>
);

export const ZeroTrackingVaultLockSvg: React.FC<{ className?: string }> = ({
  className = "w-7 h-7",
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="trustLockBody" x1="16" y1="12" x2="16" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="trustLockShackle" x1="16" y1="3" x2="16" y2="13" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34D399" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Hardened Shackle */}
    <path
      d="M10 13V8.5C10 5.2 12.7 2.5 16 2.5C19.3 2.5 22 5.2 22 8.5V13"
      stroke="url(#trustLockShackle)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Vault Body */}
    <rect
      x="6"
      y="12"
      width="20"
      height="16"
      rx="4.5"
      fill="url(#trustLockBody)"
      stroke="#34D399"
      strokeWidth="1.5"
    />
    {/* Gloss Highlight */}
    <path
      d="M7.5 13.5H24.5C25.5 13.5 25.5 15 25.5 16L6.5 16C6.5 15 6.5 13.5 7.5 13.5Z"
      fill="#FFFFFF"
      fillOpacity="0.32"
    />
    {/* Cryptographic Keyhole */}
    <circle cx="16" cy="19" r="2" fill="#FFFFFF" />
    <path d="M16 21V24" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
