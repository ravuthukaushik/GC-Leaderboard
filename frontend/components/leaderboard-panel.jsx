"use client";

import { motion } from "framer-motion";
import { BarChart3, Flame, Medal, Trophy } from "lucide-react";
import BorderGlow from "@/components/BorderGlow";
import RankBadge from "@/components/rank-badge";
import { formatDelta } from "@/lib/utils";

function SegmentBar({ hostel }) {
  const segments = [
    { label: "Electricity", value: hostel.electricityScore, color: "var(--green)" },
    { label: "Waste", value: hostel.wasteScore, color: "var(--amber)" },
    { label: "Events", value: hostel.energyScore, color: "var(--sky)" }
  ];

  return (
    <div className="segment-bar" aria-label={`${hostel.name} score basket`}>
      {segments.map((segment) => (
        <motion.span
          key={segment.label}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(segment.value, 5)}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ background: segment.color }}
          title={`${segment.label}: ${segment.value.toFixed(1)}`}
        />
      ))}
    </div>
  );
}

export default function LeaderboardPanel({ payload }) {
  const rowVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, x: -16 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.36, ease: "easeInOut" }
    }
  };

  const summaryCards = [
    {
      label: "Hostels",
      value: payload.summary.hostelCount,
      subtext: "in the Green Cup",
      icon: Trophy
    },
    {
      label: "Leaderboard",
      value: payload.summary.leader?.name || "No data",
      subtext: payload.summary.leader
        ? `${payload.summary.leader.totalScore.toFixed(1)} average pts`
        : "waiting for weekly uploads",
      accent: "green",
      icon: Medal
    },
    {
      label: "Average Score",
      value: payload.summary.monthlyAverage.toFixed(1),
      subtext: "season-wide weekly average",
      icon: BarChart3
    },
    {
      label: "Biggest Climber",
      value: payload.summary.biggestClimber?.name || "No change yet",
      subtext: payload.summary.biggestClimber
        ? formatDelta(payload.summary.biggestClimber.momentumDelta)
        : "needs two weeks of data",
      icon: Flame
    }
  ];

  return (
    <section className="panel-stack">
      <motion.section
        className="table-panel"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Lifetime Leaderboard</p>
            <h3>Average Green Cup standings</h3>
          </div>
          <div className="legend">
            <span><i style={{ background: "var(--green)" }} />Electricity</span>
            <span><i style={{ background: "var(--amber)" }} />Waste</span>
            <span><i style={{ background: "var(--sky)" }} />Events</span>
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
            <span>Hostel</span>
            <span>Total</span>
            <span>Basket split</span>
            <span>Electricity</span>
            <span>Waste</span>
            <span>Events</span>
          </div>

          {payload.leaderboard.map((hostel) => (
            <motion.article
              key={hostel.hostelId}
              className="leaderboard-row"
              variants={itemVariants}
              whileHover={{ x: 6, scale: 1.01 }}
            >
              <RankBadge rank={hostel.rank} />
              <div className="hostel-meta">
                <strong>{hostel.name}</strong>
                <small>
                  {hostel.badges.length ? hostel.badges.join(" • ") : "Average season score"}
                </small>
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

      <section className="card-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <BorderGlow
              key={card.label}
              className="glow-surface"
              edgeSensitivity={24}
              glowColor="145 44 60"
              backgroundColor="rgba(255,255,255,0.82)"
              borderRadius={22}
              glowRadius={24}
              glowIntensity={0.58}
              coneSpread={22}
              colors={card.accent ? ["#9bcc56", "#79b5e8", "#5ec1a4"] : ["#79b5e8", "#9bcc56", "#7cd6b3"]}
              fillOpacity={0.2}
            >
              <motion.article
                className={`summary-card${card.accent ? ` accent-${card.accent}` : ""}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <div className="summary-icon">
                  <Icon size={18} />
                </div>
                <p className="summary-label">{card.label}</p>
                <h2>{card.value}</h2>
                <p className="summary-subtext">{card.subtext}</p>
              </motion.article>
            </BorderGlow>
          );
        })}
      </section>
    </section>
  );
}
