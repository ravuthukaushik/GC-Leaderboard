"use client";

/* =============================================================================
   Animation ownership - Green Cup (documented split; do not overlap)
   ─ anime.js  : full-page FIRST-LOAD choreography. This topographic contour map
                 (a nod to the IIT Bombay campus / Powai terrain behind the Green
                 Map) draws itself stroke-by-stroke via svg.createDrawable, the
                 whole elevation field rising from the centre outward.
   ─ GSAP      : scroll-driven work elsewhere (leaderboard rows cascade in). This
                 background deliberately owns NO scroll animation - see below.
   ─ vanilla rAF : POINTER deformation. Contour vertices are pushed outward from
                 the cursor with a smooth falloff and the curve re-emitted, so the
                 terrain bends open under the pointer (à la the Anorent page).
   ─ framer    : component-level React state/gesture - the tab pill, card hovers.
   If two libraries could own an effect, it belongs to whichever is doing MORE of
   the surrounding sequence.

   The field itself is a real iso-contour map: a deterministic value-noise height
   field sampled on a grid, then marching-squares at many thresholds, stitched
   into smooth closed loops. Not concentric rings - genuine multi-peak terrain.
   ============================================================================ */

import { useLayoutEffect, useMemo, useRef } from "react";
import { createTimeline, stagger, svg } from "animejs";
import { introForThisLoad, prefersReducedMotion } from "@/lib/intro";

// This site's signature curve - a confident, slightly front-loaded ease-out.
const SIGNATURE_EASE = "cubicBezier(0.32, 0.86, 0.18, 1)";

const VW = 1440;
const VH = 900;
const PAD = 120; // sample past the edges so contours run off-frame, never float

