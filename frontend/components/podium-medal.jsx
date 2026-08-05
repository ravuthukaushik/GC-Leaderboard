"use client";

import { useRef, useState } from "react";

/**
 * PodiumMedal
 * Lightweight SVG award medal (gold / silver / bronze) with metallic gradients,
 * a ribbon, and a star. Tilts toward the cursor on hover for a 3D feel.
 */
const METAL = {
  1: {
    ring: ["#FEF3C7", "#FCD34D", "#B45309"],
    face: ["#FDE68A", "#F59E0B"],
    ribbon: ["#F59E0B", "#B45309"],
    star: "#7C2D12",
    label: "1st"
  },
  2: {
    ring: ["#F8FAFC", "#CBD5E1", "#475569"],
    face: ["#E2E8F0", "#94A3B8"],
    ribbon: ["#94A3B8", "#475569"],
    star: "#334155",
    label: "2nd"
  },
  3: {
    ring: ["#FFE8D1", "#F0A868", "#7C2D12"],
    face: ["#FBBF77", "#D97706"],
    ribbon: ["#D97706", "#7C2D12"],
    star: "#5A1E0A",
    label: "3rd"
  }
};

export default function PodiumMedal({ rank, size = 100 }) {
  const metal = METAL[rank] || METAL[3];
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const uid = `medal-${rank}`;

  const handleMove = (event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -py * 22, ry: px * 26 });
  };

  const reset = () => setTilt({ rx: 0, ry: 0 });

  return (
    <div
      ref={ref}
      className="podium-medal-tilt"
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 120"
        width="100%"
        height="100%"
        className="podium-medal-svg"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
        role="img"
        aria-label={`${metal.label} place medal`}
      >
        <defs>
          <radialGradient id={`${uid}-face`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor={metal.face[0]} />
            <stop offset="100%" stopColor={metal.face[1]} />
          </radialGradient>
          <linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={metal.ring[0]} />
            <stop offset="50%" stopColor={metal.ring[1]} />
            <stop offset="100%" stopColor={metal.ring[2]} />
          </linearGradient>
          <linearGradient id={`${uid}-ribbon-l`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metal.ribbon[0]} />
            <stop offset="100%" stopColor={metal.ribbon[1]} />
          </linearGradient>
        </defs>

        {/* Ribbons */}
        <path d="M35 8 L50 62 L30 62 L20 12 Z" fill={`url(#${uid}-ribbon-l)`} opacity="0.95" />
        <path d="M65 8 L80 12 L70 62 L50 62 Z" fill={`url(#${uid}-ribbon-l)`} opacity="0.8" />

        {/* Medal disc */}
        <circle cx="50" cy="78" r="34" fill={`url(#${uid}-ring)`} />
        <circle cx="50" cy="78" r="26" fill={`url(#${uid}-face)`} />
        <circle
          cx="50"
          cy="78"
          r="26"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
        />

        {/* Star */}
        <path
          d="M50 60 L54.7 71.3 L67 72.2 L57.6 80.2 L60.5 92 L50 85.5 L39.5 92 L42.4 80.2 L33 72.2 L45.3 71.3 Z"
          fill={metal.star}
          opacity="0.85"
        />

        {/* Highlight sheen */}
        <ellipse cx="41" cy="68" rx="10" ry="6" fill="rgba(255,255,255,0.4)" />
      </svg>
    </div>
  );
}
