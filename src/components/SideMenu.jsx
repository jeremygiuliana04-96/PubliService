import { useEffect, useState } from 'react'
import {
  BookIcon,
  HomeIcon,
  SettingsIcon,
} from './Icons'

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  )
}

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

function DistributionIcon() {
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
      <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" />
      <path d="M3 7.5V16l9 5 9-5V7.5" />
      <path d="M12 12v9" />
    </svg>
  )
}

function AssemblyIcon() {
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
      <path d="M3 21h18" />
      <path d="M5 21V9h14v12" />
      <path d="m3 9 9-6 9 6" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

const MENU_ITEMS = [
  { label: 'Accueil', screen: 'dashboard', icon: <HomeIcon /> },
  { label: 'Publications', screen: 'inventory', icon: <BookIcon /> },
  {
    label: 'Distribution',
    screen: 'distribution',
    icon: <DistributionIcon />,
  },
  {
    label: 'Proclamateurs',
    screen: 'publishers',
    icon: <PeopleIcon />,
  },
  { label: 'Plus', screen: 'more', icon: <SettingsIcon /> },
]

function SideMenu({ activeScreen, onNavigate, isAdmin = false }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const navigate = (screen) => {
    setOpen(false)
    onNavigate?.(screen)
  }

  const items = isAdmin
    ? [
        ...MENU_ITEMS.slice(0, 4),
        {
          label: 'Assemblées',
          screen: 'assemblies',
          icon: <AssemblyIcon />,
        },
        MENU_ITEMS[4],
      ]
    : MENU_ITEMS

  return (
    <>
      <button
        className="side-menu-trigger"
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>

      {open && (
        <div
          className="side-menu-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <aside
            className="side-menu-panel"
            aria-label="Navigation principale"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="side-menu-heading">
              <div>
                <span>Navigation</span>
                <strong>PubliService</strong>
              </div>

              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <nav className="side-menu-list">
              {items.map((item) => (
                <button
                  key={item.screen}
                  className={
                    activeScreen === item.screen ? 'is-active' : ''
                  }
                  type="button"
                  onClick={() => navigate(item.screen)}
                >
                  <span>{item.icon}</span>
                  <strong>{item.label}</strong>
                  <small aria-hidden="true">›</small>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}

export default SideMenu
