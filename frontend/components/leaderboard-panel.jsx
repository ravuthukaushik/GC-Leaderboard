"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import RankBadge from "@/components/rank-badge";
import BorderGlow from "@/components/BorderGlow";

function SegmentBar({ hostel }) {
  const segments = [
    { label: "Resources", value: hostel.resourcesScore, color: "var(--color-electricity)" },
    { label: "Waste", value: hostel.wasteScore, color: "var(--color-waste)" },
    { label: "Community", value: hostel.communityScore, color: "var(--color-events)" }
  ];

  return (
    <div className="segment-bar" aria-label={`${hostel.name} score basket`}>
      {segments.map((segment) => (
        <span
          key={segment.label}
          style={{ width: `${Math.max(segment.value, 4)}%`, background: segment.color }}
          title={`${segment.label}: ${segment.value.toFixed(1)}`}
        />
      ))}
    </div>
  );
}

export default function LeaderboardPanel({ payload }) {
  const rootRef = useRef(null);

  // Rows fade/slide in with a short stagger when the table becomes visible. An
  // IntersectionObserver is used (not ScrollTrigger) because its scroll-position
  // math is unreliable beneath the tall pinned hero - the rows were only showing
  // once you hit the very end of the page. A safety net reveals them regardless.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const rows = root.querySelectorAll(".leaderboard-row");
    const settle = () => gsap.set(rows, { opacity: 1, y: 0, clearProps: "transform" });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !rows.length) {
      settle();
      return undefined;
    }
    gsap.set(rows, { opacity: 0, y: 12 });
    const reveal = () => gsap.to(rows, { opacity: 1, y: 0, duration: 0.5, stagger: 0.045, ease: "power2.out" });
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!done && entries.some((e) => e.isIntersecting)) {
          done = true;
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(root);
    // Safety: reveal even if the observer never fires (e.g. throttled ticker).
    const safety = window.setTimeout(() => {
      if (!done && rows[0] && getComputedStyle(rows[0]).opacity === "0") settle();
    }, 3000);
    return () => {
      window.clearTimeout(safety);
      io.disconnect();
      settle();
    };
  }, [payload]);

  return (
    <section className="panel-stack" ref={rootRef}>
      <BorderGlow
        className="table-panel"
        borderRadius={28}
        colors={["#2F7A50", "#C9A227"]}
        backgroundColor="var(--glass-bg)"
      >
        <div>
          <div className="panel-heading">
            <div>
              <h3>Green Cup Leaderboard</h3>
            </div>
          </div>

          <div className="leaderboard-table">
            <div className="leaderboard-head">
              <span>#</span>
              <span>Hostel</span>
              <span>Total</span>
              <span>Basket split</span>
              <span className="col-header-with-indicator">
                <i className="header-indicator-dot" style={{ background: "var(--color-electricity)" }} />
                Resources
              </span>
              <span className="col-header-with-indicator">
                <i className="header-indicator-dot" style={{ background: "var(--color-waste)" }} />
                Waste
              </span>
              <span className="col-header-with-indicator">
                <i className="header-indicator-dot" style={{ background: "var(--color-events)" }} />
                Community
              </span>
            </div>

            {payload.leaderboard.map((hostel) => (
              <article key={hostel.hostelId} className="leaderboard-row">
                <RankBadge rank={hostel.rank} />
                <div className="hostel-meta">
                  <strong>{hostel.name}</strong>
                </div>
                <strong className="score-value" aria-label={`Total ${hostel.totalScore.toFixed(1)} points`}>
                  {hostel.totalScore.toFixed(1)}
                </strong>
                <SegmentBar hostel={hostel} />
                {/* The column headers are visual only (and hidden entirely on narrow
                    screens), so each figure carries its own label - otherwise a screen
                    reader just reads three bare numbers. */}
                <span aria-label={`Resources ${hostel.resourcesScore.toFixed(1)}`}>
                  {hostel.resourcesScore.toFixed(1)}
                </span>
                <span aria-label={`Waste ${hostel.wasteScore.toFixed(1)}`}>
                  {hostel.wasteScore.toFixed(1)}
                </span>
                <span aria-label={`Community ${hostel.communityScore.toFixed(1)}`}>
                  {hostel.communityScore.toFixed(1)}
                </span>
              </article>
            ))}
          </div>
        </div>
      </BorderGlow>
    </section>
  );
}
