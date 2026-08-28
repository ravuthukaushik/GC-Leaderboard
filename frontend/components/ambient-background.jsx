"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

// A background you feel, not see: a few large, heavily-blurred sage/gold/cream
// washes at ~5% opacity drifting on a slow (60–90s) loop. Pauses when the tab is
// hidden; disabled entirely under prefers-reduced-motion.
export default function AmbientBackground() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const blobs = gsap.utils.toArray(root.querySelectorAll(".ambient-blob"));
    const tweens = [];
    const ctx = gsap.context(() => {
      blobs.forEach((b, i) => {
        tweens.push(
          gsap.to(b, {
            xPercent: gsap.utils.random(-14, 14),
            yPercent: gsap.utils.random(-14, 14),
            scale: gsap.utils.random(1.06, 1.22),
            duration: gsap.utils.random(60, 90),
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: i * -9
          })
        );
      });
    }, root);

    // Low-CPU: hard-pause the drift while the tab is backgrounded.
    const onVisibility = () => {
      const paused = document.hidden;
      tweens.forEach((t) => t.paused(paused));
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={ref} className="ambient-bg" aria-hidden="true">
      <span className="ambient-blob ambient-blob--1" />
      <span className="ambient-blob ambient-blob--2" />
      <span className="ambient-blob ambient-blob--3" />
    </div>
  );
}
