"use client";

import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navbar";
import LeaderboardPanel from "@/components/leaderboard-panel";
import AnalyticsPanel from "@/components/analytics-panel";
import AdminPanel from "@/components/admin-panel";
import HostelDataPanel from "@/components/hostel-data-panel";
import JudgingCriteria from "@/components/judging-criteria";
import BorderGlow from "@/components/BorderGlow";
import { cx } from "@/lib/utils";

export default function DashboardContent({
  payload,
  viewer,
  activeTab,
  setActiveTab,
  onRefresh,
  onSignOut
}) {
  const isDepartmentUser = viewer?.isAdmin;
  const isAdminUser = viewer?.role === "admin";
  const tabs = [
    { id: "leaderboard", label: "Leaderboard" },
    { id: "analytics", label: "Analytics" },
    ...(isAdminUser ? [{ id: "hostel-data", label: "Hostel Data" }] : []),
    ...(isDepartmentUser ? [{ id: "admin", label: "Admin" }] : [])
  ];

  const contentVariants = {
    initial: { opacity: 0, y: 18 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeInOut" }
    },
    exit: {
      opacity: 0,
      y: 12,
      transition: { duration: 0.28, ease: "easeInOut" }
    }
  };

  return (
    <motion.main
      className="page-shell dashboard-content-shell"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.48, ease: "easeInOut" }}
    >
      <section className="masthead-panel">
        <Navbar viewer={viewer} onSignOut={onSignOut} />
      </section>

      <section className="insight-grid">
        {payload.insights.map((insight) => (
          <BorderGlow
            key={insight.title}
            className="glow-surface"
            edgeSensitivity={26}
            glowColor="142 42 58"
            backgroundColor="rgba(255,255,255,0.82)"
            borderRadius={22}
            glowRadius={26}
            glowIntensity={0.6}
            coneSpread={24}
            colors={["#79b5e8", "#9bcc56", "#5ec1a4"]}
            fillOpacity={0.22}
          >
            <motion.article
              className="insight-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <p className="eyebrow">{insight.label}</p>
              <h3>{insight.title}</h3>
              <p>{insight.description}</p>
            </motion.article>
          </BorderGlow>
        ))}
      </section>

      <section className="tab-row" aria-label="Dashboard tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={cx("tab-button", activeTab === tab.id && "tab-active")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </section>

      <AnimatePresence mode="wait">
        {activeTab === "leaderboard" ? (
          <motion.div key="leaderboard" variants={contentVariants} initial="initial" animate="animate" exit="exit">
            <LeaderboardPanel payload={payload} />
          </motion.div>
        ) : null}

        {activeTab === "analytics" ? (
          <motion.div key="analytics" variants={contentVariants} initial="initial" animate="animate" exit="exit">
            <AnalyticsPanel payload={payload} />
          </motion.div>
        ) : null}

        {isAdminUser && activeTab === "hostel-data" ? (
          <motion.div key="hostel-data" variants={contentVariants} initial="initial" animate="animate" exit="exit">
            <HostelDataPanel payload={payload} onSubmitted={onRefresh} />
          </motion.div>
        ) : null}

        {isDepartmentUser && activeTab === "admin" ? (
          <motion.div key="admin" variants={contentVariants} initial="initial" animate="animate" exit="exit">
            <AdminPanel payload={payload} viewer={viewer} onSubmitted={onRefresh} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <JudgingCriteria />
    </motion.main>
  );
}
