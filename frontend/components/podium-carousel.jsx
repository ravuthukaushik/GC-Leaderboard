"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import RibbonMedal from "@/components/ribbon-medal";

function PodiumColumn({ hostel }) {
  const rank = hostel.rank;
  return (
    <li className={`gcp__col gcp__col--${rank}`} data-rank={rank}>
      {rank === 1 ? <span className="gcp__spotlight" aria-hidden="true" /> : null}

      <article className="gcp__card" data-card>
        <span className="gcp__seal">
          <RibbonMedal rank={rank} size={rank === 1 ? 72 : 62} />
        </span>

        <p className="gcp__name">{hostel.name}</p>

        <p className="gcp__score">
          <span className="gcp__num" data-count={hostel.totalScore}>
            {Number(hostel.totalScore).toFixed(1)}
          </span>
          <span className="gcp__unit">pts</span>
        </p>
      </article>

      <div className="gcp__stand">
        <span className="gcp__stand-num">{rank}</span>
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

    const partsOf = (col) => [col.querySelector(".gcp__seal"), col.querySelector(".gcp__score")];

    // Final resting state - reduced motion, the safety net, and cleanup, so the
    // podium can never be stranded mid-choreography.
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
      // No stack/slide - a quiet fade, still on scroll-in.
      gsap.set([intro, ...cols], { opacity: 0 });
      if (spot) gsap.set(spot, { opacity: 0 });
      nums.forEach((n) => { n.textContent = (parseFloat(n.dataset.count) || 0).toFixed(1); });
      tl = gsap.timeline({ paused: true });
      tl.to([intro, ...cols], { opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
      if (spot) tl.to(spot, { opacity: 1, duration: 0.5 }, 0);
    } else {
      // Initial state: headline + cards hidden; #2/#3 stacked behind #1; #1 sunk
      // low so it rises "up out of the cup" when the reveal fires.
      const champCentre = champ.offsetLeft + champ.offsetWidth / 2;
      wings.forEach((w) => { w.__dx = champCentre - (w.offsetLeft + w.offsetWidth / 2); });

      gsap.set(cols, { transformOrigin: "50% 100%" });
      gsap.set(intro, { opacity: 0, y: 18 });
      gsap.set(champ, { opacity: 0, y: 84, scale: 0.8, zIndex: 3 });
      wings.forEach((w) => gsap.set(w, { opacity: 0, x: w.__dx, y: 10, scale: 0.8, zIndex: 1 }));
      wings.forEach((w) => gsap.set(partsOf(w), { opacity: 0, y: 10 }));
      if (spot) gsap.set(spot, { opacity: 0, scale: 0.55, transformOrigin: "50% 50%" });
      nums.forEach((n) => { n.textContent = "0.0"; });

      tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      // headline in
      tl.to(intro, { opacity: 1, y: 0, duration: 0.6 }, 0);
      // 1 · champion rises up out of the cup; spotlight blooms; points count up
      tl.to(champ, { opacity: 1, y: 0, scale: 1, duration: 0.85 }, 0.1);
      if (spot) tl.to(spot, { opacity: 1, scale: 1, duration: 1.05, ease: "power2.out" }, 0.15);
      countUp(champ, tl, 0.35);
      // 2 · #2 and #3 deal out from behind #1 WHILE its number is still counting
      const wingAt = 0.8;
      wings.forEach((w) => {
        tl.to(w, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.62 }, wingAt);
      });
      // 3 · a beat later, their medals + scores settle in
      wings.forEach((w) => {
        tl.to(partsOf(w), { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" }, wingAt + 0.5);
        countUp(w, tl, wingAt + 0.55);
      });
    }

    // Play when the podium actually becomes visible - an IntersectionObserver is
    // reliable regardless of the tall pinned hero above it (no scroll-position
    // math to get wrong), so #1 rises just as you arrive out of the cup portal.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          tl.play();
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(root);

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

    // Safety: if the podium is already on screen but the trigger/ticker never
    // fired the play, reveal it so it can't be stranded hidden.
    const safety = window.setTimeout(() => {
      if (tl.progress() === 0) {
        const r = root.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.95) tl.play();
      }
    }, 4000);
    tl.eventCallback("onComplete", () => window.clearTimeout(safety));

    return () => {
      window.clearTimeout(safety);
      io.disconnect();
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
