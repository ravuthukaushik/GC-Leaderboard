"use client";

/* =============================================================================
   Animation ownership - Green Cup (documented split; do not overlap)
   ─ anime.js : full-page FIRST-LOAD choreography. This topographic contour map
                (a nod to the IIT Bombay campus / Powai terrain behind the Green
                Map) draws itself stroke-by-stroke via svg.createDrawable, from
                the centre outward - the "elevation" rising from the peak. The
                site's signature easing (SIGNATURE_EASE) is defined + used here.
   ─ GSAP     : scroll-driven work. Below, ScrollTrigger scrubs a slow parallax
                drift on the contour group; the leaderboard rows use ScrollTrigger
                to cascade in as they enter view.
   ─ framer   : component-level React state/gesture - the tab pill, card hovers.
   If two libraries could own an effect, it belongs to whichever is doing MORE of
   the surrounding sequence.
   ============================================================================ */

import { useLayoutEffect, useMemo, useRef } from "react";
import { animate, createTimeline, stagger, svg } from "animejs";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { introForThisLoad, prefersReducedMotion } from "@/lib/intro";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// This site's signature curve - a confident, slightly front-loaded ease-out,
// used consistently for the topographic draw (deliberately not a stock name).
const SIGNATURE_EASE = "cubicBezier(0.32, 0.86, 0.18, 1)";

const VW = 1440;
const VH = 900;
const CX = 748; // peak sits slightly west-of-centre, like the campus hill
const CY = 452;

// Catmull-Rom → cubic bezier, closed - smooth organic contour rings.
function smoothClosed(points) {
  const n = points.length;
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)} `;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return `${d}Z`;
}

// Deterministic (no Math.random → no hydration mismatch) organic contour.
function contour(radius, seed, squashY = 0.92, stretchX = 1.3) {
  const steps = 18;
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = radius * (1 + 0.1 * Math.sin(a * 3 + seed) + 0.06 * Math.cos(a * 2 - seed * 1.7) + 0.035 * Math.sin(a * 5 + seed));
    pts.push([CX + r * Math.cos(a) * stretchX, CY + r * Math.sin(a) * squashY]);
  }
  return smoothClosed(pts);
}

export default function TopoBackground() {
  const rootRef = useRef(null);
  const groupRef = useRef(null);

  const rings = useMemo(() => {
    const out = [];
    for (let i = 0; i < 13; i++) {
      const radius = 64 + i * 47;
      out.push(contour(radius, 0.6 + i * 0.9));
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const group = groupRef.current;
    if (!root || !group) return undefined;

    const reduce = prefersReducedMotion();
    const play = introForThisLoad() && !reduce;
    const lines = Array.from(root.querySelectorAll(".topo__line"));
    let tl;
    let safety;

    // Guaranteed resting state - the map can never be stranded hidden if the
    // ticker is throttled (backgrounded first load / non-compositing frame).
    const forceRest = () => {
      lines.forEach((l) => { l.style.strokeDasharray = "none"; l.style.strokeDashoffset = "0"; });
      group.style.opacity = "1";
    };

    if (play) {
      group.style.opacity = "0"; // hide any pre-draw flash before the timeline runs
      const drawables = svg.createDrawable(lines);
      tl = createTimeline({ defaults: { ease: SIGNATURE_EASE }, onComplete: () => window.clearTimeout(safety) });
      // Contours draw from the centre outward - the peak first.
      tl.add(drawables, { draw: ["0 0", "0 1"], duration: 1500, delay: stagger(65, { from: "center" }) }, 0);
      tl.add(group, { opacity: [0, 1], duration: 900, ease: "out(2)" }, 0);
      safety = window.setTimeout(forceRest, 2900);
    }

    // GSAP owns scroll - a slow parallax drift so the terrain feels alive.
    let scrollTween;
    if (!reduce) {
      scrollTween = gsap.to(group, {
        yPercent: -7,
        scale: 1.06,
        transformOrigin: "50% 40%",
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.7 }
      });
    }

    return () => {
      window.clearTimeout(safety);
      if (tl && typeof tl.revert === "function") tl.revert();
      else if (tl && typeof tl.pause === "function") tl.pause();
      scrollTween?.scrollTrigger?.kill();
      scrollTween?.kill?.();
      if (group) { group.style.opacity = ""; }
    };
  }, []);

  return (
    <div className="topo" ref={rootRef} aria-hidden="true">
      <svg className="topo__svg" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice">
        <g className="topo__g" ref={groupRef}>
          {rings.map((d, i) => (
            <path className="topo__line" key={i} d={d} />
          ))}
        </g>
      </svg>
    </div>
  );
}
