"use client";

/* =============================================================================
   Animation ownership - Green Cup (documented split; do not overlap)
   ─ anime.js  : full-page FIRST-LOAD choreography. This topographic contour map
                 (a nod to the IIT Bombay campus / Powai terrain behind the Green
                 Map) draws itself stroke-by-stroke via svg.createDrawable, the
                 whole elevation field rising from the centre outward.
   ─ GSAP      : scroll-driven work. Below, ScrollTrigger scrubs a slow parallax
                 drift on the contour group; leaderboard rows cascade in on scroll.
   ─ vanilla rAF : POINTER parallax. The contours are split into depth bands that
                 lerp toward the cursor by increasing amounts, so the terrain
                 floats in 3D as the mouse moves (à la the Anorent tactical page).
   ─ framer    : component-level React state/gesture - the tab pill, card hovers.
   If two libraries could own an effect, it belongs to whichever is doing MORE of
   the surrounding sequence.

   The field itself is a real iso-contour map: a deterministic value-noise height
   field sampled on a grid, then marching-squares at many thresholds, stitched
   into smooth closed loops. Not concentric rings - genuine multi-peak terrain.
   ============================================================================ */

import { useLayoutEffect, useMemo, useRef } from "react";
import { createTimeline, stagger, svg } from "animejs";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { introForThisLoad, prefersReducedMotion } from "@/lib/intro";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// This site's signature curve - a confident, slightly front-loaded ease-out.
const SIGNATURE_EASE = "cubicBezier(0.32, 0.86, 0.18, 1)";

const VW = 1440;
const VH = 900;
const PAD = 120; // sample past the edges so contours run off-frame, never float

// --- Deterministic value noise (integer hash → identical SSR + client) --------
const SEED = 1337;
function hash(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(SEED, 362437)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const smooth = (t) => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const tl = hash(xi, yi);
  const tr = hash(xi + 1, yi);
  const bl = hash(xi, yi + 1);
  const br = hash(xi + 1, yi + 1);
  const u = smooth(xf);
  const v = smooth(yf);
  const top = tl + (tr - tl) * u;
  const bot = bl + (br - bl) * u;
  return top + (bot - top) * v;
}
function fbm(x, y) {
  // Only two octaves, and the second is gentle - this keeps the height field soft
  // so contours read as large, rounded blobs rather than jagged, sharp-edged loops.
  let a = 0;
  let amp = 0.72;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < 2; o++) {
    a += vnoise(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.38;
    freq *= 2;
  }
  return a / norm;
}

