"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import Navbar from "@/components/navbar";
import LeaderboardPanel from "@/components/leaderboard-panel";
import AnalyticsPanel from "@/components/analytics-panel";
import AdminPanel from "@/components/admin-panel";
import HostelDataPanel from "@/components/hostel-data-panel";
import JudgingCriteria from "@/components/judging-criteria";
import PodiumCarousel from "@/components/podium-carousel";
import TrophyHero from "@/components/trophy-hero";
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
  // The trophy-dismantle hero is the landing moment on the primary view only.
  const showHero = podiumTop3.length >= 3 && activeTab === "leaderboard";
  const tabs = [
    { id: "leaderboard", label: "Leaderboard" },
    { id: "analytics", label: "Analytics" },
    ...(isAdminUser ? [{ id: "hostel-data", label: "Hostel Data" }] : []),
    ...(isDepartmentUser ? [{ id: "admin", label: "Admin" }] : [])
  ];

  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const mountedRef = useRef(false);

  // Switching tabs must land at the top - otherwise leaving the tall leaderboard
  // hero scrolled-down drops you at the bottom of a shorter tab.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activeTab]);

  // GSAP-driven sliding active indicator (measures the active tab and moves the
  // single pill to it - smooth on change, instant on first paint).
  useLayoutEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const active = nav.querySelector('[data-tab="' + activeTab + '"]');
    if (!active) return;
    const target = { x: active.offsetLeft, width: active.offsetWidth };
    if (!mountedRef.current) {
      gsap.set(indicator, { x: target.x, width: target.width, autoAlpha: 1 });
      mountedRef.current = true;
    } else {
      gsap.to(indicator, { x: target.x, width: target.width, duration: 0.42, ease: "power3.out" });
    }
  }, [activeTab, tabs.length]);

  return (
    <main className="page-shell dashboard-content-shell">
      <Navbar viewer={viewer} onSignOut={onSignOut} />

      {showHero ? <TrophyHero top3={podiumTop3} /> : null}

      {/* The leaderboard podium now rises out of the cup inside the hero; only the
          analytics view (no hero) needs the standalone podium. */}
      {showPodium && !showHero ? <PodiumCarousel top3={podiumTop3} /> : null}

      <nav className="segmented" role="tablist" aria-label="Dashboard views" ref={navRef}>
        <span className="segmented-indicator" ref={indicatorRef} aria-hidden="true" />
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab={tab.id}
              aria-selected={isActive}
              className={cx("segmented-item", isActive && "is-active")}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="segmented-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div key={activeTab} className="tab-panel-reveal">
        {activeTab === "leaderboard" ? <LeaderboardPanel payload={payload} /> : null}
        {activeTab === "analytics" ? <AnalyticsPanel payload={payload} /> : null}
        {isAdminUser && activeTab === "hostel-data" ? (
          <HostelDataPanel payload={payload} onSubmitted={onRefresh} />
        ) : null}
        {isDepartmentUser && activeTab === "admin" ? (
          <AdminPanel payload={payload} viewer={viewer} onSubmitted={onRefresh} />
        ) : null}
      </div>

      <JudgingCriteria />
    </main>
  );
}
