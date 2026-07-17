import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DEFAULT_ASSEMBLY_ID } from '../../services/publicationService'

function AccessCodeSheet({ open, onClose, currentAssembly }) {
  const assemblyId = currentAssembly?.id ?? DEFAULT_ASSEMBLY_ID

  const [assemblyName, setAssemblyName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [originalCode, setOriginalCode] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  useEffect(() => {
    if (!open) return

    let active = true

    const loadAssembly = async () => {
      setLoading(true)
      setMessage('')

      try {
        const { data: assemblyData, error: assemblyError } = await supabase
          .from('assemblies')
          .select('id, name, is_active')
          .eq('id', assemblyId)
          .single()

        if (assemblyError) throw assemblyError

        const { data: codeResult, error: codeError } = await supabase.rpc(
          'get_assembly_access_code',
          {
            p_assembly_id: assemblyId,
          },
        )

        if (codeError) throw codeError

        const codeData = Array.isArray(codeResult)
          ? codeResult[0]
          : codeResult

        if (!active) return

        const loadedCode = codeData?.current_code ?? ''

        setAssemblyName(
          assemblyData?.name ??
            currentAssembly?.name ??
            '',
        )

        setIsActive(assemblyData?.is_active ?? true)
        setAccessCode(loadedCode)
        setOriginalCode(loadedCode)
      } catch (error) {
        console.error(
          'Chargement de lâ€™assemblÃ©e impossible :',
          error,
        )

        if (active) {
          setMessageType('error')
          setMessage(
            `Chargement impossible : ${
              error?.message ?? 'Erreur inconnue'
            }`,
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAssembly()

    return () => {
      active = false
    }
  }, [open, assemblyId, currentAssembly?.name])

  const handleCodeChange = (event) => {
    const cleanCode = event.target.value
      .replace(/\D/g, '')
      .slice(0, 6)

    setAccessCode(cleanCode)
    setMessage('')
  }

  const regenerateCode = () => {
    if (saving) return

    const nextCode = String(
      Math.floor(100000 + Math.random() * 900000),
    )

    setAccessCode(nextCode)
    setMessageType('success')
    setMessage(
      'Nouveau code gÃ©nÃ©rÃ©. Appuyez sur Enregistrer pour lâ€™activer.',
    )
  }

  const copyCode = async () => {
    if (!accessCode) return

    try {
      await navigator.clipboard.writeText(accessCode)
      setMessageType('success')
      setMessage('Code copiÃ©.')
    } catch {
      setMessageType('error')
      setMessage('La copie automatique a Ã©chouÃ©.')
    }
  }

  const saveAssembly = async () => {
    const cleanName = assemblyName.trim()

    if (!cleanName) {
      setMessageType('error')
      setMessage('Veuillez indiquer le nom de lâ€™assemblÃ©e.')
      return
    }

    if (!/^\d{6}$/.test(accessCode)) {
      setMessageType('error')
      setMessage('Le code doit contenir exactement 6 chiffres.')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const { error: assemblyError } = await supabase
        .from('assemblies')
        .update({
          name: cleanName,
          is_active: isActive,
        })
        .eq('id', assemblyId)

      if (assemblyError) throw assemblyError

      if (accessCode !== originalCode) {
        const { error: codeError } = await supabase.rpc(
          'update_assembly_access_code',
          {
            p_assembly_id: assemblyId,
            p_code: accessCode,
          },
        )

        if (codeError) throw codeError
      }

      setAssemblyName(cleanName)
      setOriginalCode(accessCode)
      setMessageType('success')
      setMessage('Les informations ont Ã©tÃ© enregistrÃ©es.')
    } catch (error) {
      console.error(
        'Enregistrement de lâ€™assemblÃ©e impossible :',
        error,
      )

      setMessageType('error')
      setMessage(
        `Enregistrement impossible : ${
          error?.message ?? 'Erreur inconnue'
        }`,
      )
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="sheet-backdrop"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <section
        className="detail-sheet assembly-settings-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />

        <div className="assembly-sheet-header">
          <h2>Assemblée</h2>

          <button
            type="button"
            className="assembly-sheet-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Fermer"
          >
            Ã—
          </button>
        </div>

        {loading ? (
          <p className="assembly-loading">
            Chargementâ€¦
          </p>
        ) : (
          <>
            <div className="assembly-form-group">
              <label htmlFor="assembly-name">
                Nom
              </label>

              <input
                id="assembly-name"
                type="text"
                value={assemblyName}
                onChange={(event) =>
                  setAssemblyName(event.target.value)
                }
                placeholder="Nom de lâ€™assemblÃ©e"
                disabled={saving}
              />
            </div>

            <div className="assembly-form-group">
              <label htmlFor="assembly-code">
                Code
              </label>

              <input
                id="assembly-code"
                type="text"
                inputMode="numeric"
                value={accessCode}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                disabled={saving}
              />
            </div>

            <button
              type="button"
              className={`assembly-status ${
                isActive
                  ? 'assembly-status--active'
                  : 'assembly-status--inactive'
              }`}
              onClick={() => setIsActive((value) => !value)}
              disabled={saving}
            >
              <span className="assembly-status-dot" />

              <span>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </button>

            {message && (
              <p
                className={`form-message form-message--${messageType}`}
              >
                {message}
              </p>
            )}

            <div className="assembly-actions">
              <button
                type="button"
                className="assembly-action-button"
                onClick={copyCode}
                disabled={saving || !accessCode}
              >
                <span aria-hidden="true">â–£</span>
                Copier
              </button>

              <button
                type="button"
                className="assembly-action-button assembly-action-button--regenerate"
                onClick={regenerateCode}
                disabled={saving}
              >
                <span aria-hidden="true">â†»</span>
                RÃ©gÃ©nÃ©rer
              </button>

              <button
                type="button"
                className="assembly-save-button"
                onClick={saveAssembly}
                disabled={saving}
              >
                <span aria-hidden="true">âœ“</span>

                {saving
                  ? 'Enregistrementâ€¦'
                  : 'Enregistrer'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default AccessCodeSheet