// Catmull-Rom → cubic bezier smoothing for a polyline (open or closed).
function smoothPath(pts, closed) {
  const n = pts.length;
  if (n < 2) return "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i % n];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - (closed ? p0[0] : pts[Math.max(0, i - 1)][0])) / 6;
    const c1y = p1[1] + (p2[1] - (closed ? p0[1] : pts[Math.max(0, i - 1)][1])) / 6;
    const c2x = p2[0] - ((closed ? p3[0] : pts[Math.min(n - 1, i + 2)][0]) - p1[0]) / 6;
    const c2y = p2[1] - ((closed ? p3[1] : pts[Math.min(n - 1, i + 2)][1]) - p1[1]) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)} `;
  }
  return closed ? `${d}Z` : d;
}

// Marching-squares segment table (corner weights tl8 tr4 br2 bl1; edges
// a=top b=right c=bottom d=left). Saddles (5,10) left unresolved - fine here.
const SEG_TABLE = {
  1: [["c", "d"]], 2: [["b", "c"]], 3: [["b", "d"]], 4: [["a", "b"]],
  5: [["a", "d"], ["b", "c"]], 6: [["a", "c"]], 7: [["a", "d"]], 8: [["a", "d"]],
  9: [["a", "c"]], 10: [["a", "b"], ["c", "d"]], 11: [["a", "b"]], 12: [["b", "d"]],
  13: [["b", "c"]], 14: [["c", "d"]]
};

// Extract stitched, smoothed contour paths at a set of thresholds.
function buildContours() {
  // A fine grid over LARGE features (low NS): many sample points per loop, so each
  // smoothed contour comes out as a soft, near-circular blob - no sharp corners.
  const COLS = 60;
  const ROWS = 40;
  const x0 = -PAD;
  const y0 = -PAD;
  const cw = (VW + PAD * 2) / COLS;
  const ch = (VH + PAD * 2) / ROWS;
  const NS = 0.23; // noise scale - larger = smaller, tighter blobs

  // Height field on grid nodes.
  const V = [];
  for (let gy = 0; gy <= ROWS; gy++) {
    const row = [];
    for (let gx = 0; gx <= COLS; gx++) row.push(fbm(gx * NS, gy * NS));
    V.push(row);
  }

  // Many, closely-spaced elevation levels - tighter contour spacing fills the
  // field so there is little empty white space between rings.
  const thresholds = [];
  for (let t = 0.27; t <= 0.77; t += 0.026) thresholds.push(Number(t.toFixed(3)));

  const key = (p) => `${Math.round(p[0] * 10)}:${Math.round(p[1] * 10)}`;

  // bands: 3 depth layers by elevation (higher threshold = "closer" = moves more)
  const bands = [[], [], []];

  thresholds.forEach((t, ti) => {
    const segs = [];
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        const tl = V[gy][gx];
        const tr = V[gy][gx + 1];
        const br = V[gy + 1][gx + 1];
        const bl = V[gy + 1][gx];
        const ci = (tl > t ? 8 : 0) | (tr > t ? 4 : 0) | (br > t ? 2 : 0) | (bl > t ? 1 : 0);
        if (ci === 0 || ci === 15) continue;
        const px = x0 + gx * cw;
        const py = y0 + gy * ch;
        const edge = {
          a: [px + cw * ((t - tl) / (tr - tl)), py],
          b: [px + cw, py + ch * ((t - tr) / (br - tr))],
          c: [px + cw * ((t - bl) / (br - bl)), py + ch],
          d: [px, py + ch * ((t - tl) / (bl - tl))]
        };
        (SEG_TABLE[ci] || []).forEach(([e1, e2]) => segs.push([edge[e1], edge[e2]]));
      }
    }
    if (!segs.length) return;

    // Stitch segments into polylines by shared endpoints.
    const adj = new Map();
    const push = (k, v) => {
      if (!adj.has(k)) adj.set(k, []);
      adj.get(k).push(v);
    };
    segs.forEach((s, i) => {
      push(key(s[0]), { i, end: 0, pt: s[0], other: s[1] });
      push(key(s[1]), { i, end: 1, pt: s[1], other: s[0] });
    });
    const used = new Array(segs.length).fill(false);

    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      const line = [segs[i][0], segs[i][1]];
      // extend forward
      let guard = 0;
      while (guard++ < 4000) {
        const tail = line[line.length - 1];
        const cands = adj.get(key(tail)) || [];
        const nxt = cands.find((c) => !used[c.i]);
        if (!nxt) break;
        used[nxt.i] = true;
        line.push(nxt.other);
      }
      const first = line[0];
      const lastP = line[line.length - 1];
      const closed = key(first) === key(lastP) || Math.hypot(first[0] - lastP[0], first[1] - lastP[1]) < Math.max(cw, ch);
      if (line.length < 3) continue;
      if (closed && line.length > 2) line.pop(); // drop duplicated closing point
      const d = smoothPath(line, closed);
      if (!d) continue;
      // Centroid drives the localized cursor "spread": each contour is pushed
      // away from the pointer by an amount that falls off with distance.
      let sx = 0;
      let sy = 0;
      line.forEach((p) => { sx += p[0]; sy += p[1]; });
      bands[ti % 3].push({ d, ti, cx: sx / line.length, cy: sy / line.length });
    }
  });

  return bands;
}

export default function TopoBackground() {
  const rootRef = useRef(null);
  const groupRef = useRef(null);

  const bands = useMemo(buildContours, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const group = groupRef.current;
    if (!root || !group) return undefined;

    const reduce = prefersReducedMotion();
    const play = introForThisLoad() && !reduce;
    const lines = Array.from(root.querySelectorAll(".topo__line"));
    let tl;
    let safety;

    const forceRest = () => {
      lines.forEach((l) => { l.style.strokeDasharray = "none"; l.style.strokeDashoffset = "0"; });
      group.style.opacity = "1";
    };

    if (play) {
      group.style.opacity = "0";
      const drawables = svg.createDrawable(lines);
      tl = createTimeline({ defaults: { ease: SIGNATURE_EASE }, onComplete: () => window.clearTimeout(safety) });
      tl.add(drawables, { draw: ["0 0", "0 1"], duration: 1400, delay: stagger(9, { from: "center" }) }, 0);
      tl.add(group, { opacity: [0, 1], duration: 900, ease: "out(2)" }, 0);
      safety = window.setTimeout(forceRest, 3200);
    } else {
      forceRest();
    }

    // GSAP owns scroll - a slow parallax drift so the terrain feels alive.
    let scrollTween;
    if (!reduce) {
      scrollTween = gsap.to(group, {
        yPercent: -6,
        scale: 1.05,
        transformOrigin: "50% 40%",
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.7 }
      });
    }

    // LOCALIZED cursor spread - only the contours near the pointer react: each is
    // pushed outward (away from the cursor) with a smooth distance falloff, so the
    // terrain "spreads" open under the mouse while the rest stays perfectly still.
    const svgEl = root.querySelector(".topo__svg");
    const paths = Array.from(root.querySelectorAll(".topo__line"));
    const cen = paths.map((p) => [parseFloat(p.dataset.cx), parseFloat(p.dataset.cy)]);
    const R = 175;          // influence radius, in viewBox units (tight, local)
    const R2 = R * R;
    const PUSH = 26;        // max outward displacement at the cursor
    const active = new Set();
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, primed: false };
    let raf = null;

    // Map a client point into the SVG's viewBox space. getScreenCTM handles the
    // preserveAspectRatio="slice" scaling/offset for us - more robust than manual
    // rect math (which some embedded panes report as 0 for fixed elements).
    const vbPoint = svgEl.createSVGPoint();
    const toVB = (clientX, clientY) => {
      const m = svgEl.getScreenCTM();
      if (!m) return null;
      vbPoint.x = clientX;
      vbPoint.y = clientY;
      const p = vbPoint.matrixTransform(m.inverse());
      return [p.x, p.y];
    };

    const tick = () => {
      // Gentle follow - a low lerp factor lets the spread trail the cursor softly.
      mouse.x += (mouse.tx - mouse.x) * 0.13;
      mouse.y += (mouse.ty - mouse.y) * 0.13;
      const next = new Set();
      for (let i = 0; i < cen.length; i++) {
        const dx = cen[i][0] - mouse.x;
        const dy = cen[i][1] - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= R2) continue;
        const d = Math.sqrt(d2) || 0.0001;
        const t = 1 - d / R;          // 1 at cursor → 0 at radius
        const amt = (PUSH * t * t) / d;
        paths[i].style.transform = `translate(${(dx * amt).toFixed(2)}px, ${(dy * amt).toFixed(2)}px)`;
        next.add(i);
      }
      active.forEach((i) => { if (!next.has(i)) paths[i].style.transform = ""; });
      active.clear();
      next.forEach((i) => active.add(i));

      const settled = Math.abs(mouse.tx - mouse.x) < 0.15 && Math.abs(mouse.ty - mouse.y) < 0.15;
      raf = settled ? null : requestAnimationFrame(tick);
    };
    const onMove = (e) => {
      const vb = toVB(e.clientX, e.clientY);
      if (!vb) return;
      const [vx, vy] = vb;
      mouse.tx = vx;
      mouse.ty = vy;
      if (!mouse.primed) { mouse.x = vx; mouse.y = vy; mouse.primed = true; } // no jump from (0,0)
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      active.forEach((i) => { paths[i].style.transform = ""; });
      active.clear();
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      mouse.primed = false;
    };
    if (!reduce && !window.matchMedia("(pointer: coarse)").matches) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }

    return () => {
      window.clearTimeout(safety);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      if (tl && typeof tl.revert === "function") tl.revert();
      else if (tl && typeof tl.pause === "function") tl.pause();
      scrollTween?.scrollTrigger?.kill();
      scrollTween?.kill?.();
      if (group) group.style.opacity = "";
    };
  }, []);

  return (
    <div className="topo" ref={rootRef} aria-hidden="true">
      <svg className="topo__svg" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice">
        <g className="topo__g" ref={groupRef}>
          {bands.map((band, bi) => (
            <g className={`topo__band topo__band--${bi}`} key={bi}>
              {band.map((p, i) => (
                <path className="topo__line" key={i} d={p.d} data-cx={p.cx.toFixed(1)} data-cy={p.cy.toFixed(1)} />
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
