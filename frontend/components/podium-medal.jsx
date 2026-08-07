"use client";

// Real, glossy medals for the top three (rendered as system emoji).
const MEDALS = { 1: "🥇", 2: "🥈", 3: "🥉" };
const LABELS = { 1: "Gold medal", 2: "Silver medal", 3: "Bronze medal" };

export default function PodiumMedal({ rank, size = 52 }) {
  return (
    <span
      className="podium-medal-emoji"
      style={{ fontSize: `${size}px` }}
      role="img"
      aria-label={LABELS[rank] || `Rank ${rank}`}
    >
      {MEDALS[rank] || "🎖️"}
    </span>
  );
}
