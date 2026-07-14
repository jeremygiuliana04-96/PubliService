import {
  HomeIcon,
  BookIcon,
  SettingsIcon,
  AssemblyIcon,
} from './Icons'

function PeopleIcon() {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BottomNav({
  active = 'Accueil',
  onChange,
  isAdmin = true,
}) {
  const items = [
    ['Accueil', <HomeIcon key="home" />],
    ['Publications', <BookIcon key="book" />],
    ['Proclamateurs', <PeopleIcon key="people" />],
  ]

  if (isAdmin) {
    items.push([
      'Assemblée',
      <AssemblyIcon key="assembly" />,
    ])
  }

  items.push(['Plus', <SettingsIcon key="settings" />])

  return (
    <nav
      className={`bottom-nav ${
        isAdmin ? 'bottom-nav--admin' : ''
      }`}
      aria-label="Navigation principale"
    >
      {items.map(([label, icon]) => (
        <button
          key={label}
          className={active === label ? 'is-active' : ''}
          type="button"
          onClick={() => onChange?.(label)}
        >
          <span>{icon}</span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav