"use client";

// Top three get medal-tinted pills so the table stays consistent with the podium.
const MEDAL_CLASS = { 1: "rank-pill-gold", 2: "rank-pill-silver", 3: "rank-pill-bronze" };

export default function RankBadge({ rank }) {
  const medal = MEDAL_CLASS[rank] || "rank-pill-default";
  return <div className={`rank-pill ${medal}`}>{rank}</div>;
}
