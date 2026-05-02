function StatCard({ title, value, subtitle }) {
  return (
    // Reusable metric card for dashboard summary numbers.
    <div className="panel stat">
      <h3 className="stat-title">{title}</h3>
      {subtitle ? <p className="stat-subtitle">{subtitle}</p> : null}
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default StatCard;
