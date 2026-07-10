import { HomeIcon, BookIcon, SendIcon, ChartIcon, SettingsIcon } from './Icons'

const items = [
  ['Accueil', <HomeIcon />],
  ['Stock', <BookIcon />],
  ['Distribution', <SendIcon />],
  ['Statistiques', <ChartIcon />],
  ['Paramètres', <SettingsIcon />],
]

function BottomNav({ active = 'Accueil', onChange }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
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
