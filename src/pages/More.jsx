import SideMenu from '../components/SideMenu'
import packageInfo from '../../package.json'

function Chevron() {
  return (
    <span className="more-chevron" aria-hidden="true">
      ›
    </span>
  )
}

function formatSyncDate(value) {
  if (!value) return 'Aucune synchronisation enregistrée'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date indisponible'
  }

  return new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function More({
  pendingSyncCount = 0,
  syncStatus = 'idle',
  lastSyncAt = null,
  onNavigate,
  onLogout,
  logoutLoading = false,
  isAdmin = false,
}) {
  return (
    <section className="phone-page dashboard-page more-page">
      <header className="more-header">
        <div>
          <p>PubliService</p>
          <h1>Réglages et aide</h1>
        </div>

        <SideMenu
            activeScreen="more"
            onNavigate={onNavigate}
            isAdmin={isAdmin}
          />
      </header>

      <div className="more-content">
        <section className="more-section">
          <h2>Application</h2>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('syncStatus')}
          >
            <span className="more-row-icon" aria-hidden="true">
              ↻
            </span>

            <span className="more-row-text">
              <strong>Synchronisation</strong>
              <small>
                {syncStatus === 'syncing'
                  ? 'Synchronisation en cours…'
                  : pendingSyncCount > 0
                    ? `${pendingSyncCount} opération${
                        pendingSyncCount > 1 ? 's' : ''
                      } en attente`
                    : `Dernière : ${formatSyncDate(lastSyncAt)}`}
              </small>
            </span>

            {pendingSyncCount > 0 ? (
              <span
                className="more-row-count"
                aria-label={`${pendingSyncCount} opérations en attente`}
              >
                {pendingSyncCount}
              </span>
            ) : (
              <Chevron />
            )}
          </button>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('installation')}
          >
            <span className="more-row-icon" aria-hidden="true">
              ↓
            </span>

            <span className="more-row-text">
              <strong>Installation et mises à jour</strong>
              <small>
                Installer PubliService sur cet appareil
              </small>
            </span>

            <Chevron />
          </button>
        </section>

        <section className="more-section">
          <h2>Informations et assistance</h2>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('privacy')}
          >
            <span className="more-row-icon" aria-hidden="true">
              🛡️
            </span>

            <span className="more-row-text">
              <strong>Confidentialité et données</strong>
              <small>
                Données utilisées, conservation et droits
              </small>
            </span>

            <Chevron />
          </button>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('terms')}
          >
            <span className="more-row-icon" aria-hidden="true">
              📄
            </span>

            <span className="more-row-text">
              <strong>Conditions d’utilisation</strong>
              <small>Règles et responsabilités</small>
            </span>

            <Chevron />
          </button>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('releaseNotes')}
          >
            <span className="more-row-icon" aria-hidden="true">
              ✨
            </span>

            <span className="more-row-text">
              <strong>Notes de mise à jour</strong>
              <small>Version {packageInfo.version}</small>
            </span>

            <Chevron />
          </button>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('support')}
          >
            <span className="more-row-icon" aria-hidden="true">
              ✉️
            </span>

            <span className="more-row-text">
              <strong>Assistance et suppression</strong>
              <small>
                Contacter PubliService ou supprimer des données
              </small>
            </span>

            <Chevron />
          </button>
        </section>

        <section className="more-section">
          <h2>Compte</h2>

          <button
            className="more-row more-row--danger"
            type="button"
            onClick={onLogout}
            disabled={logoutLoading}
          >
            <span
              className="more-row-icon more-row-icon--logout"
              aria-hidden="true"
            >
              ↪
            </span>

            <span className="more-row-text">
              <strong>
                {logoutLoading ? 'Déconnexion…' : 'Se déconnecter'}
              </strong>
              <small>Revenir à l’écran d’accueil</small>
            </span>
          </button>
        </section>

        <p className="more-version">
          PubliService {packageInfo.version}
          <span>Application indépendante et non officielle</span>
        </p>
      </div>
    </section>
  )
}

export default More
