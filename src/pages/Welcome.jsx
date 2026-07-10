import BrandLogo from '../components/BrandLogo'

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 4.5 5v6.2c0 4.8 3.2 9.2 7.5 10.8 4.3-1.6 7.5-6 7.5-10.8V5L12 2Z" fill="currentColor" />
      <circle cx="12" cy="9" r="2.5" fill="white" />
      <path d="M8.7 16.4c.7-2 1.9-3.1 3.3-3.1s2.6 1.1 3.3 3.1" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 11 9-8 9 8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10.5V21h12V10.5" fill="currentColor" />
      <rect x="10" y="14" width="4" height="7" rx="1" fill="white" />
    </svg>
  )
}

function Welcome({ onAdmin, onAssembly }) {
  return (
    <section className="phone-page welcome-page">
      <div className="welcome-spacer" />
      <BrandLogo />

      <div className="welcome-actions">
        <button className="choice-button choice-button--primary" type="button" onClick={onAdmin}>
          <span className="choice-button__icon"><ShieldIcon /></span>
          <span>Administrateur</span>
        </button>

        <button className="choice-button choice-button--secondary" type="button" onClick={onAssembly}>
          <span className="choice-button__icon"><HomeIcon /></span>
          <span>Accès Assemblée</span>
        </button>
      </div>
    </section>
  )
}

export default Welcome
