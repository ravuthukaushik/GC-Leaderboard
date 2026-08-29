"use client";

/* =============================================================================
   Trophy Hero — a scroll-SCRUBBED dismantle (not autoplay).
   A bespoke faceted "Green Cup" award is built from independent SVG parts (base
   tiers, stem, knot, bowl facets, rim, handles, leaf finial). A single PAUSED
   anime.js timeline holds each part's fly-apart trajectory; a rAF-throttled
   scroll handler maps the sticky-pinned section's progress → tl.seek(progress).
   Scroll down → the cup comes apart and this year's podium (just below) is the
   payoff. prefers-reduced-motion: no pin, no scrub — assembled award + fade.

   Anti-slop notes: this is a green-and-brass FACETED (low-poly) form with a leaf
   finial, not a realistic gold-trophy clipart silhouette; medals elsewhere are a
   bespoke leaf crest, not the shiny-disc-on-ribbon look.
   ============================================================================ */

import { useLayoutEffect, useRef } from "react";
import { createTimeline } from "animejs";
import { prefersReducedMotion } from "@/lib/intro";

// Palette (muted, flat facets — no gloss gradients).
const SAGE = "#5E8B6E";
const BRAND = "#3D6B4F";
const BRAND_DEEP = "#2E5340";
const BRAND_DEEPER = "#244430";
const BRASS = "#B8904A";
const BRASS_HI = "#C9A227";
const BRASS_LO = "#9A7A38";
const EDGE = "rgba(30,33,29,0.16)";

// Per-part fly-apart trajectories. Focus ≈ bowl/stem centre (200,250): parts near
// it barely move; outer parts fly far. [selector, {tx,ty,rot}, startMs]
const PARTS = [
  [".tp-knot", { tx: 0, ty: 12, rot: 0 }, 0],
  [".tp-cup-l", { tx: -230, ty: -70, rot: -20 }, 0],
  [".tp-cup-r", { tx: 230, ty: -70, rot: 20 }, 0],
  [".tp-stem", { tx: -18, ty: 74, rot: -8 }, 30],
  [".tp-rim", { tx: 8, ty: -128, rot: 10 }, 40],
  [".tp-finial", { tx: -12, ty: -178, rot: -24 }, 70],
  [".tp-handle-l", { tx: -324, ty: -28, rot: -40 }, 70],
  [".tp-handle-r", { tx: 324, ty: -28, rot: 40 }, 70],
  [".tp-base1", { tx: 12, ty: 184, rot: 6 }, 120],
  [".tp-base2", { tx: -14, ty: 256, rot: -6 }, 170]
];

