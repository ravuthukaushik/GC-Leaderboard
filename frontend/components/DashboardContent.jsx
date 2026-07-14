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

  const tabGlowColors = {
    leaderboard: ["#22C55E", "#3B82F6"],
    analytics: ["#3B82F6", "#22C55E"],
    "hostel-data": ["#22C55E", "#F59E0B"],
    admin: ["#6366F1", "#3B82F6"]
  };

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
      <BorderGlow
        className="masthead-panel"
        borderRadius={32}
        colors={["#22C55E", "#10B981"]}
        backgroundColor="var(--glass-bg)"
      >
        <Navbar viewer={viewer} onSignOut={onSignOut} />
      </BorderGlow>

      <section className="tab-row" aria-label="Dashboard tabs">
        {tabs.map((tab) => (
          <BorderGlow
            key={tab.id}
            className={cx("tab-glow-wrap", activeTab === tab.id && "tab-glow-active")}
            borderRadius={12}
            colors={tabGlowColors[tab.id] || ["#22C55E", "#3B82F6"]}
            backgroundColor="var(--tab-bg)"
          >
            <button
              type="button"
              className={cx("tab-button", activeTab === tab.id && "tab-active")}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </BorderGlow>
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
