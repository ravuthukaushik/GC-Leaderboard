"use client";

// Flat ribbon medals for the top three, matching the supplied reference exactly:
// crossed swallowtail ribbon straps (two flat shades) behind a coin with a
// concentric inner ring and a coloured numeral. Gold/red · silver/blue · bronze/green.
const TIERS = {
  1: { light: "#EA5A4C", dark: "#D8463B", stroke: "#A6301F", discOuter: "#F4B63C", discInner: "#FBD466", ring: "#EBA22F", num: "#E8912E" },
  2: { light: "#5E7CC8", dark: "#4A63A6", stroke: "#33487A", discOuter: "#C4D2E0", discInner: "#E9EFF5", ring: "#B2C2D6", num: "#7B92B4" },
  3: { light: "#35B46B", dark: "#2C9E5D", stroke: "#4A3320", discOuter: "#C0895A", discInner: "#D8A277", ring: "#B27C4E", num: "#9C6A3D" }
};
const LABELS = { 1: "First place", 2: "Second place", 3: "Third place" };

export default function RibbonMedal({ rank, size = 40 }) {
  const t = TIERS[rank] || TIERS[3];

  return (
    <svg
      width={size}
      height={(size * 68) / 60}
      viewBox="0 0 60 68"
      fill="none"
      role="img"
      aria-label={LABELS[rank] || `Rank ${rank}`}
    >
      {/* crossed ribbon straps (drawn behind the coin) */}
      <path
        d="M34 4 L39 10 L44 4 L33 42 L22 42 Z"
        fill={t.dark}
        stroke={t.stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M26 4 L21 10 L16 4 L27 42 L38 42 Z"
        fill={t.light}
        stroke={t.stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* coin */}
      <circle cx="30" cy="47" r="15" fill={t.discOuter} stroke={t.stroke} strokeWidth="2.4" />
      <circle cx="30" cy="47" r="11" fill={t.discInner} />
      <circle cx="30" cy="47" r="8.6" fill="none" stroke={t.ring} strokeWidth="1.3" />

      <text
        x="30"
        y="47.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="14"
        fontWeight="800"
        fill={t.num}
        style={{ fontFamily: "inherit" }}
      >
        {rank}
      </text>
    </svg>
  );
}
