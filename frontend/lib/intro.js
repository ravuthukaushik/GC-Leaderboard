// First-load intro gate. Returns true exactly once per browser session so the
// full-page load choreography plays on the very first paint and never again on
// tab switches, route return, or refocus. A hard refresh (new session) replays.
let session = null; // null = undecided, true = this load owns the intro, false = already played

export function introForThisLoad() {
  if (session !== null) return session;
  if (typeof window === "undefined") return false; // never run the intro during SSR
  try {
    session = !sessionStorage.getItem("gc_intro_played");
    if (session) {
      sessionStorage.setItem("gc_intro_played", "1");
      // Once the choreography window has passed, stop treating this load as the
      // intro so a component that remounts (e.g. tab change) doesn't replay it.
      window.setTimeout(() => { session = false; }, 6000);
    }
  } catch {
    session = false;
  }
  return session;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
