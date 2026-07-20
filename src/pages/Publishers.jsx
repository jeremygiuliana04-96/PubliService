import { useEffect, useMemo, useState } from 'react'
import SideMenu from '../components/SideMenu'
import {
  PUBLISHER_PREFERENCE_GROUPS,
  getPublisherDistributionHistory,
  getPublisherPreferences,
  saveAllPublisherPreferences,
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

const getAllPreferenceOptions = () =>
  PUBLISHER_PREFERENCE_GROUPS.flatMap((group) => group.options)

const createEmptyPreferences = () =>
  getAllPreferenceOptions().map((option) => ({
    preferenceKey: option.key,
    publicationType: option.publicationType,
    language: option.language,
    format: option.format,
    quantity: 0,
  }))

function Publishers({
  publishers = [],
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
  const [preferences, setPreferences] = useState(
    createEmptyPreferences,
  )

  const [saving, setSaving] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [formError, setFormError] = useState('')
  const [distributionHistory, setDistributionHistory] = useState([])
  const [detailTab, setDetailTab] = useState('preferences')

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


  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setPhone('')
    setEmail('')
    setSelectedPublisher(null)
    setPreferences(createEmptyPreferences())
    setFormError('')
    setDistributionHistory([])
    setDetailTab('preferences')
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
    setPreferences(createEmptyPreferences())
    setFormError('')
    setShowForm(true)
    setDetailTab('preferences')
    setLoadingDetails(true)

    try {
      const [savedPreferences, history] = await Promise.all([
        getPublisherPreferences(
          publisher.id,
          currentAssembly?.id,
          currentAssembly?.code,
        ),
        getPublisherDistributionHistory(
          publisher.id,
          currentAssembly?.id,
          currentAssembly?.code,
        ),
      ])

      setPreferences(
        createEmptyPreferences().map((preference) => {
          const saved = savedPreferences.find(
            (item) => item.preferenceKey === preference.preferenceKey,
          )

          return {
            ...preference,
            quantity: saved?.quantity ?? 0,
          }
        }),
      )
      setDistributionHistory(history)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setLoadingDetails(false)
    }
  }

  useEffect(() => {
    const publisherId = sessionStorage.getItem(
      'publiservice-open-publisher',
    )

    if (!publisherId || publishers.length === 0) return

    const publisher = publishers.find(
      (item) => String(item.id) === String(publisherId),
    )

    if (!publisher) return

    sessionStorage.removeItem('publiservice-open-publisher')
    openEditForm(publisher)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishers])

  const closeForm = () => {
    if (saving) return

    setShowForm(false)
    resetForm()
  }

  const updatePreferenceQuantity = (preferenceKey, value) => {
  const cleanValue = String(value).replace(/\D/g, '')

  const quantity =
    cleanValue === ''
      ? ''
      : Math.min(10, Math.max(0, Number(cleanValue)))

  setPreferences((items) =>
    items.map((item) =>
      item.preferenceKey === preferenceKey
        ? { ...item, quantity }
        : item,
    ),
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
      const savedPublisher = selectedPublisher
        ? await onUpdate(selectedPublisher.id, publisherData)
        : await onAdd(publisherData)

      await saveAllPublisherPreferences(
        savedPublisher.id,
        preferences.map((preference) => ({
          ...preference,
          quantity: Number(preference.quantity) || 0,
        })),
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

        <div className="header-actions">
          <button
            className="inventory-add-button"
            type="button"
            onClick={openAddForm}
          >
            <span aria-hidden="true">＋</span>
            Ajouter
          </button>

          <SideMenu
            activeScreen="publishers"
            onNavigate={onNavigate}
            isAdmin={isAdmin}
          />
        </div>
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

              {selectedPublisher && (
                <div className="publisher-detail-tabs" role="tablist">
                  <button
                    type="button"
                    className={detailTab === 'preferences' ? 'is-active' : ''}
                    onClick={() => setDetailTab('preferences')}
                    role="tab"
                    aria-selected={detailTab === 'preferences'}
                  >
                    Publications
                  </button>
                  <button
                    type="button"
                    className={detailTab === 'history' ? 'is-active' : ''}
                    onClick={() => setDetailTab('history')}
                    role="tab"
                    aria-selected={detailTab === 'history'}
                  >
                    Historique
                  </button>
                </div>
              )}

              {(!selectedPublisher || detailTab === 'preferences') && (
                <>
                  <div className="publisher-publications-heading">
                    <h3>Quantités habituelles</h3>
                    <p>
                      Plusieurs publications peuvent être attribuées au même
                      proclamateur. Les quantités sont reprises pour chaque
                      nouvelle parution correspondante.
                    </p>
                  </div>

                  {loadingDetails ? (
                    <p className="form-note">
                      Chargement des préférences…
                    </p>
                  ) : (
                    <div className="publisher-preference-groups">
                      {PUBLISHER_PREFERENCE_GROUPS.map((group) => (
                        <section
                          className="publisher-preference-group"
                          key={group.key}
                        >
                          <h3>
                            <span aria-hidden="true">{group.icon}</span>{' '}
                            {group.label}
                          </h3>

                          <div className="publisher-preference-list">
                            {group.options.map((option) => {
                              const preference = preferences.find(
                                (item) =>
                                  item.preferenceKey === option.key,
                              )

                              return (
                                <label
                                  className="publisher-preference-row"
                                  key={option.key}
                                >
                                  <span>{option.label}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    inputMode="numeric"
                                    value={preference?.quantity ?? ''}
                                    onFocus={(event) => {
                                      if (event.target.value === '0') {
                                        updatePreferenceQuantity(option.key, '')
                                      }
                                    }}
                                    onChange={(event) =>
                                      updatePreferenceQuantity(
                                        option.key,
                                        event.target.value,
                                      )
                                    }
                                    onBlur={(event) => {
                                      if (event.target.value === '') {
                                        updatePreferenceQuantity(option.key, '0')
                                      }
                                    }}
                                    disabled={saving}
                                    aria-label={`${group.label} — ${option.label}`}
                                  />
                                </label>
                              )
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </>
              )}

              {selectedPublisher && detailTab === 'history' && (
                <div className="publisher-history-section">
                  <div className="publisher-publications-heading">
                    <h3>Publications distribuées</h3>
                    <p>Uniquement les publications réellement remises.</p>
                  </div>

                  {loadingDetails ? (
                    <p className="form-note">Chargement de l’historique…</p>
                  ) : distributionHistory.length === 0 ? (
                    <div className="publisher-history-empty">
                      Aucune publication distribuée pour le moment.
                    </div>
                  ) : (
                    <div className="publisher-history-list">
                      {distributionHistory.map((item) => (
                        <article
                          className="publisher-history-row"
                          key={item.distributionId}
                        >
                          <span
                            className="publisher-history-icon"
                            aria-hidden="true"
                          >
                            {item.publicationType === 'workbook' ? '📗' : '📘'}
                          </span>

                          <span className="publisher-history-information">
                            <strong>{item.publicationName}</strong>
                            <small>
                              {item.quantity > 1
                                ? `${item.quantity} exemplaires`
                                : '1 exemplaire'}
                            </small>
                          </span>

                          <time dateTime={item.distributedAt ?? undefined}>
                            {item.distributedAt
                              ? new Intl.DateTimeFormat('fr-BE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                }).format(new Date(item.distributedAt))
                              : '—'}
                          </time>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
    </section>
  )
}

export default Publishers
