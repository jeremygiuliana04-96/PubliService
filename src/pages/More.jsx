import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import { HomeIcon, SettingsIcon } from '../components/Icons'
import AccessCodeSheet from '../components/more/AccessCodeSheet'
import AdminSheet from '../components/more/AdminSheet'

function Chevron() {
  return <span className="more-chevron" aria-hidden="true">›</span>
}

function More({
  currentAssembly,
  onNavigate,
  onLogout,
  logoutLoading = false,
}) {
  const [showCodeSheet, setShowCodeSheet] = useState(false)
  const [showAdminSheet, setShowAdminSheet] = useState(false)
  const [adminCount, setAdminCount] = useState(1)

  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
    if (label === 'Publications') onNavigate('inventory')
    if (label === 'Proclamateurs') onNavigate('publishers')
    if (label === 'Assemblée') onNavigate('assemblies')
    if (label === 'Plus') onNavigate('more')
  }

  return (
    <section className="phone-page dashboard-page more-page">
      <header className="more-header">
        <div><p>PubliService</p><h1>Plus</h1></div>
        <span className="more-header-icon" aria-hidden="true"><SettingsIcon /></span>
      </header>

      <div className="more-content">
        <section className="more-section">
          <h2>Assemblée</h2>

          <button className="more-row" type="button">
            <span className="more-row-icon"><HomeIcon /></span>
            <span className="more-row-text">
              <strong>Informations de l’assemblée</strong>
              <small>Assemblée de {currentAssembly?.name ?? '—'}</small>
            </span>
            <Chevron />
          </button>

          <button className="more-row" type="button" onClick={() => setShowCodeSheet(true)}>
            <span className="more-row-icon more-row-icon--key">••••••</span>
            <span className="more-row-text">
              <strong>Code d’accès</strong>
              <small>Gérer le code à 6 chiffres</small>
            </span>
            <Chevron />
          </button>
        </section>

        <section className="more-section">
          <h2>Administration</h2>
          <button className="more-row" type="button" onClick={() => onNavigate('adminPanel')}>
            <span className="more-row-icon more-row-icon--users">{adminCount}</span>
            <span className="more-row-text">
              <strong>Administrateurs</strong>
              <small>Gérer les accès administrateurs</small>
            </span>
            <Chevron />
          </button>
        </section>

        <section className="more-section">
          <h2>Compte</h2>
          <button className="more-row more-row--danger" type="button" onClick={onLogout} disabled={logoutLoading}>
            <span className="more-row-icon more-row-icon--logout">↪</span>
            <span className="more-row-text">
              <strong>{logoutLoading ? 'Déconnexion…' : 'Se déconnecter'}</strong>
              <small>Revenir à l’écran d’accueil</small>
            </span>
          </button>
        </section>
      </div>

      <AccessCodeSheet open={showCodeSheet} onClose={() => setShowCodeSheet(false)} />
      <AdminSheet
        open={showAdminSheet}
        onClose={() => setShowAdminSheet(false)}
        onCountChange={setAdminCount}
      />

      <BottomNav active="Plus" onChange={handleNavigation} />
    </section>
  )
}

export default More