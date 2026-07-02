"use client";

import { motion } from "framer-motion";

function getRankIcon(rank) {
  if (rank === 1) return "/medals/gold.svg";
  if (rank === 2) return "/medals/silver.svg";
  if (rank === 3) return "/medals/bronze.svg";
  return null;
}

export default function RankBadge({ rank }) {
  const medal = getRankIcon(rank);

  if (medal) {
    return (
      <motion.img
        src={medal}
        alt={`Rank ${rank} medal`}
        className="rank-medal"
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    );
  }

  return (
    <div className="rank-pill rank-pill-default">
      {rank}
    </div>
  );
}
