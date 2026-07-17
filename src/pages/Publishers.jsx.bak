import { useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav'
import {
  getPublisherPublications,
  saveAllPublisherPublications,
} from '../services/publisherPublicationService'

function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

const createEmptyQuantities = (publications) =>
  publications.map((publication) => ({
    publicationId: publication.id,
    orderedQuantity: 0,
    distributedQuantity: 0,
  }))

function Publishers({
  publishers = [],
  publications = [],
  currentAssembly,
  onAdd,
  onUpdate,
  onDelete,
  onNavigate,
  isAdmin = false,
}) {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedPublisher, setSelectedPublisher] = useState(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [publicationQuantities, setPublicationQuantities] = useState([])

  const [saving, setSaving] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [formError, setFormError] = useState('')

  const filteredPublishers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('fr')

    if (!normalizedSearch) return publishers

    return publishers.filter((publisher) => {
      const fullName =
        `${publisher.firstName ?? ''} ${publisher.lastName ?? ''}`
          .trim()
          .toLocaleLowerCase('fr')

      return fullName.includes(normalizedSearch)
    })
  }, [publishers, search])

  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
    if (label === 'Publications') onNavigate('inventory')
  if (label === 'Distribution') onNavigate('distribution')
    if (label === 'Proclamateurs') onNavigate('publishers')
    if (label === 'Assemblée') onNavigate('assemblies')
    if (label === 'Plus') onNavigate('more')
  }

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setSelectedPublisher(null)
    setPublicationQuantities(createEmptyQuantities(publications))
    setFormError('')
  }

  const openAddForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = async (publisher) => {
    setSelectedPublisher(publisher)
    setFirstName(publisher.firstName ?? '')
    setLastName(publisher.lastName ?? '')
    setPhone(publisher.phone ?? '')
    setEmail(publisher.email ?? '')
    setPublicationQuantities(createEmptyQuantities(publications))
    setFormError('')
    setShowForm(true)
    setLoadingDetails(true)

    try {
      const savedQuantities =
        await getPublisherPublications(
          publisher.id,
          currentAssembly?.id,
          currentAssembly?.code,
        )

      setPublicationQuantities(
        publications.map((publication) => {
          const saved = savedQuantities.find(
            (item) => item.publicationId === publication.id,
          )

          return {
            publicationId: publication.id,
            orderedQuantity: saved?.orderedQuantity ?? 0,
            distributedQuantity: saved?.distributedQuantity ?? 0,
          }
        }),
      )
    } catch (error) {
      setFormError(error.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeForm = () => {
    if (saving) return

    setShowForm(false)
    resetForm()
  }

  const updatePublicationQuantity = (publicationId, field, value) => {
    const numericValue = Math.max(0, Number(value) || 0)

    setPublicationQuantities((items) =>
      items.map((item) => {
        if (item.publicationId !== publicationId) return item

        const nextItem = {
          ...item,
          [field]: numericValue,
        }

        if (
          field === 'orderedQuantity' &&
          nextItem.distributedQuantity > numericValue
        ) {
          nextItem.distributedQuantity = numericValue
        }

        return nextItem
      }),
    )
  }

  const submitPublisher = async (event) => {
    event.preventDefault()

    const cleanFirstName = firstName.trim()
    const cleanLastName = lastName.trim()

    if (!cleanFirstName || !cleanLastName || saving) return

    setSaving(true)
    setFormError('')

    const publisherData = {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: phone.trim(),
      email: email.trim(),
    }

    try {
      let savedPublisher

      if (selectedPublisher) {
        savedPublisher = await onUpdate(
          selectedPublisher.id,
          publisherData,
        )
      } else {
        savedPublisher = await onAdd(publisherData)
      }

      await saveAllPublisherPublications(
        savedPublisher.id,
        publicationQuantities,
        currentAssembly?.id,
        currentAssembly?.code,
      )

      setShowForm(false)
      resetForm()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const removePublisher = async () => {
    if (!selectedPublisher || saving) return

    const confirmed = window.confirm(
      `Supprimer ${selectedPublisher.firstName} ${selectedPublisher.lastName} ?`,
    )

    if (!confirmed) return

    setSaving(true)
    setFormError('')

    try {
      await onDelete(selectedPublisher.id)
      setShowForm(false)
      resetForm()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="phone-page dashboard-page publishers-page">
      <header className="inventory-header">
        <div>
          <p>Gestion de l’assemblée</p>
          <h1>Proclamateurs</h1>
        </div>

        <button
          className="inventory-add-button"
          type="button"
          onClick={openAddForm}
        >
          <span aria-hidden="true">＋</span>
          Ajouter
        </button>
      </header>

      <div className="publishers-content">
        <label className="publisher-search">
          <span>
            <SearchIcon />
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un proclamateur…"
            aria-label="Rechercher un proclamateur"
          />
        </label>

        <div className="inventory-summary">
          <span>
            <strong>{filteredPublishers.length}</strong>{' '}
            {filteredPublishers.length > 1
              ? 'proclamateurs'
              : 'proclamateur'}
          </span>
        </div>

        {filteredPublishers.length === 0 ? (
          <div className="publishers-empty">
            <span className="publishers-empty__icon">
              <PeopleIcon />
            </span>

            <h2>Aucun proclamateur</h2>

            <p>
              Les proclamateurs ajoutés à l’assemblée apparaîtront ici.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={openAddForm}
            >
              Ajouter un proclamateur
            </button>
          </div>
        ) : (
          <div className="publisher-list">
            {filteredPublishers.map((publisher) => (
              <button
                className="publisher-card"
                type="button"
                key={publisher.id}
                onClick={() => openEditForm(publisher)}
              >
                <span className="publisher-avatar">
                  {publisher.firstName?.[0] ?? ''}
                  {publisher.lastName?.[0] ?? ''}
                </span>

                <span className="publisher-information">
                  <strong>
                    {publisher.firstName} {publisher.lastName}
                  </strong>

                  <small>
                    {publisher.phone ||
                      publisher.email ||
                      'Aucune coordonnée renseignée'}
                  </small>
                </span>

                <span className="publication-chevron">›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="sheet-backdrop" onClick={closeForm}>
          <section
            className="detail-sheet publisher-detail-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />

            <h2>
              {selectedPublisher
                ? `${firstName} ${lastName}`
                : 'Ajouter un proclamateur'}
            </h2>

            <form
              className="publication-form"
              onSubmit={submitPublisher}
            >
              <div className="publisher-identity-grid">
                <label>
                  Prénom
                  <input
                    value={firstName}
                    onChange={(event) =>
                      setFirstName(event.target.value)
                    }
                    placeholder="Prénom"
                    autoFocus={!selectedPublisher}
                    disabled={saving}
                    required
                  />
                </label>

                <label>
                  Nom
                  <input
                    value={lastName}
                    onChange={(event) =>
                      setLastName(event.target.value)
                    }
                    placeholder="Nom"
                    disabled={saving}
                    required
                  />
                </label>
              </div>

              <label>
                Téléphone
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Optionnel"
                  disabled={saving}
                />
              </label>

              <label>
                Adresse e-mail
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Optionnel"
                  disabled={saving}
                />
              </label>

              <div className="publisher-publications-heading">
                <h3>Publications</h3>
                <p>
                  Indique la quantité commandée et la quantité déjà
                  distribuée.
                </p>
              </div>

              {loadingDetails ? (
                <p className="form-note">
                  Chargement des publications…
                </p>
              ) : publications.length === 0 ? (
                <p className="form-note">
                  Ajoute d’abord des publications dans l’inventaire.
                </p>
              ) : (
                <div className="publisher-publication-list">
                  {publications.map((publication) => {
                    const quantities =
                      publicationQuantities.find(
                        (item) =>
                          item.publicationId === publication.id,
                      ) ?? {
                        orderedQuantity: 0,
                        distributedQuantity: 0,
                      }

                    return (
                      <article
                        className="publisher-publication-card"
                        key={publication.id}
                      >
                        <div className="publisher-publication-title">
                          <span aria-hidden="true">📖</span>
                          <div>
                            <strong>{publication.name}</strong>
                            <small>
                              Stock disponible : {publication.stock}
                            </small>
                          </div>
                        </div>

                        <div className="publisher-quantity-grid">
                          <label>
                            Quantité commandée
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={quantities.orderedQuantity}
                              onChange={(event) =>
                                updatePublicationQuantity(
                                  publication.id,
                                  'orderedQuantity',
                                  event.target.value,
                                )
                              }
                              disabled={saving}
                            />
                          </label>

                          <label>
                            Quantité distribuée
                            <input
                              type="number"
                              min="0"
                              max={quantities.orderedQuantity}
                              inputMode="numeric"
                              value={quantities.distributedQuantity}
                              onChange={(event) =>
                                updatePublicationQuantity(
                                  publication.id,
                                  'distributedQuantity',
                                  event.target.value,
                                )
                              }
                              disabled={saving}
                            />
                          </label>
                        </div>

                        <div className="publisher-distribution-status">
                          {quantities.orderedQuantity === 0
                            ? 'Aucune commande'
                            : quantities.distributedQuantity >=
                                quantities.orderedQuantity
                              ? '✓ Distribution terminée'
                              : `${
                                  quantities.orderedQuantity -
                                  quantities.distributedQuantity
                                } exemplaire(s) à distribuer`}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              <div className="publisher-special-requests">
                <div>
                  <span aria-hidden="true">📚</span>
                  <div>
                    <strong>Demandes spéciales</strong>
                    <small>
                      Cette partie sera ajoutée à l’étape suivante.
                    </small>
                  </div>
                </div>
              </div>

              {formError && (
                <p className="form-message form-message--error">
                  {formError}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={saving || loadingDetails}
              >
                {saving ? 'Enregistrement…' : '💾 Enregistrer'}
              </button>

              {selectedPublisher && (
                <button
                  className="sheet-close publisher-delete-button"
                  type="button"
                  onClick={removePublisher}
                  disabled={saving}
                >
                  Supprimer le proclamateur
                </button>
              )}

              <button
                className="sheet-close"
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                Annuler
              </button>
            </form>
          </section>
        </div>
      )}

      <BottomNav
        active="Proclamateurs"
        onChange={handleNavigation}
        isAdmin={isAdmin}
      />
    </section>
  )
}

export default Publishers


