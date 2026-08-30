"use client";

/* Trophy Hero decider - picks the renderer for the device, then hands off.
   • prefers-reduced-motion → flat SVG hero in its static (assembled) state.
   • low-power / mobile / no-WebGL → flat SVG scroll-scrub dismantle (never ship a
     janky WebGL scene to a mid-range phone).
   • otherwise → real 3D three.js hero (rotate → dismantle → portal → reveal).
   SVG renders first (SSR-safe, no hydration mismatch); we upgrade to 3D on the
   client after a capability check, so there's never a blank/broken hero. */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import TrophyHeroSVG from "@/components/trophy-hero-svg";
import PodiumCarousel from "@/components/podium-carousel";

const TrophyHero3D = dynamic(() => import("@/components/trophy-hero-3d"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

function isLowPower() {
  const ua = navigator.userAgent || "";
  const mobileUA = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(ua);
  const smallCoarse = window.matchMedia("(max-width: 820px)").matches && window.matchMedia("(pointer: coarse)").matches;
  const fewCores = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
  const lowMem = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4;
  return mobileUA || smallCoarse || fewCores || lowMem;
}

export default function TrophyHero({ top3 = [] }) {
  // null = not decided yet. We must not render EITHER hero before the client-side
  // capability check, or the SVG cup flashes for a frame before the 3D one mounts.
  const [mode, setMode] = useState(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(!reduce && !isLowPower() && hasWebGL() ? "three" : "svg");
  }, []);

  // Undecided (SSR + first paint): a blank spacer, so nothing wrong flashes.
  if (mode === null) return <section className="tphero-placeholder" aria-hidden="true" />;

  // 3D hero owns the podium (it rises out of the cup). The flat fallback shows the
  // SVG dismantle followed by the normal podium below it.
  if (mode === "three") return <TrophyHero3D top3={top3} />;
  return (
    <>
      <TrophyHeroSVG />
      <PodiumCarousel top3={top3} />
    </>
  );
}
