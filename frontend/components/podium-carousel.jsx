"use client";

import { motion, useReducedMotion } from "framer-motion";
import PodiumMedal from "@/components/podium-medal";

// Two-letter monogram from a hostel name (e.g. "Hostel 5" → "H5").
function monogram(name) {
  const compact = String(name).replace("Hostel", "H").replace(/\s+/g, "");
  return compact.slice(0, 3).toUpperCase();
}

const EASE_OUT = [0.16, 1, 0.3, 1];

function PodiumColumn({ hostel, order, reduce }) {
  const rank = hostel.rank;
  const isCenter = order === 1; // 2nd · 1st · 3rd → centre is the champion
  const fromLeft = order === 0; // rank 2 sits on the left, rank 3 on the right

  // Champion appears first; the wings then slide out from behind it.
  const initial = reduce
    ? false
    : isCenter
      ? { opacity: 0, y: 40, scale: 0.9 }
      : { opacity: 0, x: fromLeft ? 240 : -240, y: 10, scale: 0.66 };

  const delay = isCenter ? 0 : fromLeft ? 0.5 : 0.62;

  return (
    <motion.div
      className={`podium-col podium-col-${rank}`}
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={{ duration: isCenter ? 0.6 : 0.8, delay, ease: EASE_OUT }}
    >
      <motion.div
        className="podium-lift"
        whileHover={reduce ? undefined : { y: -10 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className={`podium-card-glass podium-card-${rank}`}>
          <div className="podium-crest">
            <PodiumMedal rank={rank} size={rank === 1 ? 62 : 52} />
          </div>

          <div className={`podium-avatar podium-avatar-${rank}`}>
            {hostel.image ? (
              <img src={hostel.image} alt="" />
            ) : (
              <span aria-hidden="true">{monogram(hostel.name)}</span>
            )}
          </div>

          <span className="podium-name">{hostel.name}</span>

          <div className="podium-score-wrap">
            <span className="podium-score">{hostel.totalScore.toFixed(1)}</span>
            <span className="podium-score-label">points</span>
          </div>
        </div>

        <div className={`podium-pedestal pedestal-${rank}`}>
          <span className="pedestal-rank">{rank}</span>
          <span className="pedestal-sheen" aria-hidden="true" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PodiumCarousel({ top3 }) {
  const reduce = useReducedMotion();

  // Classic centre-tallest arrangement: 2nd · 1st · 3rd.
  const ordered = [
    top3.find((entry) => entry.rank === 2),
    top3.find((entry) => entry.rank === 1),
    top3.find((entry) => entry.rank === 3)
  ].filter(Boolean);

  return (
    <section className="podium-hero" aria-label="Top three hostels">
      <div className="podium-hero-ambient" aria-hidden="true" />

      <motion.header
        className="podium-hero-copy"
        initial={reduce ? false : { opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="podium-hero-title">The Green Cup Leaderboard</h1>
      </motion.header>

      <div className="podium-stage">
        {ordered.map((hostel, index) => (
          <PodiumColumn key={hostel.hostelId} hostel={hostel} order={index} reduce={reduce} />
        ))}
      </div>
    </section>
  );
}
