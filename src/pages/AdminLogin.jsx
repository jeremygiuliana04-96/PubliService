import { useState } from 'react'
import { sendPasswordReset, signInAdministrator } from '../lib/auth'

function AdminLogin({ onBack, onAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('error')

  const submitLogin = async (event) => {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    try {
      const { session } = await signInAdministrator(email, password)
      onAuthenticated?.(session)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async () => {
    setMessage('')
    setLoading(true)

    try {
      await sendPasswordReset(email)
      setMessageType('success')
      setMessage('Un e-mail de rÃ©initialisation vient de vous Ãªtre envoyÃ©.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="phone-page form-page">
      <header className="simple-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Retour">â†</button>
        <h2>Administrateur</h2>
        <span className="header-balance" />
      </header>

      <div className="form-content">
        <div className="round-icon round-icon--shield" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 2 4.5 5v6.2c0 4.8 3.2 9.2 7.5 10.8 4.3-1.6 7.5-6 7.5-10.8V5L12 2Z" fill="currentColor" />
            <circle cx="12" cy="9" r="2.3" fill="white" />
            <path d="M8.5 16.5c.8-2.1 2-3.2 3.5-3.2s2.7 1.1 3.5 3.2" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </div>

        <form className="login-form" onSubmit={submitLogin}>
          <label>
            <span>Adresse e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="votre@email.com"
              autoComplete="email"
              disabled={loading}
              required
            />
          </label>

          <label>
            <span>Mot de passe</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} disabled={loading} aria-label="Afficher ou masquer le mot de passe">
                {showPassword ? 'Masquer' : 'Voir'}
              </button>
            </div>
          </label>

          {message && <p className={`form-message form-message--${messageType}`}>{message}</p>}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Connexionâ€¦' : 'Se connecter'}
          </button>
          <button className="text-button" type="button" onClick={resetPassword} disabled={loading}>
            Mot de passe oubliÃ© ?
          </button>
        </form>
      </div>
    </section>
  )
}

export default AdminLogin

