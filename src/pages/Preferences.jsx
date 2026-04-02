import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Preferences() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    department: user?.department || '',
    role: user?.role || '',
  })
  const [saved, setSaved] = useState(false)
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('pt-BR')

  const handleSave = async () => {
    // VULN: Mass Assignment — sends all fields including role
    await updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="section-title">Preferências</h2>
          <p className="section-subtitle">Gerencie suas informações pessoais e configurações do sistema.</p>
        </div>
      </div>

      <div className="preferences-layout">
        {/* Profile Section */}
        <div className="pref-card">
          <div className="pref-card-header">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>person</span>
            <h3 className="pref-card-title">Informações Pessoais</h3>
          </div>
          <div className="pref-card-body">
            {saved && (
              <div style={{ padding: '.625rem 1rem', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: 'var(--radius)', fontSize: '.8125rem', marginBottom: '1rem' }}>
                ✓ Preferências salvas com sucesso!
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" className="form-input" value={form.email} readOnly style={{ opacity: 0.6 }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <input type="text" className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo / Role</label>
                {/* VULN: Mass Assignment — user can change their own role to admin */}
                <input type="text" className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handleSave}>
                <span className="material-symbols-outlined">save</span>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="pref-card">
          <div className="pref-card-header">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>palette</span>
            <h3 className="pref-card-title">Aparência</h3>
          </div>
          <div className="pref-card-body">
            <div className="form-group">
              <label className="form-label">Tema</label>
              <select className="form-input" value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático (sistema)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Idioma</label>
              <select className="form-input" value={language} onChange={e => setLanguage(e.target.value)}>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="pref-card">
          <div className="pref-card-header">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>notifications</span>
            <h3 className="pref-card-title">Notificações</h3>
          </div>
          <div className="pref-card-body">
            <div className="pref-toggle-row">
              <div>
                <p className="pref-toggle-label">Notificações por E-mail</p>
                <p className="pref-toggle-desc">Receba atualizações sobre aprovações e alterações de ponto</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="pref-toggle-row">
              <div>
                <p className="pref-toggle-label">Lembrete de Registro</p>
                <p className="pref-toggle-desc">Notificação diária para registrar entrada e saída</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="pref-toggle-row">
              <div>
                <p className="pref-toggle-label">Relatório Semanal</p>
                <p className="pref-toggle-desc">Resumo semanal de horas enviado toda sexta-feira</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
