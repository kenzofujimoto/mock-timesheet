import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Analytics() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalHours, setTotalHours] = useState(0)
  const [filters, setFilters] = useState({
    startDate: '2026-03-01',
    endDate: '2026-04-30',
    contract: '',
    service: '',
    activity: '',
  })

  // VULN: IDOR — URL param user_id allows viewing ANY user's data
  const targetUserId = searchParams.get('user_id') || user?.id

  useEffect(() => {
    fetchLogs()
  }, [targetUserId])

  const fetchLogs = async () => {
    setLoading(true)

    // VULN: No authorization check — fetches data for ANY user_id passed via URL
    const { data, error } = await supabase
      .from('analytics_logs')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('log_date', filters.startDate)
      .lte('log_date', filters.endDate)
      .order('log_date', { ascending: true })

    if (!error && data) {
      setLogs(data)
      setTotalHours(data.reduce((sum, l) => sum + Number(l.hours || 0), 0))
    }
    setLoading(false)
  }

  // VULN: SQL Injection via Supabase RPC function
  const handleSearch = async () => {
    setLoading(true)
    const searchTerm = filters.contract || filters.service || filters.activity

    if (searchTerm) {
      // Uses the vulnerable RPC function that concatenates strings
      const { data, error } = await supabase.rpc('search_entries', {
        search_term: searchTerm  // VULN: this goes directly into SQL concatenation
      })

      if (!error && data) {
        setLogs(data)
        setTotalHours(data.reduce((sum, l) => sum + Number(l.hours || 0), 0))
      }
    } else {
      await fetchLogs()
    }
    setLoading(false)
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="section-title">Conferência Analítica de Horas</h2>
          <p className="section-subtitle">Consulte e exporte seus lançamentos detalhados por período.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary">
            <span className="material-symbols-outlined">file_download</span>
            Exportar Excel
          </button>
          <button className="btn btn-outline">
            <span className="material-symbols-outlined">print</span>
          </button>
        </div>
      </div>

      {/* VULN indicator for IDOR */}
      {targetUserId !== user?.id && (
        <div style={{ padding: '0.5rem 1rem', background: '#fef2f2', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem', color: '#dc2626' }}>
          ⚠️ Visualizando dados do usuário: <code>{targetUserId}</code>
        </div>
      )}

      <div className="filter-card">
        <div className="filter-header">
          <span className="material-symbols-outlined">filter_list</span>
          <span>Filtros</span>
        </div>
        <div className="filter-body">
          <div className="filter-grid">
            <div className="form-group">
              <label className="form-label">Período <span className="required">*</span></label>
              <div className="date-range">
                <input type="date" className="form-input" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
                <span className="date-separator">até</span>
                <input type="date" className="form-input" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Contrato</label>
              <input type="text" className="form-input" placeholder="Buscar contrato..." value={filters.contract} onChange={e => handleFilterChange('contract', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Serviço</label>
              <input type="text" className="form-input" placeholder="Buscar serviço..." value={filters.service} onChange={e => handleFilterChange('service', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Atividade</label>
              <input type="text" className="form-input" placeholder="Buscar atividade..." value={filters.activity} onChange={e => handleFilterChange('activity', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="filter-footer">
          <button className="btn btn-primary" onClick={handleSearch}>
            <span className="material-symbols-outlined">search</span>
            Buscar
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Documento</th>
                <th>Contrato</th>
                <th>Serviço</th>
                <th>Atividade</th>
                <th>Histórico</th>
                <th className="text-center">Início</th>
                <th className="text-center">Fim</th>
                <th className="text-center">Horas</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Nenhum registro encontrado</td></tr>
              ) : logs.map((log, i) => (
                <tr key={log.id} style={i % 2 === 1 ? { background: 'var(--color-surface-subtle)' } : {}}>
                  <td style={{ color: 'var(--color-text)' }}>{log.log_date}</td>
                  <td>{log.document}</td>
                  <td>{log.contract}</td>
                  <td>{log.service}</td>
                  <td>{log.activity}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.description}</td>
                  <td className="text-center">{log.start_time?.slice(0,5)}</td>
                  <td className="text-center">{log.end_time?.slice(0,5)}</td>
                  <td className="text-center" style={{ fontWeight: 700 }}>{Number(log.hours).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            {logs.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="8" className="text-right"><strong>Total Geral:</strong></td>
                  <td className="text-center"><strong>{totalHours.toFixed(1)}</strong></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
