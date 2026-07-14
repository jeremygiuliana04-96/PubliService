import { useEffect, useState } from 'react'
import Welcome from './pages/Welcome'
import AdminLogin from './pages/AdminLogin'
import AssemblyLogin from './pages/AssemblyLogin'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import More from './pages/More'
import AdminPanel from './pages/AdminPanel'
import Publishers from './pages/Publishers'
import Assemblies from './pages/Assemblies'
import AuthLoader from './components/AuthLoader'
import { signOutAdministrator } from './lib/auth'
import { supabase } from './lib/supabase'
import { getAssemblies } from './services/assemblyService'
import {
  createPublication,
  deletePublication,
  getPublications,
  updatePublicationStock,
} from './services/publicationService'
import {
  createStockMovement,
  getStockMovements,
} from './services/movementService'
import {
  createPublisher,
  deletePublisher,
  getPublishers,
  updatePublisher,
} from './services/publisherService'
import './App.css'

const ACTIVE_ASSEMBLY_STORAGE_KEY = 'publiservice-active-assembly-id'

function App() {
  const [screen, setScreen] = useState('welcome')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [assembliesLoading, setAssembliesLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)

  const [assemblies, setAssemblies] = useState([])
  const [currentAssembly, setCurrentAssembly] = useState(null)

  const [publications, setPublications] = useState([])
  const [movements, setMovements] = useState([])
  const [publishers, setPublishers] = useState([])

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        console.error(
          'Impossible de restaurer la session :',
          error.message,
        )
      }

      const currentSession = data?.session ?? null

      setSession(currentSession)
      setScreen(currentSession ? 'dashboard' : 'welcome')
      setAuthLoading(false)
    }

    restoreSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return

        setSession(nextSession)
        setScreen(nextSession ? 'dashboard' : 'welcome')
        setAuthLoading(false)
      },
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const loadAssemblies = async () => {
    setAssembliesLoading(true)
    setDataError('')

    try {
      const nextAssemblies = await getAssemblies()
      setAssemblies(nextAssemblies)

      const savedAssemblyId = localStorage.getItem(
        ACTIVE_ASSEMBLY_STORAGE_KEY,
      )

      const savedAssembly = nextAssemblies.find(
        (assembly) => assembly.id === savedAssemblyId,
      )

      const nextCurrentAssembly =
        savedAssembly ?? nextAssemblies[0] ?? null

      setCurrentAssembly(nextCurrentAssembly)

      if (nextCurrentAssembly) {
        localStorage.setItem(
          ACTIVE_ASSEMBLY_STORAGE_KEY,
          nextCurrentAssembly.id,
        )
      } else {
        localStorage.removeItem(
          ACTIVE_ASSEMBLY_STORAGE_KEY,
        )
      }
    } catch (error) {
      setAssemblies([])
      setCurrentAssembly(null)
      setDataError(error.message)
    } finally {
      setAssembliesLoading(false)
    }
  }

  const loadData = async () => {
    setDataLoading(true)
    setDataError('')

    try {
      const [
        nextPublications,
        nextMovements,
        nextPublishers,
      ] = await Promise.all([
        getPublications(),
        getStockMovements(),
        getPublishers(),
      ])

      setPublications(nextPublications)
      setMovements(nextMovements)
      setPublishers(nextPublishers)
    } catch (error) {
      setDataError(error.message)
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (!session) {
      setAssemblies([])
      setCurrentAssembly(null)
      setPublications([])
      setMovements([])
      setPublishers([])
      setDataError('')
      return
    }

    loadAssemblies()
    loadData()
  }, [session])

  const handleSelectAssembly = async (assembly) => {
    setCurrentAssembly(assembly)

    setAssemblies((items) => {
      const exists = items.some((item) => item.id === assembly.id)

      if (exists) {
        return items.map((item) =>
          item.id === assembly.id
            ? { ...item, ...assembly }
            : item,
        )
      }

      return [...items, assembly].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr'),
      )
    })

    localStorage.setItem(
      ACTIVE_ASSEMBLY_STORAGE_KEY,
      assembly.id,
    )

    /*
      Les services de données seront adaptés à l'étape suivante
      pour recevoir assembly.id. Le rechargement est déjà centralisé ici.
    */
    await loadData()
  }

  const addPublication = async (publication) => {
    const created = await createPublication(publication)

    setPublications((items) =>
      [...items, created].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr'),
      ),
    )

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

  const removePublication = async (id) => {
    await deletePublication(id)

    setPublications((items) =>
      items.filter((item) => item.id !== id),
    )

    setMovements((items) =>
      items.filter((item) => item.publicationId !== id),
    )
  }

  const changeStock = async (id, amount) => {
    const publication = publications.find(
      (item) => item.id === id,
    )

    if (!publication) {
      throw new Error('Publication introuvable.')
    }

    const numericAmount = Number(amount) || 0

    if (!numericAmount) {
      throw new Error(
        'La quantité doit être supérieure à zéro.',
      )
    }

    if (
      numericAmount < 0 &&
      Math.abs(numericAmount) > publication.stock
    ) {
      throw new Error(
        'La quantité distribuée dépasse le stock disponible.',
      )
    }

    const updated = await updatePublicationStock(
      publication,
      numericAmount,
    )

    try {
      const movement = await createStockMovement({
        publication,
        amount: numericAmount,
        movementType:
          numericAmount > 0 ? 'reception' : 'distribution',
      })

      setPublications((items) =>
        items.map((item) =>
          item.id === id ? updated : item,
        ),
      )

      setMovements((items) => [movement, ...items])

      return updated
    } catch (error) {
      await updatePublicationStock(updated, -numericAmount)
      throw error
    }
  }

  const addPublisher = async (publisher) => {
    const created = await createPublisher(publisher)

    setPublishers((items) =>
      [...items, created].sort((a, b) => {
        const lastNameComparison =
          a.lastName.localeCompare(b.lastName, 'fr')

        if (lastNameComparison !== 0) {
          return lastNameComparison
        }

        return a.firstName.localeCompare(
          b.firstName,
          'fr',
        )
      }),
    )

    return created
  }

  const editPublisher = async (id, publisher) => {
    const updated = await updatePublisher(id, publisher)

    setPublishers((items) =>
      items
        .map((item) =>
          item.id === id ? updated : item,
        )
        .sort((a, b) => {
          const lastNameComparison =
            a.lastName.localeCompare(b.lastName, 'fr')

          if (lastNameComparison !== 0) {
            return lastNameComparison
          }

          return a.firstName.localeCompare(
            b.firstName,
            'fr',
          )
        }),
    )

    return updated
  }

  const removePublisher = async (id) => {
    await deletePublisher(id)

    setPublishers((items) =>
      items.filter((item) => item.id !== id),
    )
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
    return (
      <main className="app-shell">
        <AuthLoader label="Ouverture de PubliService…" />
      </main>
    )
  }

  const protectedScreen =
    screen === 'dashboard' ||
    screen === 'inventory' ||
    screen === 'publishers' ||
    screen === 'assemblies' ||
    screen === 'more' ||
    screen === 'adminPanel'

  if (protectedScreen && !session) {
    return (
      <main className="app-shell">
        <AdminLogin
          onBack={() => setScreen('welcome')}
          onAuthenticated={handleAuthenticated}
        />
      </main>
    )
  }

  if (
    protectedScreen &&
    (dataLoading || assembliesLoading)
  ) {
    return (
      <main className="app-shell">
        <AuthLoader label="Chargement des données…" />
      </main>
    )
  }

  const screens = {
    welcome: (
      <Welcome
        onAdmin={() => setScreen('admin')}
        onAssembly={() => setScreen('assembly')}
      />
    ),

    admin: (
      <AdminLogin
        onBack={() => setScreen('welcome')}
        onAuthenticated={handleAuthenticated}
      />
    ),

    assembly: (
      <AssemblyLogin
        onBack={() => setScreen('welcome')}
        onLogin={() =>
          window.alert(
            'L’accès par code sera connecté à Supabase lors d’une prochaine étape.',
          )
        }
      />
    ),

    dashboard: (
      <Dashboard
        publications={publications}
        movements={movements}
        currentAssembly={currentAssembly}
        onNavigate={setScreen}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />
    ),

    inventory: (
      <Inventory
        publications={publications}
        movements={movements}
        currentAssembly={currentAssembly}
        onAdd={addPublication}
        onChangeStock={changeStock}
        onDelete={removePublication}
        onNavigate={setScreen}
      />
    ),

    publishers: (
      <Publishers
        publishers={publishers}
        publications={publications}
        currentAssembly={currentAssembly}
        onAdd={addPublisher}
        onUpdate={editPublisher}
        onDelete={removePublisher}
        onNavigate={setScreen}
      />
    ),

    assemblies: (
      <Assemblies
        assemblies={assemblies}
        currentAssembly={currentAssembly}
        onSelectAssembly={handleSelectAssembly}
        onReloadAssemblies={loadAssemblies}
        onNavigate={setScreen}
      />
    ),

    more: (
      <More
        currentAssembly={currentAssembly}
        onNavigate={setScreen}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
      />
    ),

    adminPanel: (
      <AdminPanel onBack={() => setScreen('more')} />
    ),
  }

  return (
    <main className="app-shell">
      {dataError ? (
        <section className="phone-page auth-loader">
          <p className="form-message form-message--error">
            {dataError}
          </p>

          <button
            className="primary-button retry-button"
            type="button"
            onClick={async () => {
              await loadAssemblies()
              await loadData()
            }}
          >
            Réessayer
          </button>
        </section>
      ) : (
        screens[screen] ?? screens.welcome
      )}
    </main>
  )
}

export default App