export default function TrophyHero() {
  const sectionRef = useRef(null);
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const root = rootRef.current;
    if (!section || !root) return undefined;

    const reduce = prefersReducedMotion();
    if (reduce) {
      // Static: assembled award, no pin, simple presence. The CSS static layout
      // (data-static) removes the tall spacer so there's no dead scroll.
      section.dataset.static = "true";
      return undefined;
    }

    const q = (sel) => root.querySelector(sel);
    const D = 1000;
    const tl = createTimeline({ autoplay: false });

    PARTS.forEach(([sel, v, pos]) => {
      if (!q(sel)) return;
      tl.add(
        sel,
        { translateX: v.tx, translateY: v.ty, rotate: v.rot, opacity: [1, 1, 0], duration: D, ease: "inOut(2)" },
        pos
      );
    });
    // Copy: headline drifts up + dims; the "scroll" cue hands off to the podium cue.
    tl.add(".tphero__copy", { translateY: [0, -26], opacity: [1, 0.7], duration: D, ease: "inOut(2)" }, 0);
    tl.add(".tphero__cue", { opacity: [1, 0], translateY: [0, -8], duration: 460, ease: "out(2)" }, 0);
    tl.add(".tphero__reveal", { opacity: [0, 1], translateY: [12, 0], duration: 520, ease: "out(2)" }, 640);
    tl.pause();

    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      tl.seek(tl.duration * p);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    // Capture-phase so it fires no matter which element is the scroll container
    // (scroll doesn't bubble; capture still reaches window first). Progress is
    // computed from getBoundingClientRect, so it's scroller-agnostic.
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    update(); // set initial (assembled) state

    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
      tl.pause();
    };
  }, []);

  return (
    <section className="tphero" ref={sectionRef} aria-label="The Green Cup">
      <div className="tphero__sticky">
        <div className="tphero__inner" ref={rootRef}>
          <div className="tphero__copy">
            <p className="tphero__eyebrow">Sustainability Cell · IIT Bombay</p>
            <h1 className="tphero__title">
              The <em>Green Cup</em>
            </h1>
          </div>

          <svg
            className="tphero__trophy"
            viewBox="0 0 400 480"
            role="img"
            aria-label="The Green Cup award"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g stroke={EDGE} strokeWidth="1" strokeLinejoin="round">
              {/* ── base tier 2 (widest, bottom) ── */}
              <g className="tp-part tp-base2">
                <polygon points="146,362 254,362 272,404 128,404" fill={BRASS_LO} />
                <polygon points="146,362 254,362 246,374 154,374" fill={BRASS} />
              </g>

              {/* ── base tier 1 (upper plinth) ── */}
              <g className="tp-part tp-base1">
                <polygon points="162,324 238,324 250,360 150,360" fill={BRASS} />
                <polygon points="162,324 238,324 232,338 168,338" fill={BRASS_HI} />
              </g>

              {/* ── stem ── */}
              <g className="tp-part tp-stem">
                <polygon points="190,264 200,264 200,322 184,322" fill={BRAND_DEEP} />
                <polygon points="200,264 210,264 216,322 200,322" fill={BRAND_DEEPER} />
              </g>

              {/* ── knot (joint) ── */}
              <g className="tp-part tp-knot">
                <polygon points="200,240 214,252 200,264 186,252" fill={BRASS} />
              </g>

              {/* ── handles ── */}
              <g className="tp-part tp-handle-l">
                <path d="M134 140 C 96 138, 88 186, 126 206" fill="none" stroke={BRASS} strokeWidth="12" strokeLinecap="round" />
              </g>
              <g className="tp-part tp-handle-r">
                <path d="M266 140 C 304 138, 312 186, 274 206" fill="none" stroke={BRASS} strokeWidth="12" strokeLinecap="round" />
              </g>

              {/* ── bowl: left facets ── */}
              <g className="tp-part tp-cup-l">
                <polygon points="118,120 200,120 200,250" fill={SAGE} />
                <polygon points="118,120 200,250 176,250" fill={BRAND} />
              </g>
              {/* ── bowl: right facets ── */}
              <g className="tp-part tp-cup-r">
                <polygon points="282,120 200,120 200,250" fill={SAGE} />
                <polygon points="282,120 200,250 224,250" fill={BRAND} />
              </g>

              {/* ── rim lip ── */}
              <g className="tp-part tp-rim">
                <polygon points="120,110 280,110 286,124 114,124" fill={BRASS_HI} />
              </g>

              {/* ── leaf finial ── */}
              <g className="tp-part tp-finial">
                <path d="M200 40 C 186 54, 182 72, 200 104 L 200 40 Z" fill={BRAND_DEEP} />
                <path d="M200 40 C 214 54, 218 72, 200 104 L 200 40 Z" fill={SAGE} />
                <path d="M200 104 L 200 118" stroke={BRAND_DEEP} strokeWidth="4" strokeLinecap="round" />
              </g>
            </g>
          </svg>

          <p className="tphero__cue">Scroll — the cup comes apart</p>
          <p className="tphero__reveal" aria-hidden="true">This year&rsquo;s podium ↓</p>
        </div>
      </div>
    </section>
  );
}
