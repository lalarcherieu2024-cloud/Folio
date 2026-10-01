// Folio mark: a lightbulb, half brain, half circuit. Redrawn as SVG from the approved logo image.
export function LogoMark({ size = 58 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="30 20 160 190" aria-hidden fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="110" cy="92" r="70" fill="#dcdfea" />
      <path d="M82 152C82 136 54 124 54 90a56 56 0 0 1 112 0c0 34-28 46-28 62Z" fill="#f6f2ea" stroke="#1c1b1f" strokeWidth="5" />
      <path d="M110 38v114" stroke="#1c1b1f" strokeWidth="4" />
      <path d="M110 50C98 38 78 44 78 58 66 60 60 76 70 84c-8 10-2 24 10 26 2 12 20 16 30 8" stroke="#1c1b1f" strokeWidth="4" />
      <path d="M80 76c10-6 18 4 10 12M82 98c10-4 18 2 22 8M96 58c4 6 8 8 14 6" stroke="#1c1b1f" strokeWidth="3.5" />
      <g stroke="#2f5bd3" strokeWidth="3.5">
        <path d="M110 68h16l10-14M110 90h34M110 112h16l10 12" />
      </g>
      <g fill="#2f5bd3" stroke="#1c1b1f" strokeWidth="3">
        <circle className="logo-node" cx="138" cy="52" r="7" /><circle className="logo-node" cx="148" cy="90" r="7" /><circle className="logo-node" cx="138" cy="126" r="7" />
      </g>
      <g fill="#1c1b1f"><rect x="80" y="160" width="60" height="8" rx="4" /><rect x="84" y="173" width="52" height="8" rx="4" /><rect x="90" y="186" width="40" height="8" rx="4" /><rect x="98" y="198" width="24" height="8" rx="4" /></g>
    </svg>
  );
}

export function Logo({ size = 58, text = "text-[2.1rem]" }: { size?: number; text?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className={`font-serif font-bold leading-none tracking-tight ${text}`}>Folio</span>
    </span>
  );
}
