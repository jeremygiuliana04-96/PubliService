import { useMemo, useState } from 'react'
import SideMenu from '../components/SideMenu'
import { BookIcon, PlusIcon } from '../components/Icons'

const formatMovementDate = (value) =>
  new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'nl', label: 'Néerlandais' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'it', label: 'Italien' },
]

const FORMATS = [
  { value: 'standard', label: 'Standard' },
  { value: 'large', label: 'Grand caractère' },
]

const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]

const YEARS = Array.from({ length: 25 }, (_, index) => 2026 + index)

const DEFAULT_PUBLICATION_NAMES = [
  'Cahier Vie et ministère',
  'Tour de Garde d’étude',
  'Tour de Garde publique',
  'Réveillez-vous !',
]

const normalizeText = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')

const getPublicationBaseName = (publication) => {
  const name = String(publication.name ?? '').trim()
  const normalizedName = normalizeText(name)

  if (
    normalizedName.includes('cahier') &&
    (normalizedName.includes('vie') ||
      normalizedName.includes('ministere'))
  ) {
    return 'Cahier Vie et ministère'
  }

  if (
    normalizedName.includes('tour de garde') &&
    (normalizedName.includes('publique') ||
      normalizedName.includes('public'))
  ) {
    return 'Tour de Garde publique'
  }

  if (normalizedName.includes('tour de garde')) {
    return 'Tour de Garde d’étude'
  }

  if (
    normalizedName.includes('reveillez-vous') ||
    normalizedName.includes('reveillez vous')
  ) {
    return 'Réveillez-vous !'
  }

  const languagePattern =
    '(Français|Néerlandais|Anglais|Espagnol|Italien)'
  const formatPattern =
    '(Standard|Grand caractère|Grands caractères|Large)'

  const baseName = name
    .replace(
      /\s+-\s+(?:\d{1,2}\/\d{4}|[A-Za-zÀ-ÖØ-öø-ÿ]+\s+\d{4})\s*$/u,
      '',
    )
    .replace(
      new RegExp(`\\s+-\\s+${formatPattern}\\s*$`, 'iu'),
      '',
    )
    .replace(
      new RegExp(
        `\\s+-\\s+${languagePattern}(?:\\s*\\([^)]*\\))?\\s*$`,
        'iu',
      ),
      '',
    )
    .trim()

  return baseName || name || 'Autres publications'
}

const getPublicationCategory = (publication) => {
  const type = normalizeText(publication.publicationType)
  const name = normalizeText(publication.name)

  if (
    type === 'workbook' ||
    (name.includes('cahier') &&
      (name.includes('vie') || name.includes('ministere')))
  ) {
    return {
      value: 'workbook',
      label: 'Cahier Vie et ministère',
      order: 0,
    }
  }

  if (
    type === 'public_watchtower' ||
    (name.includes('tour de garde') &&
      (name.includes('publique') || name.includes('public')))
  ) {
    return {
      value: 'public_watchtower',
      label: 'Tour de Garde publique',
      order: 2,
    }
  }

  if (type === 'watchtower' || name.includes('tour de garde')) {
    return {
      value: 'watchtower',
      label: 'Tour de Garde d’étude',
      order: 1,
    }
  }

  if (
    type === 'awake' ||
    name.includes('reveillez-vous') ||
    name.includes('reveillez vous')
  ) {
    return {
      value: 'awake',
      label: 'Réveillez-vous !',
      order: 3,
    }
  }

  const label = getPublicationBaseName(publication)

  return {
    value: `custom:${normalizeText(label)}`,
    label,
    order: 4,
  }
}

const comparePublicationDates = (left, right) => {
  const leftYear = Number(left.year) || 0
  const rightYear = Number(right.year) || 0

  if (leftYear !== rightYear) return leftYear - rightYear

  const leftMonth = Number(left.month) || 0
  const rightMonth = Number(right.month) || 0

  if (leftMonth !== rightMonth) return leftMonth - rightMonth

  return left.name.localeCompare(right.name, 'fr')
}

const getPublicationMetadata = (publication, hasDate = true) => {
  const language =
    LANGUAGES.find((item) => item.value === publication.language)?.label ??
    publication.language ??
    'Langue non précisée'
  const format =
    FORMATS.find((item) => item.value === publication.format)?.label ??
    publication.format ??
    'Format non précisé'
  const month =
    MONTHS.find(
      (item) => Number(item.value) === Number(publication.month),
    )?.label
  const period =
    month && publication.year
      ? `${month} ${publication.year}`
      : publication.year || 'Date non précisée'

  return hasDate
    ? `${period} · ${language} · ${format}`
    : `${language} · ${format}`
}

