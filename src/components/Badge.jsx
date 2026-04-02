export default function Badge({ status }) {
  const cfg = {
    approved: { label: 'Aprovado', className: 'badge-success' },
    pending:  { label: 'Pendente', className: 'badge-warning' },
    tracking: { label: 'Registrando', className: 'badge-info' },
    scheduled:{ label: 'Agendado', className: 'badge-neutral' },
    rejected: { label: 'Rejeitado', className: 'badge-danger' },
  }
  const { label, className } = cfg[status] || cfg.pending
  return (
    <span className={`badge ${className}`}>
      <span className={`badge-dot ${status === 'tracking' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  )
}
