"use client";

// Real medals for the top three — inline SVG (ribbon + struck metal disc + star),
// tuned to muted brass / pewter / copper. No emoji.
const METALS = {
  1: { hi: "#F4DC8A", mid: "#C9A227", lo: "#997B18", ring: "#B8931F", ribbon: "#B8931F" },
  2: { hi: "#EEF1F3", mid: "#9BA6AC", lo: "#71797F", ring: "#8A949A", ribbon: "#8A949A" },
  3: { hi: "#E7B487", mid: "#B0764A", lo: "#8A5A34", ring: "#9A6740", ribbon: "#9A6740" }
};
const LABELS = { 1: "Gold medal", 2: "Silver medal", 3: "Bronze medal" };

const STAR =
  "M24 33 L25.71 37.65 L30.66 37.84 L26.76 40.9 L28.11 45.66 L24 42.9 L19.89 45.66 L21.24 40.9 L17.34 37.84 L22.29 37.65 Z";

export default function PodiumMedal({ rank, size = 54 }) {
  const m = METALS[rank] || METALS[3];
  const id = `gcp-medal-${rank}`;

  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 48 58"
      fill="none"
      role="img"
      aria-label={LABELS[rank] || `Rank ${rank}`}
    >
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor={m.hi} />
          <stop offset="55%" stopColor={m.mid} />
          <stop offset="100%" stopColor={m.lo} />
        </radialGradient>
      </defs>

      {/* Ribbons */}
      <path d="M15 2 L23 2 L27.5 27 L20.5 30 Z" fill={m.ribbon} opacity="0.9" />
      <path d="M33 2 L25 2 L20.5 27 L27.5 30 Z" fill={m.mid} opacity="0.7" />

      {/* Disc */}
      <circle cx="24" cy="40" r="15" fill={`url(#${id})`} stroke={m.ring} strokeWidth="1.4" />
      <circle cx="24" cy="40" r="11.2" fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1" />

      {/* Star */}
      <path d={STAR} fill="rgba(255,255,255,0.9)" />
    </svg>
  );
}
