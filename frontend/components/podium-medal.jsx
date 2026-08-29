"use client";

/* Bespoke tier mark for the Green Cup — a single leaf "crest", not a medal.
   Deliberately NOT the shiny gradient-disc-on-ribbon look (the classic leaderboard
   AI-slop tell), and no emoji. One geometric single-weight outline in the lucide
   house style, recolored per tier with the site's muted metal tokens. Tier reads
   from colour + podium position + the plinth numeral, so the mark stays clean and
   doesn't repeat the rank as a number. Faint tint fill, no gloss, no ribbon. */

const METALS = {
  1: { stroke: "#B8904A", tint: "rgba(184, 144, 74, 0.12)" }, // muted gold
  2: { stroke: "#A9ADB3", tint: "rgba(169, 173, 179, 0.14)" }, // muted silver
  3: { stroke: "#B37A54", tint: "rgba(179, 122, 84, 0.12)" } // muted bronze
};
const LABELS = { 1: "First place", 2: "Second place", 3: "Third place" };

export default function PodiumMedal({ rank, size = 54 }) {
  const m = METALS[rank] || METALS[3];

  return (
    <svg
      width={size}
      height={size * 1.16}
      viewBox="0 0 48 56"
      fill="none"
      role="img"
      aria-label={LABELS[rank] || `Rank ${rank}`}
      stroke={m.stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* leaf body */}
      <path
        d="M24 5 C 33 13, 39 20, 39 31 C 39 41, 32 49, 24 51 C 16 49, 9 41, 9 31 C 9 20, 15 13, 24 5 Z"
        fill={m.tint}
        strokeWidth="2.2"
      />
      {/* stem */}
      <path d="M24 51 L24 54.5" strokeWidth="2.2" />
      {/* midrib */}
      <path d="M24 11 L24 46" strokeWidth="1.7" opacity="0.85" />
      {/* veins */}
      <g strokeWidth="1.4" opacity="0.7">
        <path d="M24 21 C 28 20, 31 22, 33 26" />
        <path d="M24 21 C 20 20, 17 22, 15 26" />
        <path d="M24 31 C 29 30, 32 32, 34 36" />
        <path d="M24 31 C 19 30, 16 32, 14 36" />
      </g>
    </svg>
  );
}
