import { useMemo, useState } from 'react'
import BottomNav from '../components/BottomNav'
import { BookIcon, PlusIcon } from '../components/Icons'

const formatMovementDate = (value) =>
  new Intl.DateTimeFormat('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

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

  const [name, setName] = useState('')
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

  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
    if (label === 'Publications') onNavigate('inventory')
  if (label === 'Distribution') onNavigate('distribution')
    if (label === 'Proclamateurs') onNavigate('publishers')
    if (label === 'Assemblée') onNavigate('assemblies')
    if (label === 'Plus') onNavigate('more')
  }

  const resetAddForm = () => {
    setName('')
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

    const cleanName = name.trim()
    const cleanStock = Math.max(
      0,
      Number(initialStock) || 0,
    )

    if (!cleanName || saving) return

    setSaving(true)
    setFormError('')

    try {
      await onAdd({
        name: cleanName,
        stock: cleanStock,
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
      setFormError('Indique une quantitÃ© supÃ©rieure Ã  zÃ©ro.')
      return
    }

    if (
      movementType === 'remove' &&
      cleanQuantity > selectedPublication.stock
    ) {
      setFormError(
        'La quantitÃ© distribuÃ©e dÃ©passe le stock disponible.',
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
      'Supprimer dÃ©finitivement Â« ' +
        selectedPublication.name +
        ' Â» ?',
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
              Les publications ajoutÃ©es apparaÃ®tront ici.
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
                  Voir lâ€™historique
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
                  QuantitÃ©
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
                  {saving ? 'Enregistrementâ€¦' : 'Valider'}
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
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Ex. Brochure"
                  autoFocus
                  disabled={saving}
                  required
                />
              </label>

              <label>
                Stock initial
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
                  ? 'Ajoutâ€¦'
                  : 'Ajouter Ã  lâ€™inventaire'}
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

      <BottomNav
        active="Publications"
        onChange={handleNavigation}
        isAdmin={isAdmin}
      />
    </section>
  )
}

export default Inventory

