"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import Navbar from "@/components/navbar";
import LeaderboardPanel from "@/components/leaderboard-panel";
import AnalyticsPanel from "@/components/analytics-panel";
import AdminPanel from "@/components/admin-panel";
import HostelDataPanel from "@/components/hostel-data-panel";
import JudgingCriteria from "@/components/judging-criteria";
import PastWinners from "@/components/past-winners";
import PodiumCarousel from "@/components/podium-carousel";
import TrophyHero from "@/components/trophy-hero";
import { hasIntroPlayed } from "@/lib/intro-film";
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
  // The cup film is the landing moment, and only until it has played on this page
  // load. After that (e.g. returning from Analytics) the leaderboard shows the
  // SAME standalone podium as Analytics, so both tabs are identical in position
  // and both replay the same podium reveal when you switch between them.
  const showHero = podiumTop3.length >= 3 && activeTab === "leaderboard" && !hasIntroPlayed();
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

  // The masthead holds its exact spot through the hero, then the leaderboard
  // pushes it up 1:1 as the tab bar reaches it (sticky alone would keep it
  // floating over the table for the rest of the tall hero section).
  useEffect(() => {
    if (!showHero) return undefined;
    const bar = document.querySelector(".hero-lock .topbar");
    const tabsEl = navRef.current;
    if (!bar || !tabsEl) return undefined;

    let ticking = false;
    const apply = () => {
      ticking = false;
      const barBottom = bar.offsetHeight + 10; // small breathing gap
      const push = Math.min(0, tabsEl.getBoundingClientRect().top - barBottom);
      bar.style.transform = push < 0 ? `translateY(${push.toFixed(1)}px)` : "";
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      bar.style.transform = "";
    };
  }, [showHero, activeTab]);

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
      <div className="hero-lock">
        <Navbar viewer={viewer} onSignOut={onSignOut} />
        {showHero ? <TrophyHero top3={podiumTop3} /> : null}
      </div>

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
      <PastWinners />
    </main>
  );
}
