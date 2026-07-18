import { useCallback, useEffect, useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav'
import {
  distributeAllRemaining,
  getPendingDistributions,
} from '../services/distributionService'

function Distribution({
  currentAssembly = null,
  onNavigate,
  isAdmin = false,
}) {
  const [search, setSearch] = useState('')
  const [pendingRows, setPendingRows] = useState([])
  const [selectedRows, setSelectedRows] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const assemblyId =
    currentAssembly?.id ??
    currentAssembly?.assemblyId ??
    currentAssembly?.assembly_id

  const accessCode =
    currentAssembly?.accessCode ??
    currentAssembly?.access_code ??
    currentAssembly?.code

  const loadDistribution = useCallback(async () => {
    if (!assemblyId || !accessCode) {
      setPendingRows([])
      setSelectedRows({})
      setLoading(false)
      setErrorMessage(
        'Les informations de l’assemblée sont introuvables.',
      )
      return
    }

    try {
      setLoading(true)
      setErrorMessage('')

      const rows = await getPendingDistributions(
        assemblyId,
        accessCode,
      )

      setPendingRows(rows)
      setSelectedRows({})
    } catch (error) {
      console.error(
        'Erreur lors du chargement de la distribution :',
        error,
      )

      setPendingRows([])
      setSelectedRows({})
      setErrorMessage(
        error?.message ??
          'Impossible de charger la distribution.',
      )
    } finally {
      setLoading(false)
    }
  }, [assemblyId, accessCode])

  useEffect(() => {
    loadDistribution()
  }, [loadDistribution])

  const publishers = useMemo(() => {
    const grouped = new Map()

    pendingRows.forEach((row) => {
      if (!grouped.has(row.publisherId)) {
        grouped.set(row.publisherId, {
          id: row.publisherId,
          firstName: row.publisherFirstName,
          lastName: row.publisherLastName,
          rows: [],
        })
      }

      grouped.get(row.publisherId).rows.push(row)
    })

    return Array.from(grouped.values())
  }, [pendingRows])

  const filteredPublishers = useMemo(() => {
    const value = search.toLocaleLowerCase('fr').trim()

    if (!value) return publishers

    return publishers.filter((publisher) => {
      const fullName =
        `${publisher.firstName ?? ''} ${publisher.lastName ?? ''}`
          .trim()
          .toLocaleLowerCase('fr')

      return fullName.includes(value)
    })
  }, [publishers, search])

  const getRowKey = (publisherId, publicationId) =>
    `${publisherId}:${publicationId}`

  const togglePublication = (row) => {
    const key = getRowKey(
      row.publisherId,
      row.publicationId,
    )

    setSelectedRows((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  const toggleAllForPublisher = (publisher) => {
    const selectableRows = publisher.rows.filter(
      (row) =>
        row.availableStock >= row.remainingQuantity &&
        row.remainingQuantity > 0,
    )

    const allSelected =
      selectableRows.length > 0 &&
      selectableRows.every((row) => {
        const key = getRowKey(
          row.publisherId,
          row.publicationId,
        )

        return Boolean(selectedRows[key])
      })

    setSelectedRows((previous) => {
      const next = { ...previous }

      selectableRows.forEach((row) => {
        const key = getRowKey(
          row.publisherId,
          row.publicationId,
        )

        next[key] = !allSelected
      })

      return next
    })
  }

  const selectedPendingRows = useMemo(
    () =>
      pendingRows.filter((row) => {
        const key = getRowKey(
          row.publisherId,
          row.publicationId,
        )

        return Boolean(selectedRows[key])
      }),
    [pendingRows, selectedRows],
  )

  const handleSave = async () => {
    if (!assemblyId || !accessCode) {
      window.alert(
        'Les informations de l’assemblée sont introuvables.',
      )
      return
    }

    if (selectedPendingRows.length === 0) {
      window.alert(
        'Coche au moins une publication à distribuer.',
      )
      return
    }

    try {
      setSaving(true)
      setErrorMessage('')

      for (const row of selectedPendingRows) {
        await distributeAllRemaining({
          assemblyId,
          accessCode,
          publisherId: row.publisherId,
          publicationId: row.publicationId,
        })
      }

      window.alert(
        'La distribution a bien été enregistrée.',
      )

      await loadDistribution()
    } catch (error) {
      console.error(
        'Erreur lors de l’enregistrement :',
        error,
      )

      window.alert(
        error?.message ??
          'Impossible d’enregistrer la distribution.',
      )

      await loadDistribution()
    } finally {
      setSaving(false)
    }
  }

  const openPublisher = (publisherId) => {
    sessionStorage.setItem(
      'publiservice-open-publisher',
      String(publisherId),
    )

    onNavigate('publishers')
  }

  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
    if (label === 'Publications') onNavigate('inventory')
    if (label === 'Distribution') onNavigate('distribution')
    if (label === 'Proclamateurs') onNavigate('publishers')
    if (label === 'Assemblée') onNavigate('assemblies')
    if (label === 'Plus') onNavigate('more')
  }

  return (
    <section className="phone-page dashboard-page inventory-page">
      <header className="inventory-header">
        <div>
          <p>GESTION DE L&apos;ASSEMBLÉE</p>
          <h1>Distribution</h1>
        </div>
      </header>

      <div className="inventory-content">
        <input
          className="publisher-search"
          type="search"
          placeholder="Rechercher un proclamateur..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        {errorMessage && (
          <p className="error-message">{errorMessage}</p>
        )}

        {loading ? (
          <p>Chargement...</p>
        ) : filteredPublishers.length === 0 ? (
          <div
            className="publication-card"
            style={{ padding: 18 }}
          >
            <strong>Tout est à jour 🎉</strong>
            <p
              style={{
                margin: '8px 0 0',
                color: 'rgba(0, 0, 0, 0.58)',
                fontSize: 14,
              }}
            >
              Aucune publication ne reste à distribuer.
            </p>
          </div>
        ) : (
          <div className="publication-list">
            {filteredPublishers.map((publisher) => {
              const selectableRows = publisher.rows.filter(
                (row) =>
                  row.availableStock >=
                    row.remainingQuantity &&
                  row.remainingQuantity > 0,
              )

              const allSelected =
                selectableRows.length > 0 &&
                selectableRows.every((row) => {
                  const key = getRowKey(
                    row.publisherId,
                    row.publicationId,
                  )

                  return Boolean(selectedRows[key])
                })

              return (
                <article
                  key={publisher.id}
                  className="publication-card"
                  style={{
                    alignItems: 'flex-start',
                    padding: 18,
                  }}
                >
                  <div
                    className="publication-info"
                    style={{ width: '100%' }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openPublisher(publisher.id)
                      }
                      style={{
                        appearance: 'none',
                        border: 0,
                        padding: 0,
                        background: 'transparent',
                        color: 'inherit',
                        font: 'inherit',
                        textAlign: 'left',
                        cursor: 'pointer',
                        marginBottom: 14,
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 18,
                          lineHeight: 1.25,
                        }}
                      >
                        👤 {publisher.firstName}{' '}
                        {publisher.lastName}
                      </strong>
                    </button>

                    <div
                      style={{
                        display: 'grid',
                        gap: 12,
                      }}
                    >
                      {publisher.rows.map((row) => {
                        const key = getRowKey(
                          row.publisherId,
                          row.publicationId,
                        )

                        const insufficientStock =
                          row.availableStock <
                          row.remainingQuantity

                        return (
                          <label
                            key={key}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 11,
                              cursor:
                                saving || insufficientStock
                                  ? 'default'
                                  : 'pointer',
                              lineHeight: 1.35,
                              opacity: insufficientStock
                                ? 0.65
                                : 1,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(
                                selectedRows[key],
                              )}
                              disabled={
                                saving || insufficientStock
                              }
                              onChange={() =>
                                togglePublication(row)
                              }
                              style={{
                                width: 20,
                                height: 20,
                                flex: '0 0 auto',
                                marginTop: 1,
                                accentColor: '#123b8f',
                              }}
                            />

                            <span>
                              <strong>
                                {row.publicationName}
                              </strong>

                              <small
                                style={{
                                  display: 'block',
                                  marginTop: 4,
                                  color: insufficientStock
                                    ? '#a13d2d'
                                    : 'rgba(0, 0, 0, 0.58)',
                                }}
                              >
                                À distribuer :{' '}
                                {row.remainingQuantity}
                                {' · '}
                                Stock : {row.availableStock}
                                {insufficientStock
                                  ? ' · Stock insuffisant'
                                  : ''}
                              </small>
                            </span>
                          </label>
                        )
                      })}
                    </div>

                    {selectableRows.length > 0 && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          toggleAllForPublisher(publisher)
                        }
                        style={{
                          width: '100%',
                          marginTop: 16,
                          minHeight: 44,
                          borderRadius: 12,
                          border:
                            '1px solid rgba(18, 59, 143, 0.35)',
                          background: allSelected
                            ? 'rgba(18, 59, 143, 0.08)'
                            : '#ffffff',
                          color: '#123b8f',
                          fontWeight: 800,
                          cursor: saving
                            ? 'default'
                            : 'pointer',
                        }}
                      >
                        {allSelected
                          ? 'Retirer la sélection'
                          : '✓ Sélectionner tout'}
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <button
          className="primary-button"
          type="button"
          disabled={
            saving ||
            loading ||
            selectedPendingRows.length === 0 ||
            !assemblyId ||
            !accessCode
          }
          onClick={handleSave}
          style={{
            marginTop: 20,
            position: 'sticky',
            bottom: 10,
          }}
        >
          {saving
            ? 'Enregistrement...'
            : `Enregistrer la distribution${
                selectedPendingRows.length > 0
                  ? ` (${selectedPendingRows.length})`
                  : ''
              }`}
        </button>
      </div>

      <BottomNav
        active="Distribution"
        onChange={handleNavigation}
        isAdmin={isAdmin}
      />
    </section>
  )
}

export default Distribution
