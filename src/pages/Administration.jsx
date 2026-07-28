import SideMenu from '../components/SideMenu'

function Chevron() {
  return (
    <span className="more-chevron" aria-hidden="true">
      ›
    </span>
  )
}

function Administration({
  currentAssembly,
  publisherCount = 0,
  onNavigate,
}) {
  const assemblyCode =
    currentAssembly?.code ??
    currentAssembly?.accessCode ??
    currentAssembly?.access_code

  return (
    <section className="phone-page dashboard-page more-page">
      <header className="more-header">
        <div>
          <p>PubliService</p>
          <h1>Administration</h1>
        </div>

        <SideMenu
          activeScreen="administration"
          onNavigate={onNavigate}
          isAdmin
        />
      </header>

      <div className="more-content">
        <section className="more-section">
          <h2>Assemblée sélectionnée</h2>

          <div className="more-row">
            <span className="more-row-icon" aria-hidden="true">
              🏛️
            </span>

            <span className="more-row-text">
              <strong>{currentAssembly?.name ?? 'Aucune assemblée'}</strong>
              <small>
                {assemblyCode
                  ? `Code : ${assemblyCode}`
                  : 'Aucun code disponible'}
              </small>
              <small>
                {publisherCount} proclamateur
                {publisherCount > 1 ? 's' : ''}
              </small>
            </span>
          </div>
        </section>

        <section className="more-section">
          <h2>Gestion</h2>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('assemblies')}
          >
            <span className="more-row-icon" aria-hidden="true">
              🏛️
            </span>

            <span className="more-row-text">
              <strong>Assemblées</strong>
              <small>
                Créer, sélectionner et gérer les codes d’accès
              </small>
            </span>

            <Chevron />
          </button>

          <button
            className="more-row"
            type="button"
            onClick={() => onNavigate('adminPanel')}
          >
            <span
              className="more-row-icon more-row-icon--users"
              aria-hidden="true"
            >
              👤
            </span>

            <span className="more-row-text">
              <strong>Administrateurs</strong>
              <small>Inviter et gérer les administrateurs</small>
            </span>

            <Chevron />
          </button>
        </section>
      </div>
    </section>
  )
}

export default Administration
