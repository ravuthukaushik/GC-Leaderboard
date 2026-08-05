"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Crown } from "lucide-react";
import PodiumMedal from "@/components/podium-medal";

// Per-rank choreography. Each card starts stacked behind the champion (hero
// state) and slides out to its podium slot as the section is scrolled through.
const LAYOUT = {
  1: { xStart: "0vw", xEnd: "0vw", yStart: 96, yEnd: -12, scaleStart: 1.12, scaleEnd: 1, opStart: 1, z: 3 },
  2: { xStart: "0vw", xEnd: "-23vw", yStart: 104, yEnd: 30, scaleStart: 0.6, scaleEnd: 0.82, opStart: 0, z: 2 },
  3: { xStart: "0vw", xEnd: "23vw", yStart: 104, yEnd: 48, scaleStart: 0.58, scaleEnd: 0.72, opStart: 0, z: 2 }
};

function ChampionScore({ value }) {
  return (
    <>
      <span className="podium-score">{value.toFixed(1)}</span>
      <span className="podium-score-label">Total Score</span>
    </>
  );
}

function PodiumCard({ hostel, rank, progress }) {
  const cfg = LAYOUT[rank] || LAYOUT[3];

  const x = useTransform(progress, [0, 0.55], [cfg.xStart, cfg.xEnd]);
  const y = useTransform(progress, [0, 0.55], [cfg.yStart, cfg.yEnd]);
  const scale = useTransform(progress, [0, 0.55], [cfg.scaleStart, cfg.scaleEnd]);
  const opacity = useTransform(progress, [0, 0.3], [cfg.opStart, 1]);

  return (
    <div className={`carousel-card-slot slot-rank-${rank}`} style={{ zIndex: cfg.z }}>
      <motion.article
        className={`carousel-card carousel-rank-${rank}`}
        style={{ x, y, scale, opacity }}
        whileHover={{ y: cfg.yEnd - 14, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      >
        <div className="podium-rank-indicator">
          {rank === 1 ? (
            <div className="podium-crown podium-crown-float">
              <Crown size={28} />
            </div>
          ) : (
            <div className="podium-rank-medal">
              <PodiumMedal rank={rank} size={54} />
            </div>
          )}
        </div>

        <div className="podium-avatar" aria-label={`${hostel.name} logo placeholder`} />

        <span className="podium-name">{hostel.name}</span>
        <ChampionScore value={hostel.totalScore} />
      </motion.article>
    </div>
  );
}

export default function PodiumCarousel({ top3 }) {
  const wrapRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"]
  });

  const champion = top3.find((h) => h.rank === 1) || top3[0];

  // Big hero title condenses into a compact eyebrow as you scroll in.
  const titleScale = useTransform(scrollYProgress, [0, 0.42], [1, 0.44]);
  const titleY = useTransform(scrollYProgress, [0, 0.42], [0, -54]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.36, 0.5], [1, 0.7, 0.55]);
  const heroGlow = useTransform(scrollYProgress, [0, 0.5], [1, 0.35]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <section className="podium-carousel-wrap" ref={wrapRef} aria-label="Top 3 hostels">
      <div className="podium-carousel-sticky">
        <motion.div className="podium-hero-glow" style={{ opacity: heroGlow }} aria-hidden="true" />

        <motion.header
          className="podium-hero-title"
          style={{ scale: titleScale, y: titleY, opacity: titleOpacity }}
        >
          <span className="podium-hero-eyebrow">Green Cup · Live Standings</span>
          <h2>
            Leading the race:{" "}
            <span className="podium-hero-champion">{champion?.name}</span>
          </h2>
        </motion.header>

        <div className="podium-carousel-stage">
          {top3.map((hostel) => (
            <PodiumCard
              key={hostel.hostelId}
              hostel={hostel}
              rank={hostel.rank}
              progress={scrollYProgress}
            />
          ))}
        </div>

        <motion.div className="podium-scroll-hint" style={{ opacity: scrollHintOpacity }} aria-hidden="true">
          <span>Scroll to reveal the podium</span>
          <div className="podium-scroll-mouse" />
        </motion.div>
      </div>
    </section>
  );
}
