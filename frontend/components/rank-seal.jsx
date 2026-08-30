"use client";

/* Custom podium rank emblem - a struck "coin": tier gradient ring, a milled
   (dashed) inner edge, the rank numeral, and a small cup-arc underline that nods
   to the Green Cup. Deliberately not a leaf and not a stock medal. */
const TIERS = {
  1: { light: "#E9CF92", mid: "#C29A45", dark: "#8A6A2E", ink: "#7C5D22", tint: "#FBF4E3" },
  2: { light: "#DFE3E8", mid: "#A9AEB5", dark: "#767C84", ink: "#6B7178", tint: "#F4F6F8" },
  3: { light: "#E6B693", mid: "#BE8154", dark: "#8A5A38", ink: "#82502F", tint: "#FAEEE3" }
};
const LABELS = { 1: "First place", 2: "Second place", 3: "Third place" };

export default function RankSeal({ rank, size = 72 }) {
  const t = TIERS[rank] || TIERS[3];
  const gid = `seal-ring-${rank}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 76 76"
      fill="none"
      role="img"
      aria-label={LABELS[rank] || `Rank ${rank}`}
    >
      <defs>
        <linearGradient id={gid} x1="14" y1="8" x2="62" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={t.light} />
          <stop offset="52%" stopColor={t.mid} />
          <stop offset="100%" stopColor={t.dark} />
        </linearGradient>
      </defs>

      {/* struck coin face */}
      <circle cx="38" cy="38" r="35" fill={t.tint} />
      <circle cx="38" cy="38" r="35" fill="none" stroke={`url(#${gid})`} strokeWidth="3.5" />
      {/* milled edge */}
      <circle cx="38" cy="38" r="29" fill="none" stroke={t.mid} strokeWidth="1.3" strokeDasharray="1.3 4" opacity="0.5" />

      {/* rank numeral */}
      <text
        x="38"
        y="35"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="27"
        fontWeight="800"
        fill={t.ink}
        style={{ fontFamily: "inherit" }}
      >
        {rank}
      </text>

      {/* cup-arc underline */}
      <path d="M27 51 Q38 60 49 51" fill="none" stroke={t.mid} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
