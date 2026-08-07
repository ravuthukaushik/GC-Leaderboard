"use client";

import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/navbar";
import LeaderboardPanel from "@/components/leaderboard-panel";
import AnalyticsPanel from "@/components/analytics-panel";
import AdminPanel from "@/components/admin-panel";
import HostelDataPanel from "@/components/hostel-data-panel";
import JudgingCriteria from "@/components/judging-criteria";
import PodiumCarousel from "@/components/podium-carousel";
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
  const podiumTop3 = payload.leaderboard.slice(0, 3);
  const showPodium = podiumTop3.length >= 3 && (activeTab === "leaderboard" || activeTab === "analytics");
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
      <Navbar viewer={viewer} onSignOut={onSignOut} />

      {showPodium ? <PodiumCarousel top3={podiumTop3} /> : null}

      <nav className="segmented" role="tablist" aria-label="Dashboard views">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cx("segmented-item", isActive && "is-active")}
              onClick={() => setActiveTab(tab.id)}
            >
              {isActive ? (
                <motion.span
                  layoutId="segmented-active"
                  className="segmented-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : null}
              <span className="segmented-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

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
