import { useState } from 'react'
import { supabase } from '../lib/supabase'

function AdminIcon() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
      <path d="M18.5 4.5 20 6l2.5-2.5" />
    </svg>
  )
}

function MailIcon() {
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
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function AdminPanel({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleInvite = async (event) => {
    event.preventDefault()

    setMessage('')
    setError('')

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail) {
      setError('Veuillez entrer une adresse e-mail.')
      return
    }

    setLoading(true)

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke('invite-admin', {
          body: {
            email: cleanEmail,
          },
        })

      if (functionError) {
        throw functionError
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "Impossible dâ€™envoyer lâ€™invitation.",
        )
      }

      setMessage(
        data.message || 'Invitation envoyÃ©e avec succÃ¨s.',
      )
      setEmail('')
    } catch (inviteError) {
      console.error(inviteError)

      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'Une erreur est survenue.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="phone-page admin-panel-page">
      <header className="admin-panel-header">
        <button
          className="admin-panel-back"
          type="button"
          onClick={onBack}
          aria-label="Retour"
          disabled={loading}
        >
          â†
        </button>

        <div>
          <p>PubliService</p>
          <h1>Administrateurs</h1>
        </div>

        <span className="admin-panel-header-icon">
          <AdminIcon />
        </span>
      </header>

      <div className="admin-panel-content">
        <section className="admin-invite-card">
          <span className="admin-invite-card-icon">
            <MailIcon />
          </span>

          <div className="admin-invite-heading">
            <p>AccÃ¨s administrateur</p>
            <h2>Inviter un administrateur</h2>
            <span>
              La personne invitÃ©e pourra gÃ©rer les assemblÃ©es,
              les publications et les accÃ¨s de PubliService.
            </span>
          </div>

          <form
            className="admin-invite-form"
            onSubmit={handleInvite}
          >
            <label htmlFor="admin-email">
              Adresse e-mail
              <span className="admin-email-field">
                <MailIcon />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="exemple@adresse.be"
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </span>
            </label>

            {message ? (
              <p className="form-message form-message--success">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="form-message form-message--error">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="primary-button admin-invite-submit"
              disabled={loading}
            >
              {loading
                ? 'Envoi en coursâ€¦'
                : "Envoyer lâ€™invitation"}
            </button>
          </form>
        </section>

        <p className="admin-invite-note">
          Lâ€™invitation sera envoyÃ©e Ã  lâ€™adresse indiquÃ©e. Le nouvel
          administrateur pourra ensuite dÃ©finir son mot de passe.
        </p>
      </div>
    </section>
  )
}

export default AdminPanel

