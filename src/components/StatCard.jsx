export default function StatCard({ icon, label, value, unit, meta, badge, badgeClass, progressPct, progressClass }) {
  return (
    <div className="stat-card">
      <div className="stat-watermark">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="stat-header">
        <h3 className="stat-label">{label}</h3>
        {badge && <span className={`stat-badge ${badgeClass}`}>{badge}</span>}
      </div>
      <div className="stat-body">
        <div className="stat-value">{value}{unit && <span className="stat-unit">{unit}</span>}</div>
        {meta && <div className="stat-meta">{meta}</div>}
      </div>
      {progressPct !== undefined && (
        <div className="stat-progress">
          <div className="progress-bar">
            <div className={`progress-fill ${progressClass || 'fill-primary'}`} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
