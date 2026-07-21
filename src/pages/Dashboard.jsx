import { useEffect, useMemo, useState } from 'react'
import SideMenu from '../components/SideMenu'
import { getStockOverview } from '../services/dashboardService'

const formatDate = (value) =>
  new Intl.DateTimeFormat('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)


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


  return (
    <section className="phone-page dashboard-page">
      <header className="dashboard-header dashboard-header--compact">
        <div className="dashboard-topline">
          <div>
            <p className="app-name">PubliService</p>
            <p>Assemblée de {currentAssembly?.name ?? '—'}</p>
          </div>

          <SideMenu
            activeScreen="dashboard"
            onNavigate={onNavigate}
            isAdmin={isAdmin}
          />
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
                return (
                  <article
                    key={item.publicationId}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #e5e7eb',
                      background: '#ffffff',
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
    marginTop: 18,
    textAlign: 'center',
  }}
>
  <div
    style={{
      fontSize: 15,
      opacity: 0.7,
      marginBottom: 8,
    }}
  >
    Stock restant
  </div>

  <div
    style={{
      fontSize: 34,
      fontWeight: 800,
      lineHeight: 1,
    }}
  >
    {item.stockAfterDistribution}
  </div>

  <div
    style={{
      marginTop: 6,
      fontSize: 15,
      opacity: 0.75,
    }}
  >
    {item.stockAfterDistribution > 1
      ? 'exemplaires'
      : 'exemplaire'}
  </div>
</div>
</button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default Dashboard