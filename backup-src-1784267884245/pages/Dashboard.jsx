import BottomNav from '../components/BottomNav'
import StatCard from '../components/StatCard'
import { BellIcon, BookIcon, BoxIcon, SendIcon, DownloadIcon } from '../components/Icons'

const formatDate = (value) =>
  new Intl.DateTimeFormat('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)

const formatMovementDate = (value) => {
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const dayLabel = sameDay
    ? 'Aujourd’hui'
    : date.toDateString() === yesterday.toDateString()
      ? 'Hier'
      : new Intl.DateTimeFormat('fr-BE', { day: '2-digit', month: '2-digit' }).format(date)
  const time = new Intl.DateTimeFormat('fr-BE', { hour: '2-digit', minute: '2-digit' }).format(date)
  return `${dayLabel}, ${time}`
}

function Dashboard({
  publications,
  movements,
  currentAssembly,
  onNavigate,
  isAdmin = false,
}) {
  const totalStock = publications.reduce((sum, item) => sum + item.stock, 0)
  const lowStock = publications.filter((item) => item.stock <= item.minimum).length
  const distributed = movements
    .filter((item) => item.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0)
  const recentMovements = movements.slice(0, 5)

  const handleNavigation = (label) => {
  if (label === 'Accueil') onNavigate('dashboard')
  if (label === 'Publications') onNavigate('inventory')
  if (label === 'Distribution') onNavigate('distribution')
  if (label === 'Proclamateurs') onNavigate('publishers')
  if (label === 'Assemblée') onNavigate('assemblies')
  if (label === 'Plus') onNavigate('more')
}

  return (
    <section className="phone-page dashboard-page">
      <header className="dashboard-header dashboard-header--compact">
        <div className="dashboard-topline">
          <div>
            <p className="app-name">PubliService</p>
            <p>Assemblée de {currentAssembly?.name ?? 'â€”'}</p>
          </div>
          <button className="header-icon" type="button" aria-label="Notifications"><BellIcon /></button>
        </div>
        <div className="dashboard-date">{formatDate(new Date())}</div>
      </header>

      <div className="dashboard-content dashboard-content--compact">
        <section className="stats-grid" aria-label="RÃ©sumÃ©">
          <StatCard icon={<BookIcon />} value={publications.length} label="Publications" onClick={() => onNavigate('inventory')} />
          <StatCard icon={<BoxIcon />} value={lowStock} label="Stock faible" tone="warning" onClick={() => onNavigate('inventory')} />
          <StatCard icon={<SendIcon />} value={distributed} label="Distribuées" tone="green" />
          <StatCard icon={<DownloadIcon />} value={totalStock} label="En stock" tone="purple" />
        </section>

        <section className="dashboard-section activity-section">
          <div className="section-heading section-heading--row">
            <div><span>Historique</span><h2>Dernières activités</h2></div>
          </div>
          <div className="activity-list">
            {recentMovements.length === 0 ? (
              <div className="empty-history">Aucun mouvement enregistrÃ© pour le moment.</div>
            ) : recentMovements.map((item) => (
              <article className="activity-item" key={item.id}>
                <div className={`activity-badge activity-badge--${item.amount > 0 ? 'positive' : 'negative'}`}>
                  {item.amount > 0 ? '+' : '−'}{Math.abs(item.amount)}
                </div>
                <div><h3>{item.publicationName}</h3><p>{item.type} · {formatMovementDate(item.createdAt)}</p></div>
                <span className="activity-chevron">›</span>
              </article>
            ))}
          </div>
        </section>
      </div>

      <BottomNav active="Accueil" onChange={handleNavigation} isAdmin={isAdmin} />
    </section>
  )
}

export default Dashboard

