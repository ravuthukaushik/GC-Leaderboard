"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import RankBadge from "@/components/rank-badge";

function CategoryBadges({ badges }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="hostel-meta-badges">
      {badges.map((badge) => {
        let cls = "category-badge";
        if (badge.includes("Electricity")) cls += " badge-electricity";
        else if (badge.includes("Waste")) cls += " badge-waste";
        else if (badge.includes("Events")) cls += " badge-events";
        return (
          <span key={badge} className={cls}>
            {badge}
          </span>
        );
      })}
    </div>
  );
}

function SegmentBar({ hostel }) {
  const segments = [
    { label: "Electricity", value: hostel.electricityScore, color: "var(--color-electricity)" },
    { label: "Waste", value: hostel.wasteScore, color: "var(--color-waste)" },
    { label: "Events", value: hostel.energyScore, color: "var(--color-events)" }
  ];

  return (
    <div className="segment-bar" aria-label={`${hostel.name} score basket`}>
      {segments.map((segment) => (
        <motion.span
          key={segment.label}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(segment.value, 4)}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ background: segment.color }}
          title={`${segment.label}: ${segment.value.toFixed(1)}`}
        />
      ))}
    </div>
  );
}

function PodiumCard({ hostel, rank }) {
  const rankClass = `podium-card podium-rank-${rank}`;

  return (
    <div className={`podium-slot podium-slot-${rank}`}>
      <motion.article
        className={rankClass}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: rank === 1 ? 0 : rank === 2 ? 0.12 : 0.24,
          ease: "easeOut"
        }}
        whileHover={{
          y: -10,
          scale: 1.03,
          transition: { type: "spring", stiffness: 350, damping: 22 }
        }}
      >
        {/* Crown / rank badge floating above avatar */}
        <div className="podium-rank-indicator">
          {rank === 1 ? (
            <motion.div
              className="podium-crown"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
            >
              <Crown size={28} />
            </motion.div>
          ) : (
            <div className="podium-rank-badge">
              {rank}
            </div>
          )}
        </div>

        {/* Avatar overlapping top edge */}
        <div className="podium-avatar" aria-label={`${hostel.name} logo placeholder`} />

        {/* Name */}
        <span className="podium-name">{hostel.name}</span>

        {/* Score */}
        <span className="podium-score">{hostel.totalScore.toFixed(1)}</span>
        <span className="podium-score-label">Total Score</span>

        {/* Category badges */}
        <CategoryBadges badges={hostel.categoryLeaderBadges} />
      </motion.article>

      {/* Pedestal base */}
      <div className="podium-pedestal" />
    </div>
  );
}

export default function LeaderboardPanel({ payload }) {
  const top3 = payload.leaderboard.slice(0, 3);
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  const rowVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, x: -12 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.32, ease: "easeInOut" }
    }
  };

  return (
    <section className="panel-stack">
      {/* ─── TOP-3 PODIUM ─── */}
      {top3.length >= 3 && (
        <section className="podium-section" aria-label="Top 3 hostels">
          {podiumOrder.map((hostel) => (
            <PodiumCard
              key={hostel.hostelId}
              hostel={hostel}
              rank={hostel.rank}
            />
          ))}
        </section>
      )}

      {/* ─── LEADERBOARD TABLE ─── */}
      <motion.section
        className="table-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Full Standings</p>
            <h3>Green Cup Leaderboard</h3>
          </div>
        </div>

        <motion.div
          className="leaderboard-table"
          variants={rowVariants}
          initial="initial"
          animate="animate"
        >
          <div className="leaderboard-head">
            <span>#</span>
            <span></span>
            <span>Hostel</span>
            <span>Total</span>
            <span>Basket split</span>
            <span className="col-header-with-indicator">
              <i className="header-indicator-dot" style={{ background: "var(--color-electricity)" }} />
              Electricity
            </span>
            <span className="col-header-with-indicator">
              <i className="header-indicator-dot" style={{ background: "var(--color-waste)" }} />
              Waste
            </span>
            <span className="col-header-with-indicator">
              <i className="header-indicator-dot" style={{ background: "var(--color-events)" }} />
              Events
            </span>
          </div>

          {payload.leaderboard.map((hostel) => (
            <motion.article
              key={hostel.hostelId}
              className="leaderboard-row"
              variants={itemVariants}
              whileHover={{ x: 4, scale: 1.005 }}
            >
              <RankBadge rank={hostel.rank} />
              <div className="hostel-avatar-small" aria-label={`${hostel.name} logo`} />
              <div className="hostel-meta">
                <strong>{hostel.name}</strong>
                {hostel.categoryLeaderBadges?.length > 0 ? (
                  <CategoryBadges badges={hostel.categoryLeaderBadges} />
                ) : (
                  <small>
                    {hostel.badges.length ? hostel.badges.join(" · ") : "Average season score"}
                  </small>
                )}
              </div>
              <strong className="score-value">{hostel.totalScore.toFixed(1)}</strong>
              <SegmentBar hostel={hostel} />
              <span>{hostel.electricityScore.toFixed(1)}</span>
              <span>{hostel.wasteScore.toFixed(1)}</span>
              <span>{hostel.energyScore.toFixed(1)}</span>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>
    </section>
  );
}
