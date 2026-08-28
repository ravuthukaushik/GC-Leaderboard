"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RankBadge from "@/components/rank-badge";
import BorderGlow from "@/components/BorderGlow";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

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

  // Rows fade/slide in with a short stagger as the table scrolls into view
  // (GSAP ScrollTrigger). A last-resort safety net reveals them if the ticker is
  // ever throttled so the table can never be stranded hidden.
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
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top 82%",
      once: true,
      onEnter: () => gsap.to(rows, { opacity: 1, y: 0, duration: 0.5, stagger: 0.045, ease: "power2.out" })
    });
    const safety = window.setTimeout(() => {
      if (rows[0] && getComputedStyle(rows[0]).opacity === "0") settle();
    }, 8000);
    return () => {
      window.clearTimeout(safety);
      st.kill();
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
                <strong className="score-value">{hostel.totalScore.toFixed(1)}</strong>
                <SegmentBar hostel={hostel} />
                <span>{hostel.resourcesScore.toFixed(1)}</span>
                <span>{hostel.wasteScore.toFixed(1)}</span>
                <span>{hostel.communityScore.toFixed(1)}</span>
              </article>
            ))}
          </div>
        </div>
      </BorderGlow>
    </section>
  );
}
