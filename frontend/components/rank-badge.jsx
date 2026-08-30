"use client";

import RibbonMedal from "@/components/ribbon-medal";

// Top three get the flat ribbon medals; everyone else keeps a plain numbered pill.
export default function RankBadge({ rank }) {
  if (rank <= 3) {
    return (
      <div className="rank-medal">
        <RibbonMedal rank={rank} size={40} />
      </div>
    );
  }
  return <div className="rank-pill rank-pill-default">{rank}</div>;
}
