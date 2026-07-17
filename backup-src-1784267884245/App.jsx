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
import Distribution from './pages/Distribution'
import AuthLoader from './components/AuthLoader'
import { signOutAdministrator } from './lib/auth'
import { supabase } from './lib/supabase'
import {
  getAssemblies,
  loginWithAssemblyCode,
} from './services/assemblyService'
import {
  clearAssemblySession,
  getAssemblySession,
  saveAssemblySession,
} from './lib/assemblySession'
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
  const [assemblySession, setAssemblySession] = useState(
    () => getAssemblySession(),
  )
  const [assemblyLoginLoading, setAssemblyLoginLoading] =
    useState(false)
  const [assemblyLoginError, setAssemblyLoginError] =
    useState('')
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

      const savedAssemblySession = getAssemblySession()

      setSession(currentSession)
      setAssemblySession(savedAssemblySession)
      setScreen(
        currentSession || savedAssemblySession
          ? 'dashboard'
          : 'welcome',
      )
      setAuthLoading(false)
    }

    restoreSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return

        const savedAssemblySession = getAssemblySession()

        setSession(nextSession)
        setAssemblySession(savedAssemblySession)
        setScreen(
          nextSession || savedAssemblySession
            ? 'dashboard'
            : 'welcome',
        )
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
        await loadData(nextCurrentAssembly.id)
      }

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

  const loadData = async (assemblyId) => {
  if (!assemblyId) return

  setDataLoading(true)
  setDataError('')

  try {
    const [
      nextPublications,
      nextMovements,
      nextPublishers,
    ] = await Promise.all([
      getPublications(assemblyId),
      getStockMovements(assemblyId),
      getPublishers(assemblyId),
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
  if (session) {
    loadAssemblies()
    return
  }

  if (assemblySession) {
    setAssemblies([assemblySession])
    setCurrentAssembly(assemblySession)
    loadData(assemblySession.id)
    return
  }

    setAssemblies([])
    setCurrentAssembly(null)
    setPublications([])
    setMovements([])
    setPublishers([])
    setDataError('')
  }, [session, assemblySession])

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
    await loadData(assembly.id)
  }

  const addPublication = async (publication) => {
    const created = await createPublication(
      publication,
      currentAssembly?.id,
      currentAssembly?.code,
    )

    setPublications((items) =>
      [...items, created].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr'),
      ),
    )

    const nextMovements = await getStockMovements(
  currentAssembly.id,
)

setMovements(nextMovements)

    return created
  }

  const removePublication = async (id) => {
    await deletePublication(
      id,
      currentAssembly?.id,
      currentAssembly?.code,
    )

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
      currentAssembly?.id,
      currentAssembly?.code,
    )

    try {
      const movement = await createStockMovement({
        publication,
        amount: numericAmount,
        movementType:
          numericAmount > 0 ? 'reception' : 'distribution',
      })

    } catch (error) {
      await updatePublicationStock(
        updated,
        -numericAmount,
        currentAssembly?.id,
      )
      throw error
    }
  }

  const addPublisher = async (publisher) => {
    const created = await createPublisher(
      publisher,
      currentAssembly?.id,
      currentAssembly?.code,
    )

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
    const updated = await updatePublisher(
      id,
      publisher,
      currentAssembly?.id,
      currentAssembly?.code,
    )

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
    await deletePublisher(
      id,
      currentAssembly?.id,
      currentAssembly?.code,
    )

    setPublishers((items) =>
      items.filter((item) => item.id !== id),
    )
  }

  const handleAssemblyLogin = async (code) => {
    if (assemblyLoginLoading) return

    setAssemblyLoginLoading(true)
    setAssemblyLoginError('')

    try {
      const assembly = await loginWithAssemblyCode(code)
      const savedSession = saveAssemblySession(assembly)

      setAssemblySession(savedSession)
      setCurrentAssembly(savedSession)
      setAssemblies([savedSession])

      localStorage.setItem(
        ACTIVE_ASSEMBLY_STORAGE_KEY,
        savedSession.id,
      )

      setScreen('dashboard')
    } catch (error) {
      setAssemblyLoginError(
        error.message || 'Connexion impossible.',
      )
    } finally {
      setAssemblyLoginLoading(false)
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
      if (session) {
        await signOutAdministrator()
      }

      clearAssemblySession()
      localStorage.removeItem(ACTIVE_ASSEMBLY_STORAGE_KEY)

      setSession(null)
      setAssemblySession(null)
      setAssemblies([])
      setCurrentAssembly(null)
      setPublications([])
      setMovements([])
      setPublishers([])
      setDataError('')
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

  const isAdmin = Boolean(session)
  const isAssembly = Boolean(assemblySession) && !isAdmin

  const protectedScreen =
    screen === 'dashboard' ||
    screen === 'inventory' ||
    screen === 'distribution' ||
    screen === 'publishers' ||
    screen === 'assemblies' ||
    screen === 'more' ||
    screen === 'adminPanel'

  if (protectedScreen && !session && !assemblySession) {
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

  const adminOnlyScreen =
    screen === 'assemblies' ||
    screen === 'adminPanel'

  const visibleScreen =
    isAssembly && adminOnlyScreen
      ? 'dashboard'
      : screen

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
        onBack={() => {
          setAssemblyLoginError('')
          setScreen('welcome')
        }}
        onLogin={handleAssemblyLogin}
        loading={assemblyLoginLoading}
        error={assemblyLoginError}
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
        isAdmin={isAdmin}
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
        isAdmin={isAdmin}
      />
    ),

    distribution: (
      <Distribution
        publishers={publishers}
        publications={publications}
        currentAssembly={currentAssembly}
        onNavigate={setScreen}
        isAdmin={isAdmin}
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
        isAdmin={isAdmin}
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
        publisherCount={publishers.length}
        onNavigate={setScreen}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        isAdmin={isAdmin}
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
              if (currentAssembly?.id) {
                await loadData(currentAssembly.id)
              }
            }}
          >
            Réessayer
          </button>
        </section>
      ) : (
        screens[visibleScreen] ?? screens.welcome
      )}
    </main>
  )
}

export default App



