import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DEFAULT_ASSEMBLY_ID } from '../../services/publicationService'

function AccessCodeSheet({ open, onClose }) {
  const [accessCode, setAccessCode] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  useEffect(() => {
    if (!open) return

    let active = true

    const loadCode = async () => {
      setLoading(true)
      setMessage('')

      try {
        const { data, error } = await supabase.rpc(
          'get_assembly_access_code',
          {
            p_assembly_id: DEFAULT_ASSEMBLY_ID,
          }
        )

        if (error) throw error

        const codeData = Array.isArray(data) ? data[0] : data

        if (active) {
          setAccessCode(codeData?.current_code ?? '')
          setUpdatedAt(codeData?.updated_at ?? null)
        }
      } catch (error) {
        console.error('Chargement du code impossible :', error)

        if (active) {
          setMessageType('error')
          setMessage(
            `Chargement impossible : ${error?.message ?? 'Erreur inconnue'}`
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCode()

    return () => {
      active = false
    }
  }, [open])

  const generateCode = async () => {
    if (saving) return

    const nextCode = String(
      Math.floor(100000 + Math.random() * 900000)
    )

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase.rpc(
        'update_assembly_access_code',
        {
          p_assembly_id: DEFAULT_ASSEMBLY_ID,
          p_code: nextCode,
        }
      )

      if (error) throw error

      setAccessCode(nextCode)
      setUpdatedAt(new Date().toISOString())
      setMessageType('success')
      setMessage('Le nouveau code est actif.')
    } catch (error) {
      console.error('Création du code impossible :', error)
      setMessageType('error')
      setMessage(
        `Création impossible : ${error?.message ?? 'Erreur inconnue'}`
      )
    } finally {
      setSaving(false)
    }
  }

  const copyCode = async () => {
    if (!accessCode) return

    try {
      await navigator.clipboard.writeText(accessCode)
      setMessageType('success')
      setMessage('Code copié.')
    } catch {
      setMessageType('error')
      setMessage('La copie automatique a échoué.')
    }
  }

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleString('fr-BE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  if (!open) return null

  return (
    <div
      className="sheet-backdrop"
      onClick={() => {
        if (!saving) onClose()
      }}
    >
      <section
        className="detail-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />

        <h2>Code d’accès</h2>

        <div className="stock-display">
          <small>Code actuel</small>
          <strong>
            {loading ? '······' : accessCode || '—'}
          </strong>

          {!loading && accessCode && (
            <small>Actif</small>
          )}

          {!loading && formattedDate && (
            <>
              <small style={{ marginTop: '14px' }}>
                Dernière modification
              </small>

              <strong style={{ fontSize: '15px' }}>
                {formattedDate}
              </strong>
            </>
          )}
        </div>

        {message && (
          <p
            className={`form-message form-message--${messageType}`}
          >
            {message}
          </p>
        )}

        <div className="stock-actions">
          <button
            type="button"
            onClick={copyCode}
            disabled={loading || saving || !accessCode}
          >
            Copier
          </button>

          <button
            type="button"
            onClick={generateCode}
            disabled={loading || saving}
          >
            {saving ? 'Création…' : 'Nouveau code'}
          </button>
        </div>

        <div className="access-code-warning">
          <strong>Attention</strong>
          <p>
            Lorsque vous générez un nouveau code, l’ancien devient immédiatement
            invalide. Pensez à communiquer le nouveau code aux proclamateurs avant
            leur prochaine connexion.
         </p>
      </div>

        <button
          className="sheet-close"
          type="button"
          disabled={saving}
          onClick={onClose}
        >
          Fermer
        </button>
      </section>
    </div>
  )
}

export default AccessCodeSheet