export default function AppLogo({ compact = false }) {
  return (
    <div className={compact ? "brand-lockup compact" : "brand-lockup"} aria-label="Sustainability Cell">
      <img
        src="/suslogo-real.png"
        alt="Sustainability Cell logo"
        className={compact ? "brand-image compact" : "brand-image"}
      />
      {compact ? (
        <div className="brand-copy">
          <strong>Green Cup</strong>
          <span>Sustainability Cell, IIT Bombay</span>
        </div>
      ) : (
        <div className="brand-copy">
          <strong>Green Cup</strong>
          <span>Sustainability Cell, IIT Bombay</span>
        </div>
      )}
    </div>
  );
}
