"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import chroma from "chroma-js";
import "@/components/BorderGlow.css";

export default function BorderGlow({
  children,
  className = "",
  borderRadius = 28,
  colors = ["#22C55E", "#3B82F6"],
  backgroundColor = "rgba(255,255,255,0.62)"
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const startColor = colors[0] || "#22C55E";
    const endColor = colors[colors.length - 1] || "#3B82F6";

    card.style.setProperty("--button-glow-start", startColor);
    card.style.setProperty("--button-glow-end", endColor);
    card.style.setProperty("--button-glow", startColor); // Initial fallback value

    const handlePointerMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Animate coordinate variables using GSAP
      gsap.to(card, {
        "--pointer-x": `${x}px`,
        "--pointer-y": `${y}px`,
        duration: 0.6,
        ease: "power2.out"
      });

      // Calculate mixed color using Chroma.js based on pointer X ratio
      const factor = Math.max(0, Math.min(1, x / rect.width));
      const mixedColor = chroma.mix(startColor, endColor, factor).hex();

      gsap.to(card, {
        "--button-glow": mixedColor,
        duration: 0.2,
        ease: "power1.out"
      });
    };

    card.addEventListener("pointermove", handlePointerMove);

    return () => {
      card.removeEventListener("pointermove", handlePointerMove);
    };
  }, [colors]);

  return (
    <div
      ref={cardRef}
      className={`border-glow-card ${className}`}
      style={{
        "--border-radius": `${borderRadius}px`,
        "--card-bg": backgroundColor
      }}
    >
      <div className="gradient" />
      <div className="border-glow-inner">{children}</div>
    </div>
  );
}
