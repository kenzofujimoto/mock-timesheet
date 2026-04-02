import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import Badge from '../components/Badge'

export default function Requests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [form, setForm] = useState({
    request_date: new Date().toISOString().slice(0, 10),
    request_type: 'overtime',
    start_time: '',
    end_time: '',
    justification: '',
  })
  const [submitMsg, setSubmitMsg] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [user])

  const fetchRequests = async () => {
    // VULN: no proper authorization — see all requests, not just user's
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRequests(data)
      setStats({
        pending: data.filter(r => r.status === 'pending').reduce((s, r) => {
          if (r.start_time && r.end_time) {
            const [sh, sm] = r.start_time.split(':').map(Number)
            const [eh, em] = r.end_time.split(':').map(Number)
            return s + ((eh * 60 + em) - (sh * 60 + sm)) / 60
          }
          return s
        }, 0),
        approved: data.filter(r => r.status === 'approved').length,
        rejected: data.filter(r => r.status === 'rejected').length,
      })
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    // VULN: Missing Input Validation — no server-side validation at all
    // VULN: No CSRF token
    const { error } = await supabase
      .from('requests')
      .insert({
        user_id: user.id,
        request_type: form.request_type,
        request_date: form.request_date,
        start_time: form.start_time ? form.start_time + ':00' : null,
        end_time: form.end_time ? form.end_time + ':00' : null,
        justification: form.justification,  // VULN: Stored XSS — no sanitization
        status: 'pending',
      })

    if (!error) {
      setSubmitMsg('Solicitação enviada com sucesso!')
      setForm({ request_date: new Date().toISOString().slice(0, 10), request_type: 'overtime', start_time: '', end_time: '', justification: '' })
      fetchRequests()
      setTimeout(() => setSubmitMsg(''), 3000)
    }
  }

  const typeLabel = {
    overtime: 'Hora Extra',
    adjustment: 'Ajuste de Ponto',
    correction: 'Correção',
    retroactive: 'Retroativo',
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="section-title">Solicitações de Ajuste e Hora Extra</h2>
          <p className="section-subtitle">Envie solicitações de ajuste de ponto e hora extra para aprovação.</p>
        </div>
      </div>

      <div className="requests-layout">
        {/* New Request Form */}
        <div className="request-form-card">
          <div className="card-header-alt">
            <h3 className="card-header-title">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>add_circle_outline</span>
              Nova Solicitação
            </h3>
            <p className="card-header-desc">Envie horas extras ou ajustes para aprovação.</p>
          </div>

          <div className="request-form">
            {submitMsg && (
              <div style={{ padding: '0.75rem', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: '8px', fontSize: '0.875rem' }}>
                ✓ {submitMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Data da Solicitação</label>
              <div className="input-with-icon">
                <span className="material-symbols-outlined input-icon">calendar_today</span>
                <input type="date" className="form-input" value={form.request_date} onChange={e => setForm(f => ({ ...f, request_date: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-input" value={form.request_type} onChange={e => setForm(f => ({ ...f, request_type: e.target.value }))}>
                <option value="overtime">Hora Extra</option>
                <option value="adjustment">Ajuste de Ponto</option>
                <option value="correction">Correção de Timesheet</option>
                <option value="retroactive">Lançamento Retroativo</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Início</label>
                <input type="time" className="form-input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fim</label>
                <input type="time" className="form-input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Justificativa</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Motivo da hora extra ou ajuste..."
                rows="4"
                value={form.justification}
                onChange={e => setForm(f => ({ ...f, justification: e.target.value }))}
              />
            </div>

            <button className="btn btn-primary btn-full" onClick={handleSubmit}>
              Enviar Solicitação
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="requests-right">
          <div className="request-stats-grid">
            <div className="request-stat-card">
              <div className="req-stat-icon icon-blue">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <p className="req-stat-label">Horas Pendentes</p>
                <p className="req-stat-value">{stats.pending.toFixed(1)}</p>
              </div>
            </div>
            <div className="request-stat-card">
              <div className="req-stat-icon icon-green">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p className="req-stat-label">Aprovadas</p>
                <p className="req-stat-value">{stats.approved}</p>
              </div>
            </div>
            <div className="request-stat-card">
              <div className="req-stat-icon icon-red">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <div>
                <p className="req-stat-label">Rejeitadas</p>
                <p className="req-stat-value">{stats.rejected}</p>
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-header">
              <h3 className="table-title">Solicitações Recentes</h3>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    {/* VULN: Stored XSS — justification rendered as raw HTML */}
                    <th>Justificativa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Nenhuma solicitação</td></tr>
                  ) : requests.map(req => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 500 }}>{req.request_date}</td>
                      <td>{typeLabel[req.request_type] || req.request_type}</td>
                      {/* VULN: Stored XSS — rendering user input as HTML */}
                      <td
                        style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        dangerouslySetInnerHTML={{ __html: req.justification || '' }}
                      />
                      <td><Badge status={req.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
