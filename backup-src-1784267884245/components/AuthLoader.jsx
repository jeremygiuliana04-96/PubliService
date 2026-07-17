function AuthLoader({ label = 'Chargementâ€¦' }) {
  return (
    <section className="phone-page auth-loader" aria-live="polite" aria-busy="true">
      <div className="auth-spinner" aria-hidden="true" />
      <p>{label}</p>
    </section>
  )
}

export default AuthLoader

