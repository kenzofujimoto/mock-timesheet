import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/timesheet', icon: 'schedule', label: 'Meu Ponto' },
  { to: '/analytics', icon: 'analytics', label: 'Relatórios' },
  { to: '/requests', icon: 'pending_actions', label: 'Solicitações' },
]

const configItems = [
  { to: '/preferences', icon: 'settings', label: 'Preferências' },
  { to: '/support', icon: 'help', label: 'Suporte' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <span className="material-symbols-outlined">dataset</span>
          </div>
          <span className="logo-text">Kronos<span className="logo-accent">.io</span></span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Principal</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: '1.5rem' }}>Configurações</div>
        {configItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar avatar-sm">
            {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.full_name}</p>
            <p className="user-email">{user?.email}</p>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Sair" style={{ color: 'rgba(148,163,184,.6)' }}>
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
