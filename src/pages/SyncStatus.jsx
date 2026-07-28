function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function formatDate(value) {
  if (!value) return 'Aucune synchronisation enregistrée'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Date indisponible'
  }

  return new Intl.DateTimeFormat('fr-BE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function SyncStatus({
  currentAssembly,
  isOnline,
  usingCachedData,
  syncStatus,
  operations = [],
  lastSyncAt,
  lastSyncError,
  onRetry,
  onCancel,
  onBack,
}) {
  const pendingCount = operations.length
  const isSyncing = syncStatus === 'syncing'

  const cancelOperation = async (operation) => {
    if (!isOnline || isSyncing) return

    const confirmed = window.confirm(
      `Annuler la distribution en attente pour ${
        operation.publisherName || 'ce proclamateur'
      } ?`,
    )

    if (confirmed) {
      await onCancel(operation.id)
    }
  }

  return (
    <section className="phone-page dashboard-page sync-status-page">
      <header className="information-header">
        <button
          type="button"
          aria-label="Revenir à l’écran Plus"
          onClick={onBack}
        >
          <BackIcon />
        </button>

        <div>
          <p>Mode hors ligne</p>
          <h1>Synchronisation</h1>
        </div>
      </header>

      <div className="sync-status-content">
        <section className="sync-overview-card">
          <div
            className={
              isOnline
                ? 'sync-connection sync-connection--online'
                : 'sync-connection sync-connection--offline'
            }
          >
            <span aria-hidden="true" />
            <strong>{isOnline ? 'En ligne' : 'Hors ligne'}</strong>
          </div>

          <div className="sync-overview-grid">
            <div>
              <span>En attente</span>
              <strong>{pendingCount}</strong>
            </div>
            <div>
              <span>Données affichées</span>
              <strong>
                {usingCachedData ? 'Locales' : 'À jour'}
              </strong>
            </div>
          </div>

          <p>
            <strong>Dernière synchronisation réussie</strong>
            <span>{formatDate(lastSyncAt)}</span>
          </p>

          {lastSyncError ? (
            <div className="sync-error-message" role="alert">
              <strong>Dernière erreur</strong>
              <span>{lastSyncError}</span>
            </div>
          ) : null}

          <button
            className="sync-retry-button"
            type="button"
            onClick={onRetry}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing
              ? 'Synchronisation en cours…'
              : pendingCount > 0
                ? 'Synchroniser maintenant'
                : 'Vérifier maintenant'}
          </button>

          {!isOnline ? (
            <small>
              La synchronisation démarrera automatiquement au retour
              d’Internet.
            </small>
          ) : null}
        </section>

        <section className="sync-queue-section">
          <div className="sync-section-heading">
            <div>
              <span>File locale</span>
              <h2>Opérations en attente</h2>
            </div>
            <strong>{pendingCount}</strong>
          </div>

          {pendingCount === 0 ? (
            <div className="sync-empty-state">
              <span aria-hidden="true">✓</span>
              <strong>Tout est synchronisé</strong>
              <p>Aucune distribution n’attend d’être envoyée.</p>
            </div>
          ) : (
            <div className="sync-operation-list">
              {operations.map((operation) => (
                <article
                  className="sync-operation-card"
                  key={operation.id}
                >
                  <div>
                    <span>Distribution</span>
                    <strong>
                      {operation.publisherName || 'Proclamateur'}
                    </strong>
                    <p>
                      {operation.publicationName || 'Publication'}
                      {' · '}
                      Quantité {operation.quantity ?? 0}
                    </p>
                    <time dateTime={operation.createdAt}>
                      Enregistrée le {formatDate(operation.createdAt)}
                    </time>
                  </div>

                  {operation.lastError ? (
                    <p className="sync-operation-error">
                      {operation.lastError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => cancelOperation(operation)}
                    disabled={!isOnline || isSyncing}
                  >
                    Annuler
                  </button>
                </article>
              ))}
            </div>
          )}

          {pendingCount > 0 && !isOnline ? (
            <p className="sync-cancel-note">
              Une opération peut être annulée après le retour de la
              connexion afin de restaurer correctement le stock.
            </p>
          ) : null}
        </section>

        <section className="sync-information-note">
          <strong>Fonctionnement automatique</strong>
          <p>
            Les distributions réalisées hors ligne sont conservées
            sur cet appareil. PubliService tente de les envoyer dès
            que la connexion revient.
          </p>
          {currentAssembly?.name ? (
            <small>Assemblée active : {currentAssembly.name}</small>
          ) : null}
        </section>
      </div>
    </section>
  )
}

export default SyncStatus
