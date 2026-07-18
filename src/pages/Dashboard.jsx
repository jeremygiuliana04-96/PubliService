import { useEffect, useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav'
import { BellIcon } from '../components/Icons'
import { getStockOverview } from '../services/dashboardService'

const formatDate = (value) =>
  new Intl.DateTimeFormat('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)

const STATUS_CONFIG = {
  sufficient: {
    label: 'Stock suffisant',
    icon: '🟢',
    background: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.25)',
    color: '#15803d',
  },
  low: {
    label: 'Stock faible',
    icon: '🟠',
    background: 'rgba(245, 158, 11, 0.09)',
    border: 'rgba(245, 158, 11, 0.28)',
    color: '#b45309',
  },
  insufficient: {
    label: 'Stock insuffisant',
    icon: '🔴',
    background: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.25)',
    color: '#b91c1c',
  },
}

function Dashboard({
  publications = [],
  publishers = [],
  currentAssembly,
  onNavigate,
  isAdmin = false,
}) {
  const [stockOverview, setStockOverview] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadOverview() {
      try {
        setOverviewLoading(true)
        setOverviewError('')

        const overview = await getStockOverview({
          publishers,
          publications,
          currentAssembly,
        })

        if (!cancelled) {
          setStockOverview(overview)
        }
      } catch (error) {
        console.error(
          'Erreur lors du chargement de l’état du stock :',
          error,
        )

        if (!cancelled) {
          setStockOverview([])
          setOverviewError(
            error?.message ??
              'Impossible de charger l’état du stock.',
          )
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
  }, [publishers, publications, currentAssembly])

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
            <p>Assemblée de {currentAssembly?.name ?? '—'}</p>
          </div>

          <button
            className="header-icon"
            type="button"
            aria-label="Notifications"
          >
            <BellIcon />
          </button>
        </div>

        <div className="dashboard-date">
          {formatDate(new Date())}
        </div>
      </header>

      <div className="dashboard-content dashboard-content--compact">

        <section className="dashboard-section">
          <div className="section-heading section-heading--row">
            <div>
              <h2 style={{ marginTop: '24px' }}>
                État du stock
              </h2>
            </div>
          </div>

          {overviewLoading ? (
            <div className="empty-history">
              Calcul de l’état du stock…
            </div>
          ) : overviewError ? (
            <div className="empty-history">
              {overviewError}
            </div>
          ) : stockOverview.length === 0 ? (
            <div className="empty-history">
              Aucune publication dans l’inventaire.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 14,
              }}
            >
              {stockOverview.map((item) => {
                const status =
                  STATUS_CONFIG[item.status] ??
                  STATUS_CONFIG.sufficient

                return (
                  <article
                    key={item.publicationId}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: `1px solid ${status.border}`,
                      background: status.background,
                      boxShadow:
                        '0 8px 24px rgba(15, 23, 42, 0.06)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onNavigate('inventory')}
                      style={{
                        width: '100%',
                        appearance: 'none',
                        border: 0,
                        padding: 0,
                        background: 'transparent',
                        color: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 17,
                          lineHeight: 1.35,
                        }}
                      >
                        📘 {item.publicationName}
                      </h3>

                      <div
                        style={{
                          display: 'grid',
                          gap: 8,
                          marginTop: 16,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 16,
                          }}
                        >
                          <span>Stock actuel</span>
                          <strong>{item.stock}</strong>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 16,
                          }}
                        >
                          <span>À distribuer</span>
                          <strong>{item.toDistribute}</strong>
                        </div>

                        <div
                          style={{
                            height: 1,
                            background: 'rgba(15, 23, 42, 0.12)',
                            margin: '2px 0',
                          }}
                        />

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 16,
                            fontSize: 16,
                          }}
                        >
                          <strong>Après distribution</strong>
                          <strong>
                            {item.stockAfterDistribution}
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 16,
                          color: status.color,
                          fontWeight: 800,
                        }}
                      >
                        {status.icon}{' '}
                        {item.status === 'insufficient'
                          ? `Il manque ${item.missingQuantity} ${
                              item.missingQuantity > 1
                                ? 'exemplaires'
                                : 'exemplaire'
                            }`
                          : status.label}
                      </div>
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav
        active="Accueil"
        onChange={handleNavigation}
        isAdmin={isAdmin}
      />
    </section>
  )
}

export default Dashboard
