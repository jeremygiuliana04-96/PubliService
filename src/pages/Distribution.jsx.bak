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
  const [checked, setChecked] = useState({})
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
              rows: rows ?? [],
            }
          }),
        )

        if (cancelled) return

        const values = {}

        results.forEach(({ publisherId, rows }) => {
          rows.forEach((row) => {
            values[
              `${publisherId}-${row.publicationId}`
            ] = row.distributedQuantity > 0
          })
        })

        setChecked(values)
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

  const filteredPublishers = useMemo(() => {
    const value = search.toLowerCase().trim()

    if (!value) return publishers

    return publishers.filter((publisher) =>
      `${publisher.firstName ?? ''} ${
        publisher.lastName ?? ''
      }`
        .toLowerCase()
        .includes(value),
    )
  }, [publishers, search])

  const handleCheckboxChange = (
    publisherId,
    publicationId,
    isChecked,
  ) => {
    setChecked((previous) => ({
      ...previous,
      [`${publisherId}-${publicationId}`]: isChecked,
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
        publications.map((publication) => {
          const isChecked =
            checked[
              `${publisher.id}-${publication.id}`
            ] ?? false

          return savePublisherPublication({
            publisherId: publisher.id,
            publicationId: publication.id,
            orderedQuantity: 1,
            distributedQuantity: isChecked ? 1 : 0,
            assemblyId,
            accessCode,
          })
        }),
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

  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
    if (label === 'Publications') onNavigate('inventory')
    if (label === 'Distribution') {
      onNavigate('distribution')
    }
    if (label === 'Proclamateurs') {
      onNavigate('publishers')
    }
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
          <p>Aucun proclamateur trouvé.</p>
        ) : (
          <div className="publication-list">
            {filteredPublishers.map((publisher) => (
              <div
                key={publisher.id}
                className="publication-card"
              >
                <div className="publication-icon">
                  <strong>
                    {(publisher.firstName?.[0] ?? '') +
                      (publisher.lastName?.[0] ?? '')}
                  </strong>
                </div>

                <div className="publication-info">
                  <strong>
                    {publisher.firstName}{' '}
                    {publisher.lastName}
                  </strong>

                  {publications.map((publication) => {
                    const key =
                      `${publisher.id}-${publication.id}`

                    return (
                      <label
                        key={publication.id}
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems: 'center',
                          gap: 12,
                          marginTop: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{publication.name}</span>

                        <input
                          type="checkbox"
                          checked={checked[key] ?? false}
                          onChange={(event) =>
                            handleCheckboxChange(
                              publisher.id,
                              publication.id,
                              event.target.checked,
                            )
                          }
                        />
                      </label>
                    )
                  })}
                </div>

                <span className="publication-chevron">
                  ›
                </span>
              </div>
            ))}
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
            : 'Enregistrer'}
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