// --- Deterministic value noise (integer hash → identical SSR + client) --------
const SEED = 20481;
function hash(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(SEED, 362437)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
// Quintic fade (6t^5-15t^4+10t^3): C2-continuous, so the height field - and thus
// the iso-contours - has no derivative kinks at cell boundaries = silky curves.
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
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

// Catmull-Rom → cubic bezier smoothing over a FLAT coord array [x0,y0,x1,y1,...].
// The same function serves build time and the per-frame cursor deformation, so a
// contour's geometry never jumps the moment it starts reacting to the pointer.
// One decimal, but ~5x faster than toFixed - this runs on every deformed vertex,
// every frame, so the formatting cost is the hot path.
const r1 = (v) => Math.round(v * 10) / 10;

function pathFromFlat(a, n, closed) {
  const cnt = n >> 1;
  if (cnt < 2) return "";
  // wrap for closed rings, clamp at the ends for open lines
  const ix = closed
    ? (i) => (((i % cnt) + cnt) % cnt) << 1
    : (i) => (i < 0 ? 0 : i > cnt - 1 ? cnt - 1 : i) << 1;
  const out = [`M ${r1(a[0])} ${r1(a[1])}`];
  const last = closed ? cnt : cnt - 1;
  for (let i = 0; i < last; i++) {
    const i0 = ix(i - 1);
    const i1 = ix(i);
    const i2 = ix(i + 1);
    const i3 = ix(i + 2);
    const c1x = a[i1] + (a[i2] - a[i0]) / 6;
    const c1y = a[i1 + 1] + (a[i2 + 1] - a[i0 + 1]) / 6;
    const c2x = a[i2] - (a[i3] - a[i1]) / 6;
    const c2y = a[i2 + 1] - (a[i3 + 1] - a[i1 + 1]) / 6;
    out.push(`C ${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${r1(a[i2])} ${r1(a[i2 + 1])}`);
  }
  if (closed) out.push("Z");
  return out.join(" ");
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
  // A VERY fine grid, sampled by WORLD position (not grid index) times a fixed
  // frequency - so resolution controls only smoothness, never feature size. Many
  // sample points per loop => Catmull-Rom yields long, silky-continuous curves.
  // PERFORMANCE: this grid drives both the number of paths and the bezier count
  // per path. At 168x114 the field came out at ~970 paths / ~37k segments / 1.3MB
  // of path data - enough to stall low-end phones on load and make every scroll
  // frame re-rasterize a huge vector layer. Coarser sampling still looks smooth
  // (the quintic noise is what makes the curves silky, not the sample count).
  const COLS = 104;
  const ROWS = 70;
  const x0 = -PAD;
  const y0 = -PAD;
  const cw = (VW + PAD * 2) / COLS;
  const ch = (VH + PAD * 2) / ROWS;
  // Feature frequency in cycles-per-pixel; isotropic (same on both axes) so blobs
  // read round. Tuned to keep the previous blob size regardless of grid density.
  const K = 0.0105;

  // Height field on grid nodes (world-position sampling).
  const V = [];
  for (let gy = 0; gy <= ROWS; gy++) {
    const row = [];
    const wy = (y0 + gy * ch) * K;
    for (let gx = 0; gx <= COLS; gx++) row.push(fbm((x0 + gx * cw) * K, wy));
    V.push(row);
  }

  // Many, closely-spaced elevation levels - tighter contour spacing fills the
  // field so there is little empty white space between rings.
  const thresholds = [];
  // Range reaches further into the elevation extremes than the field's usual
  // span, so the flat peak/basin interiors pick up a few inner rings instead of
  // reading as empty circles - spacing between levels stays the same.
  for (let t = 0.16; t <= 0.88; t += 0.048) thresholds.push(Number(t.toFixed(3)));

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
      // Drop specks: tiny fragments cost a DOM node, a path string and a layer
      // contribution each, but read as noise rather than terrain.
      if (line.length < 9) continue;
      if (closed && line.length > 2) line.pop(); // drop duplicated closing point
      // Flat coords + bounding box: the pointer effect deforms these vertices
      // individually, so every contour reacts and none ever slides as a slab.
      const n = line.length * 2;
      const pts = new Float64Array(n);
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let k = 0; k < line.length; k++) {
        const px = line[k][0];
        const py = line[k][1];
        pts[k * 2] = px;
        pts[k * 2 + 1] = py;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      const d = pathFromFlat(pts, n, closed);
      if (!d) continue;
      bands[ti % 3].push({ d, ti, pts, n, closed, minX, minY, maxX, maxY });
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
    const lines = Array.from(root.querySelectorAll(".topo__line"));
    let tl;
    let safety;

    // Budget check. The stroke-draw intro calls getTotalLength() on EVERY path,
    // which is a synchronous geometry pass - measured at ~75ms for ~970 paths on
    // a desktop, i.e. seconds of frozen main thread on a low-end phone. Likewise
    // the scroll parallax transforms the whole contour group, forcing the browser
    // to re-rasterize a very large vector layer on every scroll frame. Both are
    // luxuries: skip them unless the device can clearly afford it.
    const cores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
    const mem = typeof navigator.deviceMemory === "number" ? navigator.deviceMemory : 8;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowPower = cores <= 4 || mem <= 4 || coarse;
    const canAffordDraw = !reduce && !lowPower && lines.length <= 600;
    const play = introForThisLoad() && canAffordDraw;

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
    } else if (!reduce && introForThisLoad()) {
      // Same "arrival" beat for a fraction of the cost: fade the finished field in
      // (compositor-only) instead of stroking ~1000 paths.
      forceRest();
      group.style.opacity = "0";
      tl = createTimeline();
      tl.add(group, { opacity: [0, 1], duration: 700, ease: "out(2)" }, 0);
    } else {
      forceRest();
    }

    // NO scroll parallax, on any device. It used to drift and scale this group as
    // you scrolled, but `scale` on live vector art cannot be composited - the
    // browser has to re-rasterize every path each frame to keep the strokes crisp
    // (~13k bezier segments here). That was the single biggest cause of scroll
    // jank, and it is a decorative effect, so it is simply gone.

    // LOCALIZED cursor spread, applied PER VERTEX. Each contour's points are pushed
    // outward from the pointer with a smooth falloff and the curve is re-emitted, so
    // the line bends open under the cursor like elastic terrain. Because the geometry
    // itself deforms (rather than whole paths translating), every contour responds -
    // including long sprawling ones, which now bend only where the cursor is near.
    const svgEl = root.querySelector(".topo__svg");
    const paths = Array.from(root.querySelectorAll(".topo__line"));
    const data = bands.flat(); // same order as the rendered paths
    // Touch gets the same effect, with a tighter radius: fewer contours to
    // re-emit per frame keeps a finger drag smooth on phone-class hardware.
    const R = coarse ? 130 : 190;   // influence radius, in viewBox units
    const R2 = R * R;
    const PUSH = coarse ? 24 : 30;  // max outward displacement at the pointer
    const scratch = new Float64Array(data.reduce((m, it) => Math.max(m, it.n), 0));
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
      const mx = mouse.x;
      const my = mouse.y;
      const next = new Set();
      for (let i = 0; i < data.length; i++) {
        const it = data[i];
        // Cheap reject: cursor's influence circle can't reach this contour's box.
        if (mx < it.minX - R || mx > it.maxX + R || my < it.minY - R || my > it.maxY + R) continue;
        const pts = it.pts;
        const n = it.n;
        let touched = false;
        for (let k = 0; k < n; k += 2) {
          const px = pts[k];
          const py = pts[k + 1];
          const dx = px - mx;
          const dy = py - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 0.0001;
            const t = 1 - d / R;              // 1 at cursor → 0 at the radius
            const amt = (PUSH * t * t) / d;   // smooth, vanishes at the rim
            scratch[k] = px + dx * amt;
            scratch[k + 1] = py + dy * amt;
            touched = true;
          } else {
            scratch[k] = px;
            scratch[k + 1] = py;
          }
        }
        if (touched) {
          paths[i].setAttribute("d", pathFromFlat(scratch, n, it.closed));
          next.add(i);
        }
      }
      // Restore anything that just left the cursor's reach to its original curve.
      active.forEach((i) => { if (!next.has(i)) paths[i].setAttribute("d", data[i].d); });
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
      active.forEach((i) => { paths[i].setAttribute("d", data[i].d); });
      active.clear();
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      mouse.primed = false;
    };
    // Pointer Events cover mouse, pen and touch, so a finger drag deforms the
    // terrain exactly like a cursor does. Touch also gets pointerup/cancel as the
    // "left" signal, since there is no hover state to leave.
    // Deformation re-emits path `d` strings every frame, so it is off on devices
    // that were already struggling (few cores / little RAM). Capable touch devices
    // still get it - only genuinely weak hardware is excluded.
    const canAffordDeform = !reduce && cores > 4 && mem > 4;
    if (canAffordDeform) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("pointerup", onLeave, { passive: true });
      window.addEventListener("pointercancel", onLeave, { passive: true });
    }

    return () => {
      window.clearTimeout(safety);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onLeave);
      window.removeEventListener("pointercancel", onLeave);
      if (raf) cancelAnimationFrame(raf);
      if (tl && typeof tl.revert === "function") tl.revert();
      else if (tl && typeof tl.pause === "function") tl.pause();
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
                <path className="topo__line" key={i} d={p.d} />
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