function Inventory({
  publications = [],
  publicationCatalog = [],
  movements = [],
  onAdd,
  onAddCatalogEntry,
  onChangeStock,
  onDelete,
  onNavigate,
  isAdmin = false,
}) {
  const [selectedId, setSelectedId] = useState(null)
  const [openCategory, setOpenCategory] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [movementType, setMovementType] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const [publicationType, setPublicationType] = useState('')
  const [newPublicationName, setNewPublicationName] = useState('')
  const [newPublicationHasDate, setNewPublicationHasDate] =
    useState('yes')
  const [publicationLanguage, setPublicationLanguage] = useState('')
  const [publicationFormat, setPublicationFormat] = useState('standard')
  const [publicationMonth, setPublicationMonth] = useState('')
  const [publicationYear, setPublicationYear] = useState('2026')
  const [initialStock, setInitialStock] = useState('')

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const selectedPublication = publications.find(
    (publication) => publication.id === selectedId,
  )

  const publicationHistory = useMemo(
    () =>
      movements.filter(
        (movement) => movement.publicationId === selectedId,
      ),
    [movements, selectedId],
  )

  const groupedPublications = useMemo(() => {
    const groups = new Map()

    publications.forEach((publication) => {
      const category = getPublicationCategory(publication)
      const current = groups.get(category.value)

      if (current) {
        current.publications.push(publication)
        return
      }

      groups.set(category.value, {
        ...category,
        publications: [publication],
      })
    })

    return [...groups.values()]
      .map((category) => ({
        ...category,
        publications: category.publications.sort(comparePublicationDates),
      }))
      .sort(
        (left, right) =>
          left.order - right.order ||
          left.label.localeCompare(right.label, 'fr'),
      )
  }, [publications])

  const availableCatalogEntries = useMemo(() => {
    const entries = new Map()

    DEFAULT_PUBLICATION_NAMES.forEach((name) => {
      entries.set(normalizeText(name), {
        name,
        hasDate: true,
      })
    })

    publications.forEach((publication) => {
      const name = getPublicationBaseName(publication)
      const category = getPublicationCategory(publication)

      entries.set(normalizeText(name), {
        name,
        hasDate: category.order < 4,
      })
    })

    publicationCatalog.forEach((entry) => {
      const name = getPublicationBaseName({
        name: entry.name,
      })

      if (name && entry.isActive !== false) {
        entries.set(normalizeText(name), {
          ...entry,
          name,
          hasDate: Boolean(entry.hasDate),
        })
      }
    })

    return [...entries.values()].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr'),
    )
  }, [publicationCatalog, publications])

  const selectedCatalogEntry = availableCatalogEntries.find(
    (entry) => entry.name === publicationType,
  )
  const publicationHasDate =
    publicationType === '__new__'
      ? newPublicationHasDate === 'yes'
      : selectedCatalogEntry?.hasDate ?? true

  const publicationHasDateInCatalog = (publication) => {
    const baseName = normalizeText(getPublicationBaseName(publication))
    const entry = availableCatalogEntries.find(
      (item) => normalizeText(item.name) === baseName,
    )

    return entry?.hasDate ?? getPublicationCategory(publication).order < 4
  }

  const totalStock = publications.reduce(
    (total, publication) => total + Number(publication.stock ?? 0),
    0,
  )

  const resetAddForm = () => {
    setPublicationType('')
    setNewPublicationName('')
    setNewPublicationHasDate('yes')
    setPublicationLanguage('')
    setPublicationFormat('standard')
    setPublicationMonth('')
    setPublicationYear('2026')
    setInitialStock('')
    setFormError('')
  }

  const openAddForm = () => {
    resetAddForm()
    setShowAddForm(true)
  }

  const closeAddForm = () => {
    if (saving) return

    setShowAddForm(false)
    resetAddForm()
  }

  const openPublicationDetails = (publicationId) => {
    setFormError('')
    setMovementType(null)
    setQuantity('')
    setShowHistory(false)
    setSelectedId(publicationId)
  }

  const closePublicationDetails = () => {
    if (saving) return

    setSelectedId(null)
    setMovementType(null)
    setQuantity('')
    setShowHistory(false)
    setFormError('')
  }

  const submitPublication = async (event) => {
    event.preventDefault()

    if (saving) return

    if (
      !publicationType ||
      !publicationLanguage ||
      !publicationFormat ||
      (publicationHasDate &&
        (!publicationMonth || !publicationYear)) ||
      initialStock === ''
    ) {
      setFormError('Complète tous les champs de la publication.')
      return
    }

    const cleanPublicationName =
      publicationType === '__new__'
        ? newPublicationName.trim()
        : publicationType.trim()
    const cleanStock = Math.max(0, Number(initialStock) || 0)
    const language = LANGUAGES.find(
      (item) => item.value === publicationLanguage,
    )
    const format = FORMATS.find(
      (item) => item.value === publicationFormat,
    )
    const month = publicationHasDate
      ? MONTHS.find((item) => item.value === publicationMonth)
      : null

    if (
      !cleanPublicationName ||
      !language ||
      !format ||
      (publicationHasDate && !month)
    ) {
      setFormError('La publication sélectionnée est invalide.')
      return
    }

    const cleanName = publicationHasDate
      ? `${cleanPublicationName} - ${language.label} - ${format.label} - ${month.label} ${publicationYear}`
      : `${cleanPublicationName} - ${language.label} - ${format.label}`
    const normalizedPublicationName = normalizeText(cleanPublicationName)
    const detectedPublicationType =
      normalizedPublicationName.includes('tour de garde') &&
      !normalizedPublicationName.includes('publique')
        ? 'watchtower'
        : normalizedPublicationName.includes('cahier') &&
            (normalizedPublicationName.includes('vie') ||
              normalizedPublicationName.includes('ministere'))
          ? 'workbook'
          : 'specific_request'
    const existingPublication = publications.find(
      (publication) =>
        normalizeText(publication.name) === normalizeText(cleanName) ||
        (normalizeText(getPublicationBaseName(publication)) ===
          normalizedPublicationName &&
          publication.language === publicationLanguage &&
          publication.format === publicationFormat &&
          (!publicationHasDate ||
            (Number(publication.month) === Number(publicationMonth) &&
              Number(publication.year) === Number(publicationYear)))),
    )

    if (publicationType === '__new__' && !isAdmin) {
      setFormError(
        'Seul un administrateur peut créer un nouveau nom de publication.',
      )
      return
    }

    if (!isAdmin && cleanStock === 0) {
      setFormError('Indique une quantité supérieure à zéro.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      if (publicationType === '__new__' && isAdmin) {
        await onAddCatalogEntry({
          name: cleanPublicationName,
          hasDate: publicationHasDate,
        })
      }

      if (existingPublication) {
        if (cleanStock === 0) {
          throw new Error(
            'Cette édition existe déjà. Indique une quantité à ajouter.',
          )
        }

        await onChangeStock(existingPublication.id, cleanStock)
      } else {
        await onAdd({
          name: cleanName,
          stock: cleanStock,
          publicationType: detectedPublicationType,
          language: publicationLanguage,
          format: publicationFormat,
          month: publicationHasDate
            ? Number(publicationMonth)
            : 1,
          year: publicationHasDate
            ? Number(publicationYear)
            : new Date().getFullYear(),
        })
      }

      setShowAddForm(false)
      resetAddForm()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const submitMovement = async (event) => {
    event.preventDefault()

    if (!selectedPublication || saving) return

    const cleanQuantity = Math.max(0, Number(quantity) || 0)

    if (cleanQuantity === 0) {
      setFormError('Indique une quantité supérieure à zéro.')
      return
    }

    if (
      movementType === 'remove' &&
      cleanQuantity > selectedPublication.stock
    ) {
      setFormError('La quantité distribuée dépasse le stock disponible.')
      return
    }

    const amount = movementType === 'add' ? cleanQuantity : -cleanQuantity

    setSaving(true)
    setFormError('')

    try {
      await onChangeStock(selectedPublication.id, amount)
      setQuantity('')
      setMovementType(null)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const removeSelectedPublication = async () => {
    if (!selectedPublication || saving || !isAdmin) return

    const confirmed = window.confirm(
      `Supprimer définitivement « ${selectedPublication.name} » ?`,
    )

    if (!confirmed) return

    setSaving(true)
    setFormError('')

    try {
      await onDelete(selectedPublication.id)
      setSelectedId(null)
      setMovementType(null)
      setQuantity('')
      setShowHistory(false)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="phone-page dashboard-page inventory-page">
      <header className="inventory-header">
        <div>
          <p>PubliService</p>
          <h1>Stock</h1>
        </div>

        <div className="header-actions">
          <button
            className="inventory-add-button"
            type="button"
            onClick={openAddForm}
          >
            <PlusIcon />
            <span>{isAdmin ? 'Créer' : 'Ajouter'}</span>
          </button>

          <SideMenu
            activeScreen="inventory"
            onNavigate={onNavigate}
            isAdmin={isAdmin}
          />
        </div>
      </header>

      <div className="inventory-content">
        <div className="inventory-summary">
          <span>
            {publications.length}{' '}
            {publications.length > 1 ? 'publications' : 'publication'}
          </span>

          <strong>
            {totalStock} {totalStock > 1 ? 'exemplaires' : 'exemplaire'}
          </strong>
        </div>

        {publications.length === 0 ? (
          <div className="publishers-empty">
            <span className="publishers-empty__icon">
              <BookIcon />
            </span>

            <h2>Aucune publication</h2>

            <p>
              {isAdmin
                ? 'Crée la première publication pour cette assemblée.'
                : "L’administrateur doit d’abord définir les publications de cette assemblée."}
            </p>

            {isAdmin && (
              <button
                className="primary-button"
                type="button"
                onClick={openAddForm}
              >
                Créer une publication
              </button>
            )}
          </div>
        ) : (
          <div className="inventory-categories">
            {groupedPublications.map((category) => {
              const isOpen = openCategory === category.value
              const categoryStock = category.publications.reduce(
                (total, publication) =>
                  total + Number(publication.stock ?? 0),
                0,
              )

              return (
                <section className="inventory-category" key={category.value}>
                  <button
                    className="inventory-category-button"
                    type="button"
                    onClick={() =>
                      setOpenCategory(isOpen ? null : category.value)
                    }
                    aria-expanded={isOpen}
                  >
                    <span className="publication-icon">
                      <BookIcon />
                    </span>

                    <span className="inventory-category-info">
                      <strong>{category.label}</strong>
                      <small>
                        {category.publications.length}{' '}
                        {category.publications.length > 1
                          ? 'publications'
                          : 'publication'}{' '}
                        · {categoryStock} en stock
                      </small>
                    </span>

                    <span
                      className={`inventory-category-chevron${
                        isOpen ? ' inventory-category-chevron--open' : ''
                      }`}
                    >
                      ›
                    </span>
                  </button>

                  {isOpen && (
                    <div className="publication-list inventory-category-list">
                      {category.publications.map((publication) => (
                        <button
                          className="publication-card"
                          type="button"
                          key={publication.id}
                          onClick={() =>
                            openPublicationDetails(publication.id)
                          }
                        >
                          <span className="publication-info">
                            <strong>{publication.name}</strong>
                            <small>
                              {getPublicationMetadata(
                                publication,
                                publicationHasDateInCatalog(publication),
                              )}
                            </small>
                          </span>

                          <span className="stock-pill">
                            {publication.stock}
                          </span>

                          <span className="publication-chevron">›</span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>

      {selectedPublication && (
        <div className="sheet-backdrop" onClick={closePublicationDetails}>
          <section
            className="detail-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />

            <div className="detail-title">
              <span>
                <BookIcon />
              </span>

              <div>
                <small>Publication</small>
                <h2>{selectedPublication.name}</h2>
              </div>
            </div>

            <div className="stock-display">
              <small>Stock actuel</small>
              <strong>{selectedPublication.stock}</strong>
            </div>

            {formError && (
              <p className="form-message form-message--error">{formError}</p>
            )}

            {!movementType && !showHistory && (
              <>
                <div className="stock-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError('')
                      setQuantity('')
                      setMovementType('add')
                    }}
                  >
                    + Ajouter du stock
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormError('')
                      setQuantity('')
                      setMovementType('remove')
                    }}
                    disabled={selectedPublication.stock === 0}
                  >
                    − Distribuer
                  </button>
                </div>

                <button
                  className="history-button"
                  type="button"
                  onClick={() => {
                    setFormError('')
                    setShowHistory(true)
                  }}
                >
                  Voir l’historique
                </button>

                {isAdmin && (
                  <button
                    className="sheet-close publisher-delete-button"
                    type="button"
                    onClick={removeSelectedPublication}
                    disabled={saving}
                  >
                    Supprimer la publication
                  </button>
                )}

                <button
                  className="sheet-close"
                  type="button"
                  onClick={closePublicationDetails}
                  disabled={saving}
                >
                  Fermer
                </button>
              </>
            )}

            {movementType && (
              <form className="movement-form" onSubmit={submitMovement}>
                <h3>
                  {movementType === 'add'
                    ? 'Ajouter du stock'
                    : 'Distribuer'}
                </h3>

                <label>
                  Quantité
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={
                      movementType === 'remove'
                        ? selectedPublication.stock
                        : undefined
                    }
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="0"
                    autoFocus
                    disabled={saving}
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Enregistrement…' : 'Valider'}
                </button>

                <button
                  className="sheet-close"
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setMovementType(null)
                    setQuantity('')
                    setFormError('')
                  }}
                >
                  Retour
                </button>
              </form>
            )}

            {showHistory && (
              <div className="publication-history">
                <div className="history-heading">
                  <h3>Historique</h3>

                  <button type="button" onClick={() => setShowHistory(false)}>
                    Retour
                  </button>
                </div>

                {publicationHistory.length === 0 ? (
                  <p className="empty-history">
                    Aucun mouvement pour cette publication.
                  </p>
                ) : (
                  publicationHistory.map((movement) => (
                    <article className="history-row" key={movement.id}>
                      <span
                        className={
                          movement.amount > 0
                            ? 'history-amount history-amount--positive'
                            : 'history-amount history-amount--negative'
                        }
                      >
                        {movement.amount > 0 ? '+' : '−'}
                        {Math.abs(movement.amount)}
                      </span>

                      <div>
                        <strong>{movement.type}</strong>
                        <small>
                          {formatMovementDate(movement.createdAt)}
                        </small>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {showAddForm && (
        <div className="sheet-backdrop" onClick={closeAddForm}>
          <section
            className="detail-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />

            <h2>
              {isAdmin
                ? 'Créer une publication'
                : 'Ajouter au stock'}
            </h2>

            <form className="publication-form" onSubmit={submitPublication}>
                <label>
                  Publication
                  <select
                    value={publicationType}
                    onChange={(event) => {
                      setPublicationType(event.target.value)
                      setNewPublicationName('')
                    }}
                    autoFocus
                    disabled={saving}
                    required
                  >
                    <option value="">Sélectionner une publication</option>
                    {availableCatalogEntries.map((entry) => (
                      <option
                        key={normalizeText(entry.name)}
                        value={entry.name}
                      >
                        {entry.name}
                      </option>
                    ))}
                    {isAdmin && (
                      <option value="__new__">
                        + Créer une nouvelle publication
                      </option>
                    )}
                  </select>
                </label>

                {isAdmin && publicationType === '__new__' && (
                  <>
                    <label>
                      Nom de la publication
                      <input
                        value={newPublicationName}
                        onChange={(event) =>
                          setNewPublicationName(event.target.value)
                        }
                        placeholder="Ex. Bible"
                        autoFocus
                        disabled={saving}
                        required
                      />
                    </label>

                    <label>
                      Cette publication possède-t-elle une date ?
                      <select
                        value={newPublicationHasDate}
                        onChange={(event) =>
                          setNewPublicationHasDate(event.target.value)
                        }
                        disabled={saving}
                      >
                        <option value="yes">
                          Oui — demander le mois et l’année
                        </option>
                        <option value="no">
                          Non — publication sans date
                        </option>
                      </select>
                    </label>
                  </>
                )}

                <label>
                  Langue
                  <select
                    value={publicationLanguage}
                    onChange={(event) =>
                      setPublicationLanguage(event.target.value)
                    }
                    disabled={saving}
                    required
                  >
                    <option value="">Sélectionner une langue</option>
                    {LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Format
                  <select
                    value={publicationFormat}
                    onChange={(event) =>
                      setPublicationFormat(event.target.value)
                    }
                    disabled={saving}
                    required
                  >
                    {FORMATS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label}
                      </option>
                    ))}
                  </select>
                </label>

                {publicationHasDate && (
                  <div className="publication-period-fields">
                    <label>
                      Mois
                      <select
                        value={publicationMonth}
                        onChange={(event) =>
                          setPublicationMonth(event.target.value)
                        }
                        disabled={saving}
                        required
                      >
                        <option value="">Mois</option>
                        {MONTHS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Année
                      <select
                        value={publicationYear}
                        onChange={(event) =>
                          setPublicationYear(event.target.value)
                        }
                        disabled={saving}
                        required
                      >
                        {YEARS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                <label>
                  {isAdmin ? 'Stock initial' : 'Quantité reçue'}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={isAdmin ? '0' : '1'}
                    value={initialStock}
                    onChange={(event) => setInitialStock(event.target.value)}
                    placeholder="0"
                    disabled={saving}
                    required
                  />
                </label>

                <p className="form-note">
                  {isAdmin
                    ? 'Une nouvelle publication sera automatiquement ajoutée à cette liste pour l’assemblée sélectionnée.'
                    : 'Choisis la publication, sa langue, son format et sa date éventuelle avant d’ajouter la quantité reçue.'}
                </p>

                {formError && (
                  <p className="form-message form-message--error">
                    {formError}
                  </p>
                )}

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Enregistrement…'
                    : isAdmin
                      ? 'Enregistrer la publication'
                      : 'Ajouter au stock'}
                </button>

                <button
                  className="sheet-close"
                  type="button"
                  onClick={closeAddForm}
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

export default Inventory
