function BrandLogo({ compact = false }) {
  return (
    <div className={`brand-logo ${compact ? 'brand-logo--compact' : ''}`} aria-label="PubliService">
      <svg viewBox="0 0 120 96" role="img" aria-hidden="true">
        <path d="M14 18c16-5 30-2 42 7v52c-12-9-26-12-42-7V18Z" fill="currentColor" />
        <path d="M106 18c-16-5-30-2-42 7v52c12-9 26-12 42-7V18Z" fill="currentColor" />
        <path d="M60 25v52" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".9" />
        <circle cx="91" cy="70" r="19" fill="white" />
        <circle cx="91" cy="70" r="15" fill="currentColor" />
        <path d="m83 70 6 6 11-13" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <h1>PubliService</h1>}
    </div>
  )
}

export default BrandLogo

