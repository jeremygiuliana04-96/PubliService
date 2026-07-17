function StatCard({ icon, value, label, tone = 'blue', onClick }) {
  return (
    <button className={`stat-card stat-card--${tone}`} type="button" onClick={onClick}>
      <span className="stat-card__icon">{icon}</span>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__label">{label}</span>
    </button>
  )
}
export default StatCard

