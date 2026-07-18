import { useEffect, useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav'
import {
  getPublisherPublications,
  savePublisherPublication,
} from '../services/publisherPublicationService'

function Distribution({
  publishers = [],
  publications = [],
  currentAssembly = null,
  onNavigate,
  isAdmin = false,
}) {
  const [search, setSearch] = useState('')
  const [publisherRows, setPublisherRows] = useState({})
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

  useEffect(() => {
    let cancelled = false

    async function loadDistribution() {
      if (!assemblyId || !accessCode) {
        if (!cancelled) {
          setLoading(false)
          setErrorMessage(
            'Les informations de l’assemblée sont introuvables.',
          )
        }

        return
      }

      try {
        setLoading(true)
        setErrorMessage('')

        const results = await Promise.all(
          publishers.map(async (publisher) => {
            const rows = await getPublisherPublications(
              publisher.id,
              assemblyId,
              accessCode,
            )

            return {
              publisherId: publisher.id,
              rows: (rows ?? []).filter(
                (row) => Number(row.orderedQuantity ?? 0) > 0,
              ),
            }
          }),
        )

        if (cancelled) return

        const nextPublisherRows = {}

        results.forEach(({ publisherId, rows }) => {
          nextPublisherRows[publisherId] = rows.map((row) => ({
            publicationId: row.publicationId,
            orderedQuantity: Number(row.orderedQuantity ?? 0),
            distributedQuantity: Number(
              row.distributedQuantity ?? 0,
            ),
          }))
        })

        setPublisherRows(nextPublisherRows)
      } catch (error) {
        console.error(
          'Erreur lors du chargement de la distribution :',
          error,
        )

        if (!cancelled) {
          setErrorMessage(
            error?.message ??
              'Impossible de charger la distribution.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDistribution()

    return () => {
      cancelled = true
    }
  }, [publishers, assemblyId, accessCode])

  const publicationById = useMemo(
    () =>
      Object.fromEntries(
        publications.map((publication) => [
          String(publication.id),
          publication,
        ]),
      ),
    [publications],
  )

  const filteredPublishers = useMemo(() => {
    const value = search.toLocaleLowerCase('fr').trim()

    return publishers.filter((publisher) => {
      const rows = publisherRows[publisher.id] ?? []

      if (rows.length === 0) return false

      if (!value) return true

      const fullName =
        `${publisher.firstName ?? ''} ${publisher.lastName ?? ''}`
          .trim()
          .toLocaleLowerCase('fr')

      return fullName.includes(value)
    })
  }, [publishers, publisherRows, search])

  const togglePublication = (publisherId, publicationId) => {
    setPublisherRows((previous) => {
      const rows = previous[publisherId] ?? []

      return {
        ...previous,
        [publisherId]: rows.map((row) => {
          if (
            String(row.publicationId) !== String(publicationId)
          ) {
            return row
          }

          const completed =
            row.distributedQuantity >= row.orderedQuantity

          return {
            ...row,
            distributedQuantity: completed
              ? 0
              : row.orderedQuantity,
          }
        }),
      }
    })
  }

  const distributeAllForPublisher = (publisherId) => {
    setPublisherRows((previous) => ({
      ...previous,
      [publisherId]: (previous[publisherId] ?? []).map(
        (row) => ({
          ...row,
          distributedQuantity: row.orderedQuantity,
        }),
      ),
    }))
  }

  const handleSave = async () => {
    if (!assemblyId || !accessCode) {
      window.alert(
        'Les informations de l’assemblée sont introuvables.',
      )
      return
    }

    try {
      setSaving(true)

      const requests = publishers.flatMap((publisher) =>
        (publisherRows[publisher.id] ?? []).map((row) =>
          savePublisherPublication({
            publisherId: publisher.id,
            publicationId: row.publicationId,
            orderedQuantity: row.orderedQuantity,
            distributedQuantity: row.distributedQuantity,
            assemblyId,
            accessCode,
          }),
        ),
      )

      await Promise.all(requests)

      window.alert(
        'La distribution a bien été enregistrée.',
      )
    } catch (error) {
      console.error(
        'Erreur lors de l’enregistrement :',
        error,
      )

      window.alert(
        error?.message ??
          'Impossible d’enregistrer la distribution.',
      )
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
          <p>
            Aucun proclamateur avec une publication commandée.
          </p>
        ) : (
          <div className="publication-list">
            {filteredPublishers.map((publisher) => {
              const rows =
                publisherRows[publisher.id] ?? []

              const allDistributed =
                rows.length > 0 &&
                rows.every(
                  (row) =>
                    row.distributedQuantity >=
                    row.orderedQuantity,
                )

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
                        gap: 10,
                      }}
                    >
                      {rows.map((row) => {
                        const publication =
                          publicationById[
                            String(row.publicationId)
                          ]

                        const completed =
                          row.distributedQuantity >=
                          row.orderedQuantity

                        return (
                          <label
                            key={row.publicationId}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 11,
                              cursor: 'pointer',
                              lineHeight: 1.35,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={completed}
                              disabled={saving}
                              onChange={() =>
                                togglePublication(
                                  publisher.id,
                                  row.publicationId,
                                )
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
                              {publication?.name ??
                                'Publication'}
                              {row.orderedQuantity > 1
                                ? ` × ${row.orderedQuantity}`
                                : ''}
                            </span>
                          </label>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={saving || allDistributed}
                      onClick={() =>
                        distributeAllForPublisher(
                          publisher.id,
                        )
                      }
                      style={{
                        width: '100%',
                        marginTop: 16,
                        minHeight: 44,
                        borderRadius: 12,
                        border: allDistributed
                          ? '1px solid rgba(18, 59, 143, 0.18)'
                          : '1px solid rgba(18, 59, 143, 0.35)',
                        background: allDistributed
                          ? 'rgba(18, 59, 143, 0.08)'
                          : '#ffffff',
                        color: '#123b8f',
                        fontWeight: 800,
                        cursor: allDistributed
                          ? 'default'
                          : 'pointer',
                      }}
                    >
                      {allDistributed
                        ? '✓ Tout est distribué'
                        : '✓ Distribuer tout'}
                    </button>
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
            : 'Enregistrer la distribution'}
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
