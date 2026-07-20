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
  'Français',
  'Néerlandais',
  'Anglais',
  'Espagnol',
  'Italien',
]

const FORMATS = ['Standard', 'Grand Caractère']

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

function Inventory({
  publications = [],
  movements = [],
  onAdd,
  onChangeStock,
  onDelete,
  onNavigate,
  isAdmin = false,
}) {
  const [selectedId, setSelectedId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [movementType, setMovementType] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const [publicationName, setPublicationName] = useState('')
  const [publicationLanguage, setPublicationLanguage] = useState('')
  const [publicationFormat, setPublicationFormat] = useState('Standard')
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

  const totalStock = publications.reduce(
    (total, publication) =>
      total + Number(publication.stock ?? 0),
    0,
  )


  const resetAddForm = () => {
    setPublicationName('')
    setPublicationLanguage('')
    setPublicationFormat('Standard')
    setPublicationMonth('')
    setPublicationYear('2026')
    setInitialStock('')
    setFormError('')
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

    const cleanPublicationName = publicationName.trim()

    if (
      !cleanPublicationName ||
      !publicationLanguage ||
      !publicationFormat ||
      !publicationMonth ||
      !publicationYear ||
      initialStock === ''
    ) {
      setFormError('Complète tous les champs de la publication.')
      return
    }

    const monthNumber = String(publicationMonth).padStart(2, '0')
    const cleanName = `${cleanPublicationName} - ${publicationLanguage} - ${publicationFormat} - ${monthNumber}/${publicationYear}`
    const cleanStock = Math.max(
      0,
      Number(initialStock) || 0,
    )

    const alreadyExists = publications.some(
      (publication) =>
        publication.name.trim().toLocaleLowerCase('fr') ===
        cleanName.toLocaleLowerCase('fr'),
    )

    if (alreadyExists) {
      setFormError('Cette publication existe déjà pour ce mois et cette année.')
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const normalizedName = cleanPublicationName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('fr')

      const detectedPublicationType = normalizedName.includes('tour de garde')
        ? 'watchtower'
        : normalizedName.includes('cahier') &&
            (normalizedName.includes('vie') || normalizedName.includes('ministere'))
          ? 'workbook'
          : 'specific_request'

      const languageMap = {
        'Français': 'fr',
        'Italien': 'it',
        'Néerlandais': 'nl',
        'Anglais': 'en',
        'Espagnol': 'es',
      }

      const publicationLanguageCode =
        languageMap[publicationLanguage] ?? 'other'
      const publicationFormatCode =
        publicationFormat === 'Grand Caractère' ? 'large' : 'standard'

      await onAdd({
        name: cleanName,
        stock: cleanStock,
        publicationType: detectedPublicationType,
        language: publicationLanguageCode,
        format: publicationFormatCode,
        month: Number(publicationMonth),
        year: Number(publicationYear),
      })

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

    const cleanQuantity = Math.max(
      0,
      Number(quantity) || 0,
    )

    if (cleanQuantity === 0) {
      setFormError('Indique une quantité supérieure à zéro.')
      return
    }

    if (
      movementType === 'remove' &&
      cleanQuantity > selectedPublication.stock
    ) {
      setFormError(
        'La quantité distribuée dépasse le stock disponible.',
      )
      return
    }

    const amount =
      movementType === 'add'
        ? cleanQuantity
        : -cleanQuantity

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
    if (!selectedPublication || saving) return

    const confirmed = window.confirm(
      'Supprimer définitivement « ' +
        selectedPublication.name +
        ' » ?',
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
          <h1>Inventaire</h1>
        </div>

        <div className="header-actions">
          <button
            className="inventory-add-button"
            type="button"
            onClick={() => {
              resetAddForm()
              setShowAddForm(true)
            }}
          >
            <PlusIcon />
            <span>Ajouter</span>
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
            {publications.length > 1
              ? 'publications'
              : 'publication'}
          </span>

          <strong>
            {totalStock}{' '}
            {totalStock > 1 ? 'exemplaires' : 'exemplaire'}
          </strong>
        </div>

        {publications.length === 0 ? (
          <div className="publishers-empty">
            <span className="publishers-empty__icon">
              <BookIcon />
            </span>

            <h2>Aucune publication</h2>

            <p>
              Les publications ajoutées apparaîtront ici.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() => setShowAddForm(true)}
            >
              Ajouter une publication
            </button>
          </div>
        ) : (
          <div className="publication-list">
            {publications.map((publication) => (
              <button
                className="publication-card"
                type="button"
                key={publication.id}
                onClick={() =>
                  openPublicationDetails(publication.id)
                }
              >
                <span className="publication-icon">
                  <BookIcon />
                </span>

                <span className="publication-info">
                  <strong>{publication.name}</strong>
                  <small>Stock actuel</small>
                </span>

                <span
                  className={`stock-pill ${
                    publication.stock === 0
                      ? 'stock-pill--low'
                      : ''
                  }`}
                >
                  {publication.stock}
                </span>

                <span className="publication-chevron">›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPublication && (
        <div
          className="sheet-backdrop"
          onClick={closePublicationDetails}
        >
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
              <p className="form-message form-message--error">
                {formError}
              </p>
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

                <button
                  className="sheet-close publisher-delete-button"
                  type="button"
                  onClick={removeSelectedPublication}
                  disabled={saving}
                >
                  Supprimer la publication
                </button>

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
              <form
                className="movement-form"
                onSubmit={submitMovement}
              >
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
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
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

                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                  >
                    Retour
                  </button>
                </div>

                {publicationHistory.length === 0 ? (
                  <p className="empty-history">
                    Aucun mouvement pour cette publication.
                  </p>
                ) : (
                  publicationHistory.map((movement) => (
                    <article
                      className="history-row"
                      key={movement.id}
                    >
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
                          {formatMovementDate(
                            movement.createdAt,
                          )}
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
        <div
          className="sheet-backdrop"
          onClick={closeAddForm}
        >
          <section
            className="detail-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />

            <h2>Ajouter une publication</h2>

            <form
              className="publication-form"
              onSubmit={submitPublication}
            >
              <label>
                Nom de la publication
                <input
                  value={publicationName}
                  onChange={(event) =>
                    setPublicationName(event.target.value)
                  }
                  placeholder="Ex. Tour de garde d’étude"
                  autoFocus
                  disabled={saving}
                  required
                />
              </label>

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
                    <option key={language} value={language}>
                      {language}
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
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </label>

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

              <label>
                Quantité commandée
                <input
                  value={initialStock}
                  onChange={(event) =>
                    setInitialStock(event.target.value)
                  }
                  inputMode="numeric"
                  type="number"
                  min="0"
                  placeholder="0"
                  disabled={saving}
                />
              </label>

              {publicationName.trim() &&
                publicationLanguage &&
                publicationFormat &&
                publicationMonth && (
                  <p className="publication-preview">
                    <span>Aperçu</span>
                    <strong>
                      {publicationName.trim()} - {publicationLanguage} -{' '}
                      {publicationFormat} -{' '}
                      {String(publicationMonth).padStart(2, '0')}/
                      {publicationYear}
                    </strong>
                  </p>
                )}

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
                  ? 'Ajout…'
                  : 'Créer la publication'}
              </button>

              <button
                className="sheet-close"
                type="button"
                disabled={saving}
                onClick={closeAddForm}
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

