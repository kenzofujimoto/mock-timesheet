import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const punchConfig = [
  { label: 'Entrada', dotClass: 'dot-entry', field: 'check_in', nextLabel: 'Registrar Saída Almoço', nextIcon: 'restaurant' },
  { label: 'Saída Almoço', dotClass: 'dot-lunch-out', field: 'lunch_out', nextLabel: 'Registrar Retorno', nextIcon: 'lunch_dining' },
  { label: 'Retorno Almoço', dotClass: 'dot-lunch-in', field: 'lunch_in', nextLabel: 'Registrar Saída', nextIcon: 'logout' },
  { label: 'Saída', dotClass: 'dot-exit', field: 'check_out', nextLabel: 'Jornada Concluída', nextIcon: 'check_circle' },
]

export default function Timesheet() {
  const { user } = useAuth()
  const [time, setTime] = useState(new Date())
  const [punchState, setPunchState] = useState(0)
  const [todayEntry, setTodayEntry] = useState(null)
  const [punches, setPunches] = useState([])
  const [message, setMessage] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    fetchTodayEntry()
  }, [user])

  const fetchTodayEntry = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user?.id)
      .eq('entry_date', today)
      .single()

    if (data) {
      setTodayEntry(data)
      const log = []
      if (data.check_in) { log.push({ label: 'Entrada', time: data.check_in.slice(0,5), dotClass: 'dot-entry' }); setPunchState(1) }
      if (data.lunch_out) { log.push({ label: 'Saída Almoço', time: data.lunch_out.slice(0,5), dotClass: 'dot-lunch-out' }); setPunchState(2) }
      if (data.lunch_in) { log.push({ label: 'Retorno Almoço', time: data.lunch_in.slice(0,5), dotClass: 'dot-lunch-in' }); setPunchState(3) }
      if (data.check_out) { log.push({ label: 'Saída', time: data.check_out.slice(0,5), dotClass: 'dot-exit' }); setPunchState(4) }
      setPunches(log)
    }
  }

  const handlePunch = async () => {
    if (punchState >= 4) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`
    const today = now.toISOString().slice(0, 10)
    const config = punchConfig[punchState]

    if (!todayEntry) {
      // Create new entry
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          entry_date: today,
          [config.field]: timeStr,
          status: 'tracking'
        })
        .select()
        .single()

      if (!error) {
        setTodayEntry(data)
        setPunches([{ label: config.label, time: timeStr.slice(0,5), dotClass: config.dotClass }])
        setPunchState(1)
        setMessage(`${config.label} registrada às ${timeStr.slice(0,5)}`)
      }
    } else {
      // Update existing entry
      const updates = { [config.field]: timeStr }

      // If it's check_out, calculate total hours
      if (config.field === 'check_out' && todayEntry.check_in) {
        const checkIn = parseTimeMinutes(todayEntry.check_in)
        const checkOut = parseTimeMinutes(timeStr)
        let worked = checkOut - checkIn
        if (todayEntry.lunch_out && todayEntry.lunch_in) {
          worked -= (parseTimeMinutes(todayEntry.lunch_in) - parseTimeMinutes(todayEntry.lunch_out))
        }
        updates.total_hours = (worked / 60).toFixed(2)
        updates.status = 'pending'
      }

      const { error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', todayEntry.id)

      if (!error) {
        setPunches(prev => [...prev, { label: config.label, time: timeStr.slice(0,5), dotClass: config.dotClass }])
        setPunchState(prev => prev + 1)
        setTodayEntry(prev => ({ ...prev, ...updates }))
        setMessage(`${config.label} registrada às ${timeStr.slice(0,5)}`)
      }
    }

    setTimeout(() => setMessage(''), 3000)
  }

  const parseTimeMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const formatClock = (d) => {
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  }

  const formatDate = (d) => {
    return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
  }

  const getWorkedTime = () => {
    if (!todayEntry?.check_in) return '00:00'
    const checkIn = parseTimeMinutes(todayEntry.check_in)
    let end = todayEntry.check_out
      ? parseTimeMinutes(todayEntry.check_out)
      : time.getHours() * 60 + time.getMinutes()
    let worked = end - checkIn
    if (todayEntry.lunch_out && todayEntry.lunch_in) {
      worked -= (parseTimeMinutes(todayEntry.lunch_in) - parseTimeMinutes(todayEntry.lunch_out))
    } else if (todayEntry.lunch_out && !todayEntry.lunch_in) {
      const lunchStart = parseTimeMinutes(todayEntry.lunch_out)
      worked = lunchStart - checkIn
    }
    if (worked < 0) worked = 0
    return `${String(Math.floor(worked / 60)).padStart(2,'0')}:${String(worked % 60).padStart(2,'0')}`
  }

  const currentBtnLabel = punchState < 4 
    ? (punchState === 0 ? 'Registrar Entrada' : punchConfig[punchState]?.nextLabel || punchConfig[punchState - 1]?.nextLabel)
    : 'Jornada Concluída'

  const currentBtnIcon = punchState === 0 ? 'login'
    : punchState < 4 ? (punchConfig[punchState - 1]?.nextIcon || 'schedule')
    : 'check_circle'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="section-title">Registrar Ponto</h2>
          <p className="section-subtitle">Registre sua entrada, saída e intervalos em tempo real.</p>
        </div>
      </div>

      <div className="clock-section">
        <div className="clock-card">
          <div className="clock-display">
            <div className="clock-time">{formatClock(time)}</div>
            <div className="clock-date">{formatDate(time)}</div>
          </div>

          <div className="clock-status">
            {message ? (
              <>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-success)' }}>check_circle</span>
                <span>{message}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">info</span>
                <span>{punchState === 0 ? 'Nenhum registro hoje' : `${punchState}/4 registros realizados`}</span>
              </>
            )}
          </div>

          <div className="clock-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handlePunch}
              disabled={punchState >= 4}
            >
              <span className="material-symbols-outlined">{currentBtnIcon}</span>
              {punchState === 0 ? 'Registrar Entrada' : punchState < 4 ? punchConfig[punchState - 1].nextLabel : 'Jornada Concluída'}
            </button>
          </div>

          {punches.length > 0 && (
            <div className="clock-timeline">
              {punches.map((p, i) => (
                <div key={i} className="timeline-item">
                  <span className={`timeline-dot ${p.dotClass}`} />
                  <span className="timeline-label">{p.label}</span>
                  <span className="timeline-time">{p.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="today-summary-card">
          <h3 className="card-title">Resumo de Hoje</h3>
          <div className="summary-items">
            <div className="summary-item">
              <span className="summary-label">Entrada</span>
              <span className="summary-value">{todayEntry?.check_in?.slice(0,5) || '--:--'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Almoço</span>
              <span className="summary-value">
                {todayEntry?.lunch_out?.slice(0,5) || '--:--'} ~ {todayEntry?.lunch_in?.slice(0,5) || '--:--'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Saída</span>
              <span className="summary-value">{todayEntry?.check_out?.slice(0,5) || '--:--'}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item summary-total">
              <span className="summary-label">Total Trabalhado</span>
              <span className="summary-value">{getWorkedTime()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
