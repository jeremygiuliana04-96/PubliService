import BottomNav from '../components/BottomNav'
import {
  HomeIcon,
  SettingsIcon,
} from '../components/Icons'

function Chevron() {
  return (
    <span
      className="more-chevron"
      aria-hidden="true"
    >
      ›
    </span>
  )
}

function More({
  currentAssembly,
  publisherCount = 0,
  onNavigate,
  onLogout,
  logoutLoading = false,
  isAdmin = false,
}) {
  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
    if (label === 'Publications') onNavigate('inventory')
  if (label === 'Distribution') onNavigate('distribution')
    if (label === 'Proclamateurs') onNavigate('publishers')
    if (label === 'Plus') onNavigate('more')
  }

  const assemblyName = currentAssembly?.name ?? '—'
  const assemblyCode = currentAssembly?.code ?? '—'

  return (
    <section className="phone-page dashboard-page more-page">
      <header className="more-header">
        <div>
          <p>PubliService</p>
          <h1>Plus</h1>
        </div>

        <span
          className="more-header-icon"
          aria-hidden="true"
        >
          <SettingsIcon />
        </span>
      </header>

      <div className="more-content">
        <section className="more-section">
          <h2>Assemblée</h2>

          <div className="more-row">
            <span className="more-row-icon">
              <HomeIcon />
            </span>

            <span className="more-row-text">
              <strong>Assemblée connectée</strong>
              <small>{assemblyName}</small>
              <small>Code : {assemblyCode}</small>

              {isAdmin ? (
                <>
                  <small>
                    Statut :{' '}
                    {currentAssembly?.isActive
                      ? 'Active'
                      : 'Inactive'}
                  </small>

                  <small>
                    Proclamateurs : {publisherCount}
                  </small>
                </>
              ) : null}
            </span>
          </div>

        </section>

        {isAdmin ? (
          <section className="more-section">
            <h2>Administration</h2>

            <button
              className="more-row"
              type="button"
              onClick={() => onNavigate('adminPanel')}
            >
              <span className="more-row-icon more-row-icon--users">
                👤
              </span>

              <span className="more-row-text">
                <strong>Administrateurs</strong>
                <small>
                  Gérer les accès administrateurs
                </small>
              </span>

              <Chevron />
            </button>
          </section>
        ) : null}

        <section className="more-section">
          <h2>Compte</h2>

          <button
            className="more-row more-row--danger"
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
          >
            <span className="more-row-icon more-row-icon--logout">
              ↪
            </span>

            <span className="more-row-text">
              <strong>
                {logoutLoading
                  ? 'Déconnexion…'
                  : 'Se déconnecter'}
              </strong>

              <small>Revenir à l’écran d’accueil</small>
            </span>
          </button>
        </section>
      </div>

      <BottomNav
        active="Plus"
        onChange={handleNavigation}
        isAdmin={isAdmin}
      />
    </section>
  )
}

export default More


