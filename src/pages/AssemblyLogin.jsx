import { useState } from 'react'

function AssemblyLogin({
  onBack,
  onLogin,
  loading = false,
  error = '',
}) {
  const [code, setCode] = useState(['', '', '', '', '', ''])

  function updateDigit(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)

    setCode((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? digit : item,
      ),
    )

    if (digit && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  function handleKeyDown(index, event) {
    if (
      event.key === 'Backspace' &&
      !code[index] &&
      index > 0
    ) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    onLogin?.(code.join(''))
  }

  return (
    <section className="phone-page form-page">
      <header className="simple-header">
        <button
          className="icon-button"
          type="button"
          onClick={onBack}
          aria-label="Retour"
          disabled={loading}
        >
          ←
        </button>

        <h2>Accès Assemblée</h2>
        <span className="header-balance" />
      </header>

      <div className="form-content assembly-content">
        <div
          className="round-icon round-icon--home"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path
              d="m3 11 9-8 9 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M6 10.5V21h12V10.5" fill="currentColor" />
            <rect
              x="10"
              y="14"
              width="4"
              height="7"
              rx="1"
              fill="white"
            />
          </svg>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="code-block">
            <p>Entrer le code</p>

            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  value={digit}
                  inputMode="numeric"
                  maxLength="1"
                  aria-label={`Chiffre ${index + 1}`}
                  disabled={loading}
                  onChange={(event) =>
                    updateDigit(index, event.target.value)
                  }
                  onKeyDown={(event) =>
                    handleKeyDown(index, event)
                  }
                />
              ))}
            </div>
          </div>

          {error ? (
            <p className="form-message form-message--error">
              {error}
            </p>
          ) : null}

          <button
            className="primary-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="helper-text">
            Code à 6 chiffres fourni
            <br />
            par l’administrateur
          </p>
        </form>
      </div>
    </section>
  )
}

export default AssemblyLogin

