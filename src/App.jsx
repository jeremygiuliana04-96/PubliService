import { useEffect, useState } from 'react'
import Welcome from './pages/Welcome'
import AdminLogin from './pages/AdminLogin'
import AssemblyLogin from './pages/AssemblyLogin'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import AuthLoader from './components/AuthLoader'
import { signOutAdministrator } from './lib/auth'
import { supabase } from './lib/supabase'
import {
  createPublication,
  getPublications,
  updatePublicationStock,
} from './services/publicationService'
import {
  createStockMovement,
  getStockMovements,
} from './services/movementService'
import './App.css'

function App() {
  const [screen, setScreen] = useState('welcome')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [publications, setPublications] = useState([])
  const [movements, setMovements] = useState([])

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!active) return

      if (error) console.error('Impossible de restaurer la session :', error.message)

      const currentSession = data?.session ?? null
      setSession(currentSession)
      setScreen(currentSession ? 'dashboard' : 'welcome')
      setAuthLoading(false)
    }

    restoreSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setScreen(nextSession ? 'dashboard' : 'welcome')
      setAuthLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const loadData = async () => {
    setDataLoading(true)
    setDataError('')

    try {
      const [nextPublications, nextMovements] = await Promise.all([
        getPublications(),
        getStockMovements(),
      ])
      setPublications(nextPublications)
      setMovements(nextMovements)
    } catch (error) {
      setDataError(error.message)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadData()
    } else {
      setPublications([])
      setMovements([])
      setDataError('')
    }
  }, [session])

  const addPublication = async (publication) => {
    const created = await createPublication(publication)
    setPublications((items) => [...items, created].sort((a, b) => a.name.localeCompare(b.name, 'fr')))

    if (created.stock > 0) {
      const movement = await createStockMovement({
        publication: created,
        amount: created.stock,
        movementType: 'initial',
      })
      setMovements((items) => [movement, ...items])
    }

    return created
  }

  const changeStock = async (id, amount) => {
    const publication = publications.find((item) => item.id === id)
    if (!publication) throw new Error('Publication introuvable.')

    const numericAmount = Number(amount) || 0
    if (!numericAmount) throw new Error('La quantité doit être supérieure à zéro.')

    if (numericAmount < 0 && Math.abs(numericAmount) > publication.stock) {
      throw new Error('La quantité distribuée dépasse le stock disponible.')
    }

    const updated = await updatePublicationStock(publication, numericAmount)

    try {
      const movement = await createStockMovement({
        publication,
        amount: numericAmount,
        movementType: numericAmount > 0 ? 'reception' : 'distribution',
      })

      setPublications((items) => items.map((item) => (item.id === id ? updated : item)))
      setMovements((items) => [movement, ...items])
      return updated
    } catch (error) {
      await updatePublicationStock(updated, -numericAmount)
      throw error
    }
  }

  const handleAuthenticated = (nextSession) => {
    setSession(nextSession)
    setScreen('dashboard')
  }

  const handleLogout = async () => {
    if (logoutLoading) return
    setLogoutLoading(true)

    try {
      await signOutAdministrator()
      setSession(null)
      setScreen('welcome')
    } catch (error) {
      window.alert(error.message)
    } finally {
      setLogoutLoading(false)
    }
  }

  if (authLoading) {
    return <main className="app-shell"><AuthLoader label="Ouverture de PubliService…" /></main>
  }

  const protectedScreen = screen === 'dashboard' || screen === 'inventory'
  if (protectedScreen && !session) {
    return (
      <main className="app-shell">
        <AdminLogin onBack={() => setScreen('welcome')} onAuthenticated={handleAuthenticated} />
      </main>
    )
  }

  if (protectedScreen && dataLoading) {
    return <main className="app-shell"><AuthLoader label="Chargement des données…" /></main>
  }

  const screens = {
    welcome: <Welcome onAdmin={() => setScreen('admin')} onAssembly={() => setScreen('assembly')} />,
    admin: <AdminLogin onBack={() => setScreen('welcome')} onAuthenticated={handleAuthenticated} />,
    assembly: (
      <AssemblyLogin
        onBack={() => setScreen('welcome')}
        onLogin={() => window.alert('L’accès par code sera connecté à Supabase lors d’une prochaine étape.')}
      />
    ),
    dashboard: (
      <Dashboard
        publications={publications}
        movements={movements}
        onNavigate={setScreen}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />
    ),
    inventory: (
      <Inventory
        publications={publications}
        movements={movements}
        onAdd={addPublication}
        onChangeStock={changeStock}
        onNavigate={setScreen}
      />
    ),
  }

  return (
    <main className="app-shell">
      {dataError ? (
        <section className="phone-page auth-loader">
          <p className="form-message form-message--error">{dataError}</p>
          <button className="primary-button retry-button" type="button" onClick={loadData}>Réessayer</button>
        </section>
      ) : (screens[screen] ?? screens.welcome)}
    </main>
  )
}

export default App
