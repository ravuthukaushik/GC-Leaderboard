// The leaderboard is deployed separately (Vercel) from the main Sustainability
// Cell site (IITB gymkhana container), so the lockup is an absolute link back
// rather than a router link - there is no shared route tree between them.
const MAIN_SITE_URL = "https://gymkhana.iitb.ac.in/~sustainabilitycell/";

export default function AppLogo() {
  return (
    <a
      href={MAIN_SITE_URL}
      className="brand-lockup"
      aria-label="Sustainability Cell, IIT Bombay - back to the main site"
    >
      <img src="/suslogo-real.png" alt="" className="brand-image" />
      <span className="brand-text">
        <span className="brand-title">Sustainability Cell</span>
        <span className="brand-sub">IIT Bombay</span>
      </span>
    </a>
  );
}
