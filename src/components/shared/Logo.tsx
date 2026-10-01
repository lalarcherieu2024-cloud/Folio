"use client";

// Folio animated logo mark (from the design handoff). Pure SVG + SMIL.
// Animation is switched off for visitors who prefer reduced motion, or with animated={false}.
import { useSyncExternalStore } from "react";

type Props = { size?: number; animated?: boolean; className?: string };

const BLUE = "#2f5bd3", NAVY = "#1b2f86", HALO = "#d9e3fb", INK = "#1c1b1f";
const CYCLE = 2.8;
const NODES = [
  { trace: "M32 17 H36 L40 13.5", cx: 42.2, cy: 12.4, d: 0 },
  { trace: "M32 24 H43", cx: 45.4, cy: 24, d: 0.35 },
  { trace: "M32 31 H36 L40 34.5", cx: 42.2, cy: 35.6, d: 0.7 },
];

function A({ on, attr, values, dur, begin = 0, keyTimes }: { on: boolean; attr: string; values: string; dur: number; begin?: number; keyTimes?: string }) {
  if (!on) return null;
  return <animate attributeName={attr} values={values} dur={`${dur}s`} begin={`${begin}s`} keyTimes={keyTimes} repeatCount="indefinite" />;
}

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => { const m = window.matchMedia(query); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

export function Logo({ size = 44, animated = true, className }: Props) {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
  const on = animated && !reduced;
  const ink = { fill: "none", stroke: NAVY, strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Folio" className={className} style={{ display: "block", overflow: "visible" }}>
      <circle cx={32} cy={25} r={23} fill={HALO}>
        <A on={on} attr="r" values="22;24;22" dur={3.6} />
        <A on={on} attr="opacity" values=".75;1;.75" dur={3.6} />
      </circle>
      <path {...ink} fill="#fff" d="M24 43 C24 37.5 14 34 14 24.5 A18 18 0 0 1 50 24.5 C50 34 40 37.5 40 43 Z" />
      <path {...ink} d="M32 7 V43" />
      <path {...ink} strokeWidth={2.2} d="M30 13.5 C26.5 11.5 21 13 20.5 17.5 C17 18.5 16.5 24 19.5 25.5 C17.5 29 21 33.5 25 32.5 C26 35.5 29 36 30 35" />
      <path {...ink} strokeWidth={2} d="M24.5 17.5 C26.5 18.5 27.5 20.5 26.5 23 M21.5 25 C23.5 24.5 26 26 25.5 28.5 M28.5 27 C29.5 28.5 29.5 30.5 28.5 31.5" />
      {NODES.map((n, i) => (
        <g key={i}>
          <path d={n.trace} fill="none" stroke={BLUE} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={14} strokeDashoffset={0}>
            <A on={on} attr="stroke-dashoffset" values="14;0;0;0" dur={CYCLE} begin={n.d} keyTimes="0;.25;.85;1" />
          </path>
          <circle cx={n.cx} cy={n.cy} r={2.8} fill="none" stroke={BLUE} strokeWidth={1.4} opacity={0}>
            <A on={on} attr="r" values="2.8;2.8;7;7" dur={CYCLE} begin={n.d} keyTimes="0;.25;.6;1" />
            <A on={on} attr="opacity" values="0;.7;0;0" dur={CYCLE} begin={n.d} keyTimes="0;.25;.6;1" />
          </circle>
          <circle cx={n.cx} cy={n.cy} r={2.8} fill={BLUE} stroke="#fff" strokeWidth={0.8}>
            <A on={on} attr="r" values="1.6;3.2;2.8;2.8" dur={CYCLE} begin={n.d} keyTimes="0;.3;.42;1" />
          </circle>
        </g>
      ))}
      <path d="M21.5 47.5 H42.5 M24 52 H40 M28 56.5 H36" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}
