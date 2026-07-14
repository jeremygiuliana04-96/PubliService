import { useEffect, useState } from 'react'
import BottomNav from '../components/BottomNav'
import { AssemblyIcon, PlusIcon } from '../components/Icons'
import {
  archiveAssembly,
  createAssembly,
  getAssemblies,
  regenerateAssemblyCode,
  updateAssemblyName,
} from '../services/assemblyService'

function Assemblies({
  currentAssembly,
  onSelectAssembly,
  onNavigate,
}) {
  const [assemblies, setAssemblies] = useState([])
  const [selectedAssembly, setSelectedAssembly] =
    useState(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const [name, setName] = useState('')
  const [accessCode, setAccessCode] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadAssemblies = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAssemblies()
      setAssemblies(data)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssemblies()
  }, [])

  const handleNavigation = (label) => {
    if (label === 'Accueil') onNavigate('dashboard')
    if (label === 'Publications') onNavigate('inventory')
    if (label === 'Proclamateurs') onNavigate('publishers')
    if (label === 'Assemblée') onNavigate('assemblies')
    if (label === 'Plus') onNavigate('more')
  }

  const resetMessages = () => {
    setError('')
    setMessage('')
  }

  const openAddForm = () => {
    resetMessages()
    setName('')
    setAccessCode('')
    setShowAddForm(true)
  }

  const closeAddForm = () => {
    if (saving) return

    setShowAddForm(false)
    setName('')
    setAccessCode('')
    resetMessages()
  }

  const openAssemblyDetails = (assembly) => {
    resetMessages()
    setSelectedAssembly(assembly)
  }

  const closeAssemblyDetails = () => {
    if (saving) return

    setSelectedAssembly(null)
    setShowEditForm(false)
    setName('')
    resetMessages()
  }

  const submitAssembly = async (event) => {
    event.preventDefault()

    if (!name.trim() || saving) return

    setSaving(true)
    resetMessages()

    try {
      const created = await createAssembly({
        name,
        code: accessCode,
      })

      setAssemblies((items) =>
        [...items, created].sort((a, b) =>
          a.name.localeCompare(b.name, 'fr'),
        ),
      )

      onSelectAssembly(created)
      setShowAddForm(false)
      setName('')
      setAccessCode('')
    } catch (createError) {
      setError(createError.message)
    } finally {
      setSaving(false)
    }
  }

  const submitAssemblyName = async (event) => {
    event.preventDefault()

    if (!selectedAssembly || !name.trim() || saving) {
      return
    }

    setSaving(true)
    resetMessages()

    try {
      const updated = await updateAssemblyName(
        selectedAssembly.id,
        name,
      )

      const nextAssembly = {
        ...selectedAssembly,
        ...updated,
        code: selectedAssembly.code,
      }

      setAssemblies((items) =>
        items
          .map((item) =>
            item.id === selectedAssembly.id
              ? nextAssembly
              : item,
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name, 'fr'),
          ),
      )

      if (currentAssembly?.id === nextAssembly.id) {
        onSelectAssembly(nextAssembly)
      }

      setSelectedAssembly(nextAssembly)
      setShowEditForm(false)
      setMessage('Nom de l’assemblée modifié.')
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateCode = async () => {
    if (!selectedAssembly || saving) return

    const confirmed = window.confirm(
      'Régénérer le code d’accès ? L’ancien code ne fonctionnera plus.',
    )

    if (!confirmed) return

    setSaving(true)
    resetMessages()

    try {
      const newCode = await regenerateAssemblyCode(
        selectedAssembly.id,
      )

      const updatedAssembly = {
        ...selectedAssembly,
        code: newCode,
      }

      setAssemblies((items) =>
        items.map((item) =>
          item.id === selectedAssembly.id
            ? updatedAssembly
            : item,
        ),
      )

      setSelectedAssembly(updatedAssembly)
      setMessage('Nouveau code généré.')
    } catch (codeError) {
      setError(codeError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleArchiveAssembly = async () => {
    if (!selectedAssembly || saving) return

    if (assemblies.length <= 1) {
      setError(
        'Il faut conserver au moins une assemblée active.',
      )
      return
    }

    const confirmed = window.confirm(
      `Archiver l’assemblée « ${selectedAssembly.name} » ?`,
    )

    if (!confirmed) return

    setSaving(true)
    resetMessages()

    try {
      await archiveAssembly(selectedAssembly.id)

      const remainingAssemblies = assemblies.filter(
        (item) => item.id !== selectedAssembly.id,
      )

      setAssemblies(remainingAssemblies)

      if (currentAssembly?.id === selectedAssembly.id) {
        onSelectAssembly(remainingAssemblies[0])
      }

      setSelectedAssembly(null)
    } catch (archiveError) {
      setError(archiveError.message)
    } finally {
      setSaving(false)
    }
  }

  const copyCode = async () => {
    if (!selectedAssembly?.code) return

    try {
      await navigator.clipboard.writeText(
        selectedAssembly.code,
      )
      setMessage('Code copié.')
    } catch {
      setError('Impossible de copier le code.')
    }
  }

  return (
    <section className="phone-page dashboard-page assemblies-page">
      <header className="inventory-header">
        <div>
          <p>Administration</p>
          <h1>Assemblée</h1>
        </div>

        <button
          className="inventory-add-button"
          type="button"
          onClick={openAddForm}
        >
          <PlusIcon />
          <span>Ajouter</span>
        </button>
      </header>

      <div className="inventory-content">
        {error && (
          <p className="form-message form-message--error">
            {error}
          </p>
        )}

        {loading ? (
          <p className="empty-history">
            Chargement des assemblées…
          </p>
        ) : assemblies.length === 0 ? (
          <div className="publishers-empty">
            <span className="publishers-empty__icon">
              <AssemblyIcon />
            </span>

            <h2>Aucune assemblée</h2>

            <p>
              Ajoute une assemblée pour commencer.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={openAddForm}
            >
              Ajouter une assemblée
            </button>
          </div>
        ) : (
          <div className="publication-list">
            {assemblies.map((assembly) => {
              const isCurrent =
                currentAssembly?.id === assembly.id

              return (
                <button
                  className="publication-card assembly-card"
                  type="button"
                  key={assembly.id}
                  onClick={() =>
                    openAssemblyDetails(assembly)
                  }
                >
                  <span className="publication-icon">
                    <AssemblyIcon />
                  </span>

                  <span className="publication-info">
                    <strong>{assembly.name}</strong>
                    <small>
                      {assembly.code
                        ? `Code : ${assembly.code}`
                        : 'Aucun code'}
                    </small>
                  </span>

                  {isCurrent && (
                    <span className="stock-pill">
                      Active
                    </span>
                  )}

                  <span className="publication-chevron">
                    ›
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

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
            <h2>Nouvelle assemblée</h2>

            <form
              className="publication-form"
              onSubmit={submitAssembly}
            >
              <label>
                Nom de l’assemblée
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Ex. Péronnes"
                  autoFocus
                  disabled={saving}
                  required
                />
              </label>

              <label>
                Code d’accès
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength="6"
                  value={accessCode}
                  onChange={(event) =>
                    setAccessCode(
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6),
                    )
                  }
                  placeholder="Laisser vide pour générer"
                  disabled={saving}
                />
              </label>

              <p className="form-note">
                Si le champ reste vide, un code unique à
                6 chiffres sera généré automatiquement.
              </p>

              {error && (
                <p className="form-message form-message--error">
                  {error}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Création…'
                  : 'Créer l’assemblée'}
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

      {selectedAssembly && (
        <div
          className="sheet-backdrop"
          onClick={closeAssemblyDetails}
        >
          <section
            className="detail-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sheet-handle" />

            <div className="detail-title">
              <span>
                <AssemblyIcon />
              </span>

              <div>
                <small>Assemblée</small>
                <h2>{selectedAssembly.name}</h2>
              </div>
            </div>

            <div className="stock-display">
              <small>Code d’accès</small>
              <strong>
                {selectedAssembly.code || '—'}
              </strong>
            </div>

            {message && (
              <p className="form-message form-message--success">
                {message}
              </p>
            )}

            {error && (
              <p className="form-message form-message--error">
                {error}
              </p>
            )}

            {showEditForm ? (
              <form
                className="publication-form"
                onSubmit={submitAssemblyName}
              >
                <label>
                  Nom de l’assemblée
                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    autoFocus
                    disabled={saving}
                    required
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Enregistrement…'
                    : 'Enregistrer'}
                </button>

                <button
                  className="sheet-close"
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setName('')
                    resetMessages()
                  }}
                  disabled={saving}
                >
                  Retour
                </button>
              </form>
            ) : (
              <>
                {currentAssembly?.id !==
                  selectedAssembly.id && (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => {
                      onSelectAssembly(selectedAssembly)
                      setMessage(
                        `${selectedAssembly.name} est maintenant active.`,
                      )
                    }}
                    disabled={saving}
                  >
                    Définir comme active
                  </button>
                )}

                <button
                  className="history-button"
                  type="button"
                  onClick={copyCode}
                  disabled={
                    saving || !selectedAssembly.code
                  }
                >
                  Copier le code
                </button>

                <button
                  className="history-button"
                  type="button"
                  onClick={() => {
                    setName(selectedAssembly.name)
                    setShowEditForm(true)
                    resetMessages()
                  }}
                  disabled={saving}
                >
                  Modifier le nom
                </button>

                <button
                  className="history-button"
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={saving}
                >
                  Régénérer le code
                </button>

                <button
                  className="sheet-close publisher-delete-button"
                  type="button"
                  onClick={handleArchiveAssembly}
                  disabled={saving}
                >
                  Archiver l’assemblée
                </button>

                <button
                  className="sheet-close"
                  type="button"
                  onClick={closeAssemblyDetails}
                  disabled={saving}
                >
                  Fermer
                </button>
              </>
            )}
          </section>
        </div>
      )}

      <BottomNav
        active="Assemblée"
        onChange={handleNavigation}
        isAdmin
      />
    </section>
  )
}

export default Assemblies