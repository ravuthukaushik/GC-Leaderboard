"use client";

import { motion } from "framer-motion";
import RankBadge from "@/components/rank-badge";
import BorderGlow from "@/components/BorderGlow";
import PodiumCarousel from "@/components/podium-carousel";

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

export default function LeaderboardPanel({ payload }) {
  const top3 = payload.leaderboard.slice(0, 3);

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
      {top3.length >= 3 && <PodiumCarousel top3={top3} />}

      {/* ─── LEADERBOARD TABLE ─── */}
      <BorderGlow
        className="table-panel"
        borderRadius={28}
        colors={["#22C55E", "#3B82F6"]}
        backgroundColor="var(--glass-bg)"
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="panel-heading">
            <div>
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
                  ) : hostel.badges.length ? (
                    <small>{hostel.badges.join(" · ")}</small>
                  ) : null}
                </div>
                <strong className="score-value">{hostel.totalScore.toFixed(1)}</strong>
                <SegmentBar hostel={hostel} />
                <span>{hostel.electricityScore.toFixed(1)}</span>
                <span>{hostel.wasteScore.toFixed(1)}</span>
                <span>{hostel.energyScore.toFixed(1)}</span>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </BorderGlow>
    </section>
  );
}
