import { useLocation, useSearchParams } from 'react-router-dom'
import { useToast } from './Toast'

const titles = {
  '/': 'Dashboard',
  '/timesheet': 'Meu Ponto',
  '/analytics': 'Relatórios',
  '/requests': 'Solicitações',
  '/preferences': 'Preferências',
  '/support': 'Suporte',
}

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function Header() {
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const showToast = useToast()
  const now = new Date()
  const title = titles[pathname] || 'Dashboard'

  // VULN: Reflected XSS — search query is rendered unsafely
  const searchQuery = searchParams.get('q') || ''

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setSearchParams({ q: e.target.value })
    }
  }

  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <span className="header-divider" />
        <span className="header-date">{MONTHS[now.getMonth()]} {now.getFullYear()}</span>
      </div>
      <div className="header-right">
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar lançamentos..."
            defaultValue={searchQuery}
            onKeyDown={handleSearch}
          />
        </div>
        {/* VULN: Reflected XSS — rendering search query without escaping */}
        {searchQuery && (
          <div
            className="search-result-label"
            dangerouslySetInnerHTML={{ __html: `Resultados para: <strong>${searchQuery}</strong>` }}
          />
        )}
        <button className="btn-icon notification-btn" onClick={() => showToast && showToast('Não há novas notificações no momento.')}>
          <span className="notification-dot" />
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>
    </header>
  )
}
