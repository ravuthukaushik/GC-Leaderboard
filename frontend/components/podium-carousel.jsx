"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import PodiumMedal from "@/components/podium-medal";

// Two-letter monogram from a hostel name (e.g. "Hostel 5" → "H5").
function monogram(name) {
  const compact = String(name).replace("Hostel", "H").replace(/\s+/g, "");
  return compact.slice(0, 3).toUpperCase();
}

function PodiumColumn({ hostel }) {
  const rank = hostel.rank;
  return (
    <li className={`gcp__col gcp__col--${rank}`} data-rank={rank}>
      {rank === 1 ? <span className="gcp__spotlight" aria-hidden="true" /> : null}

      <article className="gcp__card" data-card>
        <span className="gcp__medal">
          <PodiumMedal rank={rank} size={rank === 1 ? 58 : 48} />
        </span>

        <span className="gcp__avatar">
          {hostel.image ? <img src={hostel.image} alt="" /> : <span aria-hidden="true">{monogram(hostel.name)}</span>}
        </span>

        <p className="gcp__name">{hostel.name}</p>

        <p className="gcp__score">
          <span className="gcp__num" data-count={hostel.totalScore}>
            {Number(hostel.totalScore).toFixed(1)}
          </span>
          <span className="gcp__unit">pts</span>
        </p>
      </article>

      <div className="gcp__plinth">
        <span className="gcp__place">{rank}</span>
      </div>
    </li>
  );
}

export default function PodiumCarousel({ top3 }) {
  const rootRef = useRef(null);

  // Classic centre-tallest arrangement in the DOM: 2nd · 1st · 3rd.
  const ordered = [
    top3.find((entry) => entry.rank === 2),
    top3.find((entry) => entry.rank === 1),
    top3.find((entry) => entry.rank === 3)
  ].filter(Boolean);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cols = gsap.utils.toArray(root.querySelectorAll(".gcp__col"));
    const nums = root.querySelectorAll("[data-count]");
    const intro = root.querySelector(".gcp__intro");
    const spot = root.querySelector(".gcp__spotlight");
    const byRank = Object.fromEntries(cols.map((c) => [c.dataset.rank, c]));
    const champ = byRank["1"];
    const wings = [byRank["2"], byRank["3"]].filter(Boolean);

    const partsOf = (col) => [col.querySelector(".gcp__medal"), col.querySelector(".gcp__score")];

    // Final resting state — used for reduced motion, the safety net, and cleanup,
    // so the podium can never be stranded mid-choreography.
    const settle = () => {
      gsap.set([intro, ...cols], { opacity: 1, x: 0, y: 0, scale: 1, clearProps: "transform" });
      cols.forEach((c) => gsap.set(partsOf(c), { opacity: 1, y: 0, clearProps: "transform" }));
      if (spot) gsap.set(spot, { opacity: 1, scale: 1 });
      nums.forEach((n) => { n.textContent = (parseFloat(n.dataset.count) || 0).toFixed(1); });
    };

    const countUp = (col, tl, at) => {
      const num = col.querySelector("[data-count]");
      if (!num) return;
      const proxy = { v: 0 };
      tl.to(proxy, {
        v: parseFloat(num.dataset.count) || 0,
        duration: 1.0,
        ease: "power2.out",
        snap: { v: 0.1 },
        onUpdate() { num.textContent = proxy.v.toFixed(1); }
      }, at);
    };

    let tl;

    if (reduce || !champ) {
      // No stack/slide — fade all three in together, no movement.
      gsap.set([intro, ...cols], { opacity: 0 });
      if (spot) gsap.set(spot, { opacity: 0 });
      nums.forEach((n) => { n.textContent = (parseFloat(n.dataset.count) || 0).toFixed(1); });
      tl = gsap.timeline();
      tl.to([intro, ...cols], { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
      if (spot) tl.to(spot, { opacity: 1, duration: 0.5 }, 0);
    } else {
      // Measure how far each wing must travel back to the champion's centre so it
      // can start stacked behind #1 and be "dealt out" to its flank.
      const champCentre = champ.offsetLeft + champ.offsetWidth / 2;
      wings.forEach((w) => { w.__dx = champCentre - (w.offsetLeft + w.offsetWidth / 2); });

      gsap.set(cols, { transformOrigin: "50% 100%" });
      gsap.set(champ, { opacity: 0, y: 34, scale: 0.9, zIndex: 3 });
      wings.forEach((w) => gsap.set(w, { opacity: 0, x: w.__dx, y: 6, scale: 0.82, zIndex: 1 }));
      wings.forEach((w) => gsap.set(partsOf(w), { opacity: 0, y: 10 }));
      if (spot) gsap.set(spot, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });
      nums.forEach((n) => { n.textContent = "0.0"; });

      tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      // Headline first.
      tl.from(intro, { opacity: 0, y: 24, duration: 0.9 }, 0);
      // 1 · champion rises + fades + scales; spotlight blooms; points count up.
      tl.to(champ, { opacity: 1, y: 0, scale: 1, duration: 0.7 }, 0.5);
      if (spot) tl.to(spot, { opacity: 1, scale: 1, duration: 0.95, ease: "power2.out" }, 0.5);
      countUp(champ, tl, 0.7);
      // 2 · the wings deal out from behind #1 to their flanks WHILE #1's points are
      // still counting up (the champion card has just landed, its number still loading).
      const wingAt = 1.15;
      wings.forEach((w) => {
        tl.to(w, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.62, ease: "power3.out" }, wingAt);
      });
      // 3 · a beat later, their medals + scores settle in as the card lands.
      wings.forEach((w) => {
        tl.to(partsOf(w), { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" }, wingAt + 0.5);
        countUp(w, tl, wingAt + 0.55);
      });
    }

    // Calm hover lift on each card.
    const hoverCleanups = cols.map((col) => {
      const card = col.querySelector("[data-card]");
      const move = gsap.quickTo(card, "y", { duration: 0.3, ease: "power3.out" });
      const scale = gsap.quickTo(card, "scale", { duration: 0.3, ease: "power3.out" });
      const enter = () => { move(-6); scale(1.012); };
      const leave = () => { move(0); scale(1); };
      col.addEventListener("pointerenter", enter);
      col.addEventListener("pointerleave", leave);
      return () => { col.removeEventListener("pointerenter", enter); col.removeEventListener("pointerleave", leave); };
    });

    // setTimeout fires even when the ticker is throttled — the podium can never
    // be left stranded mid-animation.
    const safety = window.setTimeout(() => {
      if (tl.progress() < 1) settle();
    }, 3400);
    tl.eventCallback("onComplete", () => window.clearTimeout(safety));

    return () => {
      window.clearTimeout(safety);
      tl.kill();
      hoverCleanups.forEach((fn) => fn());
      settle();
    };
  }, [top3]);

  return (
    <section className="gcp" aria-label="Top three hostels" ref={rootRef}>
      <header className="gcp__intro">
        <h1 className="gcp__title">
          The <em>Green Cup</em> podium
        </h1>
      </header>

      <ol className="gcp__stage">
        {ordered.map((hostel) => (
          <PodiumColumn key={hostel.hostelId} hostel={hostel} />
        ))}
      </ol>
    </section>
  );
}
