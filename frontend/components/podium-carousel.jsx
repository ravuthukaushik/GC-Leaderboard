"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Crown } from "lucide-react";

const DEG = Math.PI / 180;
const CARD_COUNT = 3;

function useRingGeometry() {
  const [geometry, setGeometry] = useState({ radius: 32, tilt: 28 });

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 780px)");
    const medium = window.matchMedia("(max-width: 1024px)");

    const update = () => {
      if (narrow.matches) setGeometry({ radius: 20, tilt: 16 });
      else if (medium.matches) setGeometry({ radius: 26, tilt: 22 });
      else setGeometry({ radius: 32, tilt: 28 });
    };

    update();
    narrow.addEventListener("change", update);
    medium.addEventListener("change", update);
    return () => {
      narrow.removeEventListener("change", update);
      medium.removeEventListener("change", update);
    };
  }, []);

  return geometry;
}

// Distance of card `index` from the active card, wrapped to [-1, 1] so
// only "front / peeking-left / peeking-right" positions ever occur.
function relativePosition(index, activeIndex) {
  let rel = index - activeIndex;
  if (rel > 1) rel -= CARD_COUNT;
  if (rel < -1) rel += CARD_COUNT;
  return rel;
}

function CarouselCard({ hostel, rank, index, activeIndex, radius, tilt }) {
  const rel = relativePosition(index, activeIndex);
  // Next-up card approaches from the left, the previous card recedes to the right.
  const angleRad = -rel * 120 * DEG;
  const depth = (Math.cos(angleRad) + 1) / 2;

  const target = {
    x: `${Math.sin(angleRad) * radius}vw`,
    scale: 0.72 + 0.28 * depth,
    opacity: 0.32 + 0.68 * depth,
    rotateY: -Math.sin(angleRad) * tilt
  };

  return (
    <div className={`carousel-card-slot slot-rank-${rank}`} style={{ zIndex: rel === 0 ? 3 : 2 }}>
      <motion.article
        className={`carousel-card carousel-rank-${rank}`}
        animate={target}
        transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.9 }}
        whileHover={{
          y: -14,
          scale: target.scale * 1.05,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        }}
      >
        <div className="podium-rank-indicator">
          {rank === 1 ? (
            <div className="podium-crown">
              <Crown size={28} />
            </div>
          ) : (
            <div className="podium-rank-badge">{rank}</div>
          )}
        </div>

        <div className="podium-avatar" aria-label={`${hostel.name} logo placeholder`} />
        <span className="podium-name">{hostel.name}</span>
        <span className="podium-score">{hostel.totalScore.toFixed(1)}</span>
        <span className="podium-score-label">Total Score</span>
      </motion.article>
    </div>
  );
}

export default function PodiumCarousel({ top3 }) {
  const wrapRef = useRef(null);
  const { radius, tilt } = useRingGeometry();
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    const step = Math.min(CARD_COUNT - 1, Math.max(0, Math.floor(value * CARD_COUNT)));
    setActiveIndex((current) => (current === step ? current : step));
  });

  return (
    <section className="podium-carousel-wrap" ref={wrapRef} aria-label="Top 3 hostels">
      <div className="podium-carousel-sticky">
        <div className="podium-carousel-stage">
          {top3.map((hostel, i) => (
            <CarouselCard
              key={hostel.hostelId}
              hostel={hostel}
              rank={hostel.rank}
              index={i}
              activeIndex={activeIndex}
              radius={radius}
              tilt={tilt}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
