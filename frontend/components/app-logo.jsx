export default function AppLogo({ compact = false }) {
  return (
    <div className={compact ? "brand-lockup compact" : "brand-lockup"} aria-label="Sustainability Cell">
      <img
        src="/suslogo-real.png"
        alt="Sustainability Cell logo"
        className={compact ? "brand-image compact" : "brand-image"}
      />
      <span className="brand-title">Sustainability Cell, IIT Bombay</span>
    </div>
  );
}
