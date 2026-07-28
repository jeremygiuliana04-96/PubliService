import { useEffect, useState } from 'react'
import SideMenu from '../components/SideMenu'
import { getStockOverview } from '../services/dashboardService'

const formatDate = (value) =>
  new Intl.DateTimeFormat('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)

const sameOverview = (left, right) =>
  JSON.stringify(left ?? []) === JSON.stringify(right ?? [])

const positiveNumber = (value) =>
  Math.max(0, Number(value) || 0)

function Dashboard({
  publications = [],
  publishers = [],
  pendingDistributions = [],
  cachedStockOverview = [],
  onStockOverviewChange,
  currentAssembly,
  onNavigate,
  isAdmin = false,
  isOnline = true,
  pendingSyncCount = 0,
  syncStatus = 'idle',
}) {
  const [stockOverview, setStockOverview] = useState(
    cachedStockOverview,
  )
  const [overviewLoading, setOverviewLoading] =
    useState(isOnline)
  const [overviewError, setOverviewError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadOverview() {
      if (!isOnline) {
        setStockOverview(cachedStockOverview)
        setOverviewLoading(false)
        setOverviewError('')
        return
      }

      try {
        setOverviewLoading(true)
        setOverviewError('')

        const overview = await getStockOverview({
          publishers,
          publications,
          currentAssembly,
          pendingDistributions,
        })

        if (!cancelled) {
          setStockOverview(overview)

          if (!sameOverview(overview, cachedStockOverview)) {
            onStockOverviewChange?.(overview)
          }
        }
      } catch (error) {
        console.error(
          'Erreur lors du chargement de la prévision :',
          error,
        )

        if (!cancelled) {
          if (cachedStockOverview.length > 0) {
            setStockOverview(cachedStockOverview)
            setOverviewError('')
          } else {
            setStockOverview([])
            setOverviewError(
              error?.message ??
                'Impossible de calculer la prévision de commande.',
            )
          }
        }
      } finally {
        if (!cancelled) {
          setOverviewLoading(false)
        }
      }
    }

    loadOverview()

    return () => {
      cancelled = true
    }
  }, [
    publishers,
    publications,
    pendingDistributions,
    cachedStockOverview,
    currentAssembly,
    isOnline,
    onStockOverviewChange,
  ])

  const syncLabel = !isOnline
    ? 'Hors ligne'
    : syncStatus === 'syncing'
      ? 'Synchronisation…'
      : syncStatus === 'error'
        ? 'À vérifier'
        : pendingSyncCount > 0
          ? `${pendingSyncCount} en attente`
          : 'Synchronisé'

  const syncModifier = !isOnline
    ? 'offline'
    : syncStatus === 'error'
      ? 'error'
      : pendingSyncCount > 0 || syncStatus === 'syncing'
        ? 'pending'
        : 'ready'

  return (
    <section className="phone-page dashboard-page">
      <header className="dashboard-header dashboard-header--compact">
        <div className="dashboard-topline">
          <div className="dashboard-identity">
            <p className="app-name">PubliService</p>

            {isAdmin ? (
              <button
                className="dashboard-assembly-button"
                type="button"
                onClick={() => onNavigate('assemblies')}
              >
                <span>
                  Assemblée de {currentAssembly?.name ?? '—'}
                </span>
                <small>Changer</small>
              </button>
            ) : (
              <p>
                Assemblée de {currentAssembly?.name ?? '—'}
              </p>
            )}
          </div>

          <div className="dashboard-header-actions">
            <button
              className={`dashboard-sync-pill dashboard-sync-pill--${syncModifier}`}
              type="button"
              onClick={() => onNavigate('syncStatus')}
              aria-label={`État de la synchronisation : ${syncLabel}`}
            >
              <span aria-hidden="true">↻</span>
              <span className="dashboard-sync-label">
                {syncLabel}
              </span>
            </button>

            <SideMenu
              activeScreen="dashboard"
              onNavigate={onNavigate}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        <div className="dashboard-date">
          {formatDate(new Date())}
        </div>
      </header>

      <div className="dashboard-content dashboard-home-content">
        <section className="dashboard-section dashboard-forecast-section">
          <div className="section-heading">
            <span className="dashboard-card-kicker">
              Préparation mensuelle
            </span>
            <h2>Prévision de commande</h2>
            <p>
              Une estimation basée sur le stock actuel et les
              publications restant à distribuer.
            </p>
          </div>

          {overviewLoading ? (
            <div className="empty-history">
              Calcul de la prévision de commande…
            </div>
          ) : overviewError ? (
            <div className="empty-history">{overviewError}</div>
          ) : stockOverview.length === 0 ? (
            <div className="empty-history">
              Aucune publication dans le stock.
            </div>
          ) : (
            <>
              <div className="dashboard-forecast-list">
                {stockOverview.map((item) => {
                  const stock = positiveNumber(item.stock)
                  const need = positiveNumber(
                    item.toDistribute,
                  )
                  const toOrder = Math.max(0, need - stock)
                  const surplus = Math.max(0, stock - need)

                  return (
                    <button
                      className="dashboard-forecast-card"
                      type="button"
                      key={item.publicationId}
                      onClick={() => onNavigate('inventory')}
                    >
                      <span className="dashboard-forecast-title">
                        {item.publicationName}
                      </span>

                      <span className="dashboard-forecast-values">
                        <span>
                          <small>Besoin prévu</small>
                          <strong>{need}</strong>
                        </span>
                        <span>
                          <small>Stock actuel</small>
                          <strong>{stock}</strong>
                        </span>
                        <span>
                          <small>À commander</small>
                          <strong>{toOrder}</strong>
                        </span>
                        <span>
                          <small>Reste estimé</small>
                          <strong>{surplus}</strong>
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </section>

        <section
          className="dashboard-quick-actions"
          aria-label="Actions rapides"
        >
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
          >
            Gérer le stock
          </button>
          <button
            type="button"
            onClick={() => onNavigate('publishers')}
          >
            Gérer les proclamateurs
          </button>
        </section>
      </div>
    </section>
  )
}

export default Dashboard
