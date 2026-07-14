import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { DEFAULT_ASSEMBLY_ID } from '../../services/publicationService'

function AdminSheet({ open, onClose, onCountChange }) {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  const loadAdmins = async () => {
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase.rpc('get_assembly_admins', {
        p_assembly_id: DEFAULT_ASSEMBLY_ID,
      })
      if (error) throw error
      const nextAdmins = data ?? []
      setAdmins(nextAdmins)
      onCountChange?.(nextAdmins.length || 1)
    } catch (error) {
      console.error('Chargement des administrateurs impossible :', error)
      setMessageType('error')
      setMessage(`Chargement impossible : ${error?.message ?? 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadAdmins()
  }, [open])

  const addAdministrator = async (event) => {
    event.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || saving) return

    setSaving(true)
    setMessage('')
    try {
      const { error } = await supabase.rpc('add_assembly_admin_by_email', {
        p_assembly_id: DEFAULT_ASSEMBLY_ID,
        p_email: cleanEmail,
      })
      if (error) throw error
      setEmail('')
      setMessageType('success')
      setMessage('Administrateur ajouté.')
      await loadAdmins()
    } catch (error) {
      console.error("Ajout de l'administrateur impossible :", error)
      setMessageType('error')
      setMessage(`Ajout impossible : ${error?.message ?? 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="sheet-backdrop" onClick={() => { if (!saving) onClose() }}>
      <section className="detail-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <h2>Administrateurs</h2>

        {loading ? (
          <p className="empty-history">Chargement…</p>
        ) : admins.length === 0 ? (
          <p className="empty-history">Aucun administrateur trouvé.</p>
        ) : (
          <div className="publication-history">
            {admins.map((admin) => (
              <article className="history-row" key={admin.user_id}>
                <span className="history-amount history-amount--positive">
                  {admin.is_current_user ? 'Vous' : 'Admin'}
                </span>
                <div>
                  <strong>{admin.email}</strong>
                  <small>
                    {admin.is_current_user
                      ? 'Compte actuellement connecté'
                      : 'Administrateur de l’assemblée'}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}

        <form className="publication-form" onSubmit={addAdministrator}>
          <label>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nom@exemple.com"
              autoComplete="email"
              disabled={saving}
              required
            />
          </label>

          {message && <p className={`form-message form-message--${messageType}`}>{message}</p>}

          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Ajout…' : 'Ajouter un administrateur'}
          </button>
        </form>

        <button className="sheet-close" type="button" disabled={saving} onClick={onClose}>Fermer</button>
      </section>
    </div>
  )
}

export default AdminSheet
