import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('kenzo@kronos.io')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // VULN: No rate limiting, no CAPTCHA, no account lockout
      await login(email, password)
      navigate('/')
    } catch (err) {
      // VULN: Verbose error message reveals if email exists
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page login-page active">
      <div className="login-container">
        <div className="login-left">
          <div className="login-brand-bg">
            <div className="login-brand-content">
              <div className="login-logo-wrapper">
                <div className="logo-icon-large">
                  <span className="material-symbols-outlined">dataset</span>
                </div>
                <span className="logo-text-large">Kronos<span className="logo-accent">.io</span></span>
              </div>
              <h1 className="login-headline">Ponto Digital<br/>Inteligente</h1>
              <p className="login-subtitle">
                Gerencie sua jornada de trabalho com precisão e simplicidade.
                Registre entradas, saídas e intervalos em tempo real.
              </p>
              <div className="login-stats">
                <div className="login-stat">
                  <span className="login-stat-value">+2.400</span>
                  <span className="login-stat-label">Colaboradores</span>
                </div>
                <div className="login-stat-divider" />
                <div className="login-stat">
                  <span className="login-stat-value">99.7%</span>
                  <span className="login-stat-label">Uptime</span>
                </div>
                <div className="login-stat-divider" />
                <div className="login-stat">
                  <span className="login-stat-value">ISO 27001</span>
                  <span className="login-stat-label">Certificado</span>
                </div>
              </div>
            </div>
            <div className="pixel-decoration" />
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2 className="login-form-title">Bem-vindo de volta</h2>
              <p className="login-form-desc">Insira suas credenciais para acessar o sistema</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && <div className="form-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="login-email" className="form-label">E-mail corporativo</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input
                    type="email"
                    id="login-email"
                    className="form-input"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password" className="form-label">Senha</label>
                <div className="input-with-icon">
                  <span className="material-symbols-outlined input-icon">lock</span>
                  <input
                    type="password"
                    id="login-password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="login-options">
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  <span>Manter conectado</span>
                </label>
                <a href="#" className="link-text">Esqueceu a senha?</a>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </form>

            <div className="login-footer-text">
              <p>© 2026 RSM Brasil. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
