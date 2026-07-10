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

function Inventory({ publications, movements, onAdd, onChangeStock, onNavigate }) {
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [movementType, setMovementType] = useState(null)
  const [quantity, setQuantity] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [name, setName] = useState('')
  const [stock, setStock] = useState('')
  const [minimum, setMinimum] = useState('10')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const selectedPublication = publications.find((item) => item.id === selected)
  const publicationHistory = useMemo(
    () => movements.filter((item) => item.publicationId === selected),
    [movements, selected],
  )

  const submitPublication = async (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName || saving) return

    setSaving(true)
    setFormError('')

    try {
      await onAdd({
        name: cleanName,
        stock: Math.max(0, Number(stock) || 0),
        minimum: Math.max(0, Number(minimum) || 10),
      })
      setName('')
      setStock('')
      setMinimum('10')
      setShowAdd(false)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const submitMovement = async (event) => {
    event.preventDefault()
    const parsedQuantity = Math.max(0, Number(quantity) || 0)
    if (!selectedPublication || parsedQuantity === 0 || saving) return

    setSaving(true)
    setFormError('')

    try {
      const amount = movementType === 'add' ? parsedQuantity : -parsedQuantity
      await onChangeStock(selectedPublication.id, amount)
      setQuantity('')
      setMovementType(null)
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const closeDetails = () => {
    if (saving) return
    setSelected(null)
    setMovementType(null)
    setQuantity('')
    setShowHistory(false)
    setFormError('')
  }

  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
  }

  return (
    <section className="phone-page dashboard-page inventory-page">
      <header className="inventory-header">
        <div>
          <p>PubliService</p>
          <h1>Inventaire</h1>
        </div>
        <button className="inventory-add-button" type="button" onClick={() => { setFormError(''); setShowAdd(true) }}>
          <PlusIcon />
          <span>Ajouter</span>
        </button>
      </header>

      <div className="inventory-content">
        <div className="inventory-summary">
          <span>{publications.length} publications</span>
          <strong>{publications.reduce((sum, item) => sum + item.stock, 0)} exemplaires</strong>
        </div>

        <div className="publication-list">
          {publications.map((publication) => {
            const low = publication.stock <= publication.minimum
            return (
              <button
                className="publication-card"
                type="button"
                key={publication.id}
                onClick={() => { setFormError(''); setSelected(publication.id) }}
              >
                <span className="publication-icon"><BookIcon /></span>
                <span className="publication-info">
                  <strong>{publication.name}</strong>
                  <small>Stock actuel</small>
                </span>
                <span className={`stock-pill ${low ? 'stock-pill--low' : ''}`}>{publication.stock}</span>
                <span className="publication-chevron">›</span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedPublication && (
        <div className="sheet-backdrop" onClick={closeDetails}>
          <section className="detail-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="detail-title">
              <span><BookIcon /></span>
              <div><small>Publication</small><h2>{selectedPublication.name}</h2></div>
            </div>
            <div className="stock-display">
              <small>Stock actuel</small>
              <strong>{selectedPublication.stock}</strong>
            </div>

            {formError && <p className="form-message form-message--error">{formError}</p>}

            {!movementType && !showHistory && (
              <>
                <div className="stock-actions">
                  <button type="button" onClick={() => { setFormError(''); setMovementType('add') }}>+ Ajouter du stock</button>
                  <button type="button" onClick={() => { setFormError(''); setMovementType('remove') }} disabled={selectedPublication.stock === 0}>− Distribuer</button>
                </div>
                <button className="history-button" type="button" onClick={() => setShowHistory(true)}>Voir l’historique</button>
              </>
            )}

            {movementType && (
              <form className="movement-form" onSubmit={submitMovement}>
                <h3>{movementType === 'add' ? 'Ajouter du stock' : 'Distribuer'}</h3>
                <label>
                  Quantité
                  <input
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={movementType === 'remove' ? selectedPublication.stock : undefined}
                    placeholder="0"
                    autoFocus
                    disabled={saving}
                  />
                </label>
                <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Valider'}</button>
                <button className="sheet-close" type="button" disabled={saving} onClick={() => { setMovementType(null); setQuantity(''); setFormError('') }}>Retour</button>
              </form>
            )}

            {showHistory && (
              <div className="publication-history">
                <div className="history-heading"><h3>Historique</h3><button type="button" onClick={() => setShowHistory(false)}>Retour</button></div>
                {publicationHistory.length === 0 ? (
                  <p className="empty-history">Aucun mouvement pour cette publication.</p>
                ) : publicationHistory.map((item) => (
                  <article className="history-row" key={item.id}>
                    <span className={item.amount > 0 ? 'history-amount history-amount--positive' : 'history-amount history-amount--negative'}>
                      {item.amount > 0 ? '+' : '−'}{Math.abs(item.amount)}
                    </span>
                    <div><strong>{item.type}</strong><small>{formatMovementDate(item.createdAt)}</small></div>
                  </article>
                ))}
              </div>
            )}

            {!movementType && <button className="sheet-close" type="button" onClick={closeDetails}>Fermer</button>}
          </section>
        </div>
      )}

      {showAdd && (
        <div className="sheet-backdrop" onClick={() => { if (!saving) setShowAdd(false) }}>
          <section className="detail-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h2>Ajouter une publication</h2>
            <form className="publication-form" onSubmit={submitPublication}>
              <label>Nom de la publication<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Brochure" autoFocus disabled={saving} /></label>
              <label>Stock initial<input value={stock} onChange={(event) => setStock(event.target.value)} inputMode="numeric" type="number" min="0" placeholder="0" disabled={saving} /></label>
              <label>Seuil de stock faible<input value={minimum} onChange={(event) => setMinimum(event.target.value)} inputMode="numeric" type="number" min="0" disabled={saving} /></label>
              <p className="form-note">Le seuil est prérempli à 10, mais tu peux le modifier.</p>
              {formError && <p className="form-message form-message--error">{formError}</p>}
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Ajout…' : 'Ajouter à l’inventaire'}</button>
              <button className="sheet-close" type="button" disabled={saving} onClick={() => { setShowAdd(false); setFormError('') }}>Annuler</button>
            </form>
          </section>
        </div>
      )}

      <BottomNav active="Stock" onChange={handleNavigation} />
    </section>
  )
}

export default Inventory
