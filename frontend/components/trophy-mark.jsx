/* Flat vector trophy - a classic loving cup on a dark plinth, drawn to match the
   reference artwork (two-tone gold with a single left highlight, curled handles,
   knopped stem, gold nameplate). Transparent background, no drop shadow, so it
   sits cleanly on the paper/contour surface. */

export default function TrophyMark({ size = 30, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={(size * 104) / 88}
      viewBox="0 0 88 104"
      fill="none"
      role="img"
      aria-label="Trophy"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* handles (behind the bowl) */}
      <g stroke="#DFAA44" strokeWidth="5.5" strokeLinecap="round" fill="none">
        <path d="M21 13C9 12 3 23 7.5 31.5c2.4 4.5 7 6.4 10.6 5.4" />
        <path d="M67 13c12-1 18 10 13.5 18.5-2.4 4.5-7 6.4-10.6 5.4" />
      </g>
      {/* handle curls */}
      <g stroke="#C8942F" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M18.1 36.9c-2.6.8-4.6-.8-4.3-3.1" />
        <path d="M69.9 36.9c2.6.8 4.6-.8 4.3-3.1" />
      </g>

      {/* bowl */}
      <path
        d="M19 9h50v10c0 21.5-10.6 34-25 34S19 40.5 19 19V9z"
        fill="#DFAA44"
      />
      {/* left highlight */}
      <path
        d="M25.5 9h8v10c0 14 1.8 24.5 6 31.6-8.2-3.6-14-13.9-14-31.6V9z"
        fill="#EEC55F"
      />
      {/* right shade */}
      <path d="M63.5 9H69v10c0 15.6-5.6 26.4-14 31.4 5.6-7.4 8.5-18 8.5-31.4V9z" fill="#C8942F" />
      {/* rim */}
      <rect x="19" y="9" width="50" height="3.4" fill="#EEC55F" />

      {/* stem: knop + column + flared foot */}
      <path d="M38.5 52h11c-.4 4.2-1.6 6.6-1.6 9.2h-7.8c0-2.6-1.2-5-1.6-9.2z" fill="#D9A441" />
      <ellipse cx="44" cy="60.5" rx="6.4" ry="4.2" fill="#DFAA44" />
      <ellipse cx="41.7" cy="60.5" rx="2.1" ry="3.4" fill="#EEC55F" />
      <rect x="41" y="63.5" width="6" height="10.5" fill="#D9A441" />
      <rect x="41" y="63.5" width="2.2" height="10.5" fill="#EEC55F" />
      <path d="M35.5 74h17l2.6 6.5H32.9L35.5 74z" fill="#DFAA44" />

      {/* plinth */}
      <rect x="26" y="80.5" width="36" height="14.5" rx="2.4" fill="#2F3640" />
      <path d="M28.4 80.5h9.8l-4 4.6h-8.2v-2.2a2.4 2.4 0 0 1 2.4-2.4z" fill="#3C4550" />
      <rect x="32" y="84.4" width="24" height="8.6" rx="1.6" fill="#DFAA44" />
      <path d="M33.6 84.4h20.2c-3 3.4-11.6 5.4-21.8 4.9v-3.3a1.6 1.6 0 0 1 1.6-1.6z" fill="#EEC55F" />
      {/* base bar */}
      <rect x="21.5" y="95" width="45" height="6.5" rx="2.2" fill="#262C34" />
    </svg>
  );
}
