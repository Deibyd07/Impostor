export default function MaskIcon({ size = 72, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.95" />
          <stop offset="1" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path d="M32 6 C 18 6, 8 16, 8 28 C 8 38, 14 48, 22 54 C 26 56, 30 57, 32 57 C 34 57, 38 56, 42 54 C 50 48, 56 38, 56 28 C 56 16, 46 6, 32 6 Z"
            fill="url(#mg)" stroke={color} strokeWidth="1.2" strokeOpacity="0.8" />
      <ellipse cx="22" cy="26" rx="5" ry="3.2" fill="#000" />
      <ellipse cx="42" cy="26" rx="5" ry="3.2" fill="#000" />
      <path d="M22 25.5 C 20 24, 18 23.5, 16 24" stroke="#000" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
      <path d="M42 25.5 C 44 24, 46 23.5, 48 24" stroke="#000" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
      <path d="M32 28 L 30 38 L 34 38 Z" fill="#000" opacity="0.25" />
      <path d="M24 32 L 22 42 L 24.5 41" stroke={color} strokeWidth="1" opacity="0.55" fill="none" strokeLinecap="round" />
    </svg>
  )
}
