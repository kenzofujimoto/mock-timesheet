import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'

const WEEKDAYS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']

export default function Dashboard() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ weeklyHours: 0, overtime: 0, pendingRequests: 0 })

  useEffect(() => {
    fetchEntries()
    fetchStats()
  }, [user])

  const fetchEntries = async () => {
    // VULN: IDOR — no server-side filtering by authenticated user
    // Anyone can change user_id to see other users' entries
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('entry_date', { ascending: false })
      .limit(7)

    if (!error && data) setEntries(data)
    setLoading(false)
  }

  const fetchStats = async () => {
    // Fetch all entries for current user (this week)
    const { data } = await supabase
      .from('time_entries')
      .select('total_hours, status')
      .eq('user_id', user?.id)

    if (data) {
      const weeklyHours = data.reduce((sum, e) => sum + Number(e.total_hours || 0), 0)
      const overtime = Math.max(0, weeklyHours - 40)
      setStats({ weeklyHours, overtime, pendingRequests: 1 })
    }

    // Also fetch pending requests count
    const { data: reqData } = await supabase
      .from('requests')
      .select('id')
      .eq('user_id', user?.id)
      .eq('status', 'pending')

    if (reqData) {
      setStats(prev => ({ ...prev, pendingRequests: reqData.length }))
    }
  }

  const formatTime = (t) => t ? t.slice(0, 5) : '--:--'

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDate()
    const month = d.toLocaleDateString('pt-BR', { month: 'short' })
    const year = d.getFullYear()
    return { day, dayName: WEEKDAYS[d.getDay()], full: `${day} ${month} ${year}` }
  }

  const isToday = (dateStr) => {
    const today = new Date().toISOString().slice(0, 10)
    return dateStr === today
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="section-title">Visão Geral Semanal</h2>
          <p className="section-subtitle">Gerencie suas horas, acompanhe extras e envie aprovações.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-outline">
            <span className="material-symbols-outlined">download</span>
            Exportar
          </button>
          <button className="btn btn-primary" onClick={() => window.location.href = '/timesheet'}>
            <span className="material-symbols-outlined">add</span>
            Registrar Ponto
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="timer"
          label="Horas Semanais"
          value={stats.weeklyHours.toFixed(0)}
          unit={`:${String(Math.round((stats.weeklyHours % 1) * 60)).padStart(2, '0')}`}
          meta="Meta: 40:00"
          badge="+2.5%"
          badgeClass="badge-success"
          progressPct={Math.min(100, (stats.weeklyHours / 40) * 100)}
          progressClass="fill-primary"
        />
        <StatCard
          icon="timelapse"
          label="Horas Extras"
          value={String(Math.floor(stats.overtime)).padStart(2, '0')}
          unit={`:${String(Math.round((stats.overtime % 1) * 60)).padStart(2, '0')}`}
          meta="Fator 1.5x"
          badge="Pendente"
          badgeClass="badge-warning"
          progressPct={Math.min(100, stats.overtime * 5)}
          progressClass="fill-warning"
        />
        <StatCard
          icon="fact_check"
          label="Aprovações"
          value={`${stats.pendingRequests}`}
          meta="Ações pendentes"
          badge="Ação Req."
          badgeClass="badge-purple"
          progressPct={33}
          progressClass="fill-purple"
        />
      </div>

      <div className="table-card">
        <div className="table-header">
          <div className="table-title-group">
            <span className="material-symbols-outlined table-title-icon">date_range</span>
            <h3 className="table-title">Lançamentos do Ponto</h3>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Entrada</th>
                <th>Saída Almoço</th>
                <th>Retorno</th>
                <th>Saída</th>
                <th className="text-right">Total</th>
                <th className="text-center">Status</th>
                {/* VULN: Note column renders HTML without sanitization */}
                <th>Obs.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Nenhum lançamento encontrado</td></tr>
              ) : entries.map(entry => {
                const today = isToday(entry.entry_date)
                const { day, dayName, full } = formatDate(entry.entry_date)
                return (
                  <tr key={entry.id} className={today ? 'row-today' : ''}>
                    <td>
                      <div className="date-cell">
                        <div className={`day-number ${today ? 'today' : ''}`}>{day}</div>
                        <div className="date-info">
                          <span className="day-name">
                            {dayName}
                            {today && <span className="today-tag">Hoje</span>}
                          </span>
                          <span className="day-full">{full}</span>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono">{formatTime(entry.check_in)}</td>
                    <td className="font-mono">{formatTime(entry.lunch_out)}</td>
                    <td className="font-mono">{formatTime(entry.lunch_in)}</td>
                    <td className="font-mono">{formatTime(entry.check_out)}</td>
                    <td className="text-right" style={{ fontWeight: 700 }}>
                      {entry.total_hours ? `${String(Math.floor(entry.total_hours)).padStart(2,'0')}:${String(Math.round((entry.total_hours % 1) * 60)).padStart(2,'0')}` : '--:--'}
                    </td>
                    <td className="text-center">
                      <Badge status={entry.status} />
                    </td>
                    {/* VULN: Stored XSS — note field rendered as raw HTML */}
                    <td dangerouslySetInnerHTML={{ __html: entry.note || '' }} />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
