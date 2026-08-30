// Whether the cup intro film has already played on THIS page load.
// Module state: a real page load resets it (so the film replays on reload), but
// it survives component unmount/remount, so switching tabs never replays it.
let played = false;

export function hasIntroPlayed() {
  return played;
}

export function markIntroPlayed() {
  played = true;
}
