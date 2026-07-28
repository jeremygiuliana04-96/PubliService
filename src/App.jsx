import { useCallback, useEffect, useState } from 'react'
import Welcome from './pages/Welcome'
import AdminLogin from './pages/AdminLogin'
import AssemblyLogin from './pages/AssemblyLogin'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import More from './pages/More'
import AppInformation from './pages/AppInformation'
import InstallationGuide from './pages/InstallationGuide'
import SyncStatus from './pages/SyncStatus'
import Administration from './pages/Administration'
import AdminPanel from './pages/AdminPanel'
import Publishers from './pages/Publishers'
import Assemblies from './pages/Assemblies'
import Distribution from './pages/Distribution'
import AuthLoader from './components/AuthLoader'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import { signOutAdministrator } from './lib/auth'
import { supabase } from './lib/supabase'
import {
  getAssemblies,
  loginWithAssemblyCode,
} from './services/assemblyService'
import {
  clearAssemblySession,
  clearActiveAssembly,
  getActiveAssembly,
  getAssemblySession,
  saveActiveAssembly,
  saveAssemblySession,
} from './lib/assemblySession'
import {
  createPublication,
  deletePublication,
  getPublications,
  updatePublicationStock,
} from './services/publicationService'
import {
  createPublicationCatalogEntry,
  getPublicationCatalog,
} from './services/publicationCatalogService'
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
import {
  getAssemblyCache,
  saveAssemblyCache,
} from './offline/cache'
import {
  OFFLINE_QUEUE_CHANGED_EVENT,
  countOfflineOperations,
  enqueueDistributionOperation,
  listOfflineOperations,
  removeOfflineOperation,
} from './offline/queue'
import { syncOfflineOperations } from './offline/sync'
import { getPendingDistributions } from './services/distributionService'
import './App.css'

const ACTIVE_ASSEMBLY_STORAGE_KEY = 'publiservice-active-assembly-id'
const SYNC_METADATA_PREFIX = 'publiservice-sync-metadata'

function syncMetadataKey(assemblyId) {
  return `${SYNC_METADATA_PREFIX}:${String(assemblyId)}`
}

function readSyncMetadata(assemblyId) {
  if (!assemblyId) {
    return {
      lastSyncAt: null,
      lastSyncError: '',
    }
  }

  try {
    const stored = localStorage.getItem(
      syncMetadataKey(assemblyId),
    )

    if (!stored) {
      return {
        lastSyncAt: null,
        lastSyncError: '',
      }
    }

    const metadata = JSON.parse(stored)

    return {
      lastSyncAt: metadata?.lastSyncAt ?? null,
      lastSyncError: metadata?.lastSyncError ?? '',
    }
  } catch {
    return {
      lastSyncAt: null,
      lastSyncError: '',
    }
  }
}

function saveSyncMetadata(assemblyId, updates) {
  const nextMetadata = {
    ...readSyncMetadata(assemblyId),
    ...updates,
  }

  localStorage.setItem(
    syncMetadataKey(assemblyId),
    JSON.stringify(nextMetadata),
  )

  return nextMetadata
}

const getAssemblyAccessCode = (assembly) =>
  assembly?.code ??
  assembly?.accessCode ??
  assembly?.access_code ??
  ''

const distributionKey = (publisherId, publicationId) =>
  `${publisherId}:${publicationId}`

function applyQueuedDistributions(data, operations) {
  const distributionOperations = operations.filter(
    (operation) =>
      operation.type === 'distribution.allRemaining',
  )

  if (distributionOperations.length === 0) return data

  const queuedKeys = new Set(
    distributionOperations.map((operation) =>
      distributionKey(
        operation.publisherId,
        operation.publicationId,
      ),
    ),
  )
  const quantitiesByPublication = new Map()

  distributionOperations.forEach((operation) => {
    const publicationId = String(operation.publicationId)

    quantitiesByPublication.set(
      publicationId,
      (quantitiesByPublication.get(publicationId) ?? 0) +
        Math.max(0, Number(operation.quantity) || 0),
    )
  })

  const pendingDistributions = (
    data.pendingDistributions ?? []
  ).filter(
    (row) =>
      !queuedKeys.has(
        distributionKey(
          row.publisherId,
          row.publicationId,
        ),
      ),
  )

  const publications = (data.publications ?? []).map(
    (publication) => {
      const queuedQuantity =
        quantitiesByPublication.get(String(publication.id)) ?? 0

      if (!queuedQuantity) return publication

      return {
        ...publication,
        stock: Math.max(
          0,
          Number(publication.stock ?? 0) - queuedQuantity,
        ),
      }
    },
  )

  const queuedMovements = distributionOperations.map(
    (operation) => ({
      id: `offline:${operation.id}`,
      assemblyId: operation.assemblyId,
      publicationId: operation.publicationId,
      publicationName:
        operation.publicationName || 'Publication',
      amount: -Math.max(0, Number(operation.quantity) || 0),
      type: 'Distribution',
      movementType: 'distribution',
      createdAt: operation.createdAt,
      pendingSync: true,
    }),
  )
  const queuedMovementIds = new Set(
    queuedMovements.map((movement) => movement.id),
  )
  const previousQueuedMovements = (
    data.movements ?? []
  ).filter(
    (movement) =>
      movement.pendingSync &&
      !queuedMovementIds.has(movement.id),
  )

  return {
    ...data,
    publications,
    pendingDistributions,
    movements: [
      ...queuedMovements,
      ...previousQueuedMovements,
      ...(data.movements ?? []).filter(
        (movement) => !movement.pendingSync,
      ),
    ],
  }
}

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
  const [isOnline, setIsOnline] = useState(
    () => navigator.onLine,
  )
  const [usingCachedData, setUsingCachedData] = useState(false)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)
  const [pendingSyncOperations, setPendingSyncOperations] =
    useState([])
  const [syncStatus, setSyncStatus] = useState('idle')
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [lastSyncError, setLastSyncError] = useState('')

  const [assemblies, setAssemblies] = useState([])
  const [currentAssembly, setCurrentAssembly] = useState(null)

  const [publications, setPublications] = useState([])
  const [publicationCatalog, setPublicationCatalog] = useState([])
  const [movements, setMovements] = useState([])
  const [publishers, setPublishers] = useState([])
  const [pendingDistributions, setPendingDistributions] =
    useState([])
  const [stockOverview, setStockOverview] = useState([])

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

  const loadData = useCallback(async (
    assembly,
    { skipSync = false } = {},
  ) => {
    const assemblyId = assembly?.id
    const accessCode = getAssemblyAccessCode(assembly)

    if (!assemblyId) return

    setDataLoading(true)
    setDataError('')

    let cachedData = null
    let syncFailureMessage = ''

    try {
      cachedData = await getAssemblyCache(assemblyId)
    } catch (cacheError) {
      console.warn(
        'Impossible de lire le cache local :',
        cacheError,
      )
    }

    try {
      const queuedOperations = await listOfflineOperations()

      setPendingSyncOperations(queuedOperations)
      setPendingSyncCount(queuedOperations.length)
    } catch (queueError) {
      console.warn(
        'Impossible de lire la file de synchronisation :',
        queueError,
      )
    }

    const applyData = (data) => {
      setPublications(data?.publications ?? [])
      setPublicationCatalog(data?.publicationCatalog ?? [])
      setMovements(data?.movements ?? [])
      setPublishers(data?.publishers ?? [])
      setPendingDistributions(
        data?.pendingDistributions ?? [],
      )
      setStockOverview(data?.stockOverview ?? [])
    }

    if (!navigator.onLine) {
      if (cachedData) {
        applyData(cachedData)
        setUsingCachedData(true)
        setDataLoading(false)
        return
      }

      setDataError(
        'Aucune connexion Internet et aucune donnée hors ligne disponible pour cette assemblée.',
      )
      setDataLoading(false)
      return
    }

    try {
      if (!skipSync) {
        const queuedBeforeSync =
          await countOfflineOperations()

        setPendingSyncCount(queuedBeforeSync)

        if (queuedBeforeSync > 0) {
          setSyncStatus('syncing')

          const syncResult = await syncOfflineOperations({
            accessCodes: accessCode
              ? {
                  [String(assemblyId)]: accessCode,
                }
              : null,
          })

          const operationsAfterSync =
            await listOfflineOperations()

          setPendingSyncOperations(operationsAfterSync)
          setPendingSyncCount(operationsAfterSync.length)

          syncFailureMessage =
            syncResult.failed[0]?.error ?? ''

          setSyncStatus(
            syncResult.failed.length > 0 ? 'error' : 'idle',
          )
        }
      }

      const [
        nextPublications,
        nextPublicationCatalog,
        nextMovements,
        nextPublishers,
        nextPendingDistributions,
      ] = await Promise.all([
        getPublications(assemblyId),
        getPublicationCatalog(assemblyId).catch((catalogError) => {
          console.warn(
            'Catalogue des publications indisponible :',
            catalogError,
          )
          return cachedData?.publicationCatalog ?? []
        }),
        getStockMovements(assemblyId),
        getPublishers(assemblyId),
        accessCode
          ? getPendingDistributions(
              assemblyId,
              accessCode,
            )
          : Promise.resolve(
              cachedData?.pendingDistributions ?? [],
            ),
      ])

      const serverData = {
        publications: nextPublications,
        publicationCatalog: nextPublicationCatalog,
        movements: nextMovements,
        publishers: nextPublishers,
        pendingDistributions: nextPendingDistributions,
      }
      const remainingAssemblyOperations =
        await listOfflineOperations(assemblyId)
      const freshData = applyQueuedDistributions(
        serverData,
        remainingAssemblyOperations,
      )
      const remainingOperations =
        await listOfflineOperations()

      applyData(freshData)
      setUsingCachedData(false)
      setPendingSyncOperations(remainingOperations)
      setPendingSyncCount(remainingOperations.length)

      if (
        syncFailureMessage ||
        remainingAssemblyOperations.length > 0
      ) {
        const errorMessage =
          syncFailureMessage ||
          remainingAssemblyOperations.find(
            (operation) => operation.lastError,
          )?.lastError ||
          'Certaines opérations restent en attente de synchronisation.'

        setSyncStatus('error')
        setLastSyncError(errorMessage)
        saveSyncMetadata(assemblyId, {
          lastSyncError: errorMessage,
        })
      } else {
        const syncedAt = new Date().toISOString()

        setSyncStatus('idle')
        setLastSyncAt(syncedAt)
        setLastSyncError('')
        saveSyncMetadata(assemblyId, {
          lastSyncAt: syncedAt,
          lastSyncError: '',
        })
      }

      try {
        await saveAssemblyCache(assemblyId, freshData)
      } catch (cacheError) {
        console.warn(
          'Impossible de sauvegarder le cache local :',
          cacheError,
        )
      }
    } catch (error) {
      const errorMessage =
        error?.message ??
        'Impossible de synchroniser les données.'

      setSyncStatus('error')
      setLastSyncError(errorMessage)
      saveSyncMetadata(assemblyId, {
        lastSyncError: errorMessage,
      })

      if (cachedData) {
        console.warn(
          'Supabase est indisponible. Utilisation du cache local :',
          error,
        )
        applyData(cachedData)
        setUsingCachedData(true)
        setDataError('')
      } else {
        setDataError(errorMessage)
      }
    } finally {
      setDataLoading(false)
    }
  }, [])

  const loadAssemblies = useCallback(async () => {
    setAssembliesLoading(true)
    setDataError('')

    const restoreSavedAssembly = async () => {
      const savedAssembly =
        getActiveAssembly() ?? getAssemblySession()

      if (!savedAssembly) return false

      setAssemblies([savedAssembly])
      setCurrentAssembly(savedAssembly)
      await loadData(savedAssembly)

      return true
    }

    if (!navigator.onLine) {
      const restored = await restoreSavedAssembly()

      if (!restored) {
        setDataError(
          'Aucune assemblée n’est disponible hors ligne sur cet appareil.',
        )
      }

      setAssembliesLoading(false)
      return
    }

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
        saveActiveAssembly(nextCurrentAssembly)
        await loadData(nextCurrentAssembly)
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
      const restored = await restoreSavedAssembly()

      if (!restored) {
        setAssemblies([])
        setCurrentAssembly(null)
        setDataError(error.message)
      }
    } finally {
      setAssembliesLoading(false)
    }
  }, [loadData])

  useEffect(() => {
    let active = true

    Promise.resolve().then(() => {
      if (!active) return

      if (session) {
        loadAssemblies()
        return
      }

      if (assemblySession) {
        saveActiveAssembly(assemblySession)
        setAssemblies([assemblySession])
        setCurrentAssembly(assemblySession)
        loadData(assemblySession)
        return
      }

      setAssemblies([])
      setCurrentAssembly(null)
      setPublications([])
      setPublicationCatalog([])
      setMovements([])
      setPublishers([])
      setPendingDistributions([])
      setStockOverview([])
      setDataError('')
    })

    return () => {
      active = false
    }
  }, [
    session,
    assemblySession,
    loadAssemblies,
    loadData,
  ])

  useEffect(() => {
    let active = true

    const refreshPendingCount = async () => {
      const operations = await listOfflineOperations()

      if (active) {
        setPendingSyncOperations(operations)
        setPendingSyncCount(operations.length)
      }
    }

    const handleOnline = () => {
      setIsOnline(true)

      if (currentAssembly?.id) {
        loadData(currentAssembly)
      }
    }
    const handleOffline = () => {
      setIsOnline(false)
      setUsingCachedData(true)
      setSyncStatus('idle')
    }
    const handleQueueChanged = () => {
      refreshPendingCount().catch((error) => {
        console.warn(
          'Actualisation de la file de synchronisation impossible :',
          error,
        )
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener(
      OFFLINE_QUEUE_CHANGED_EVENT,
      handleQueueChanged,
    )

    const metadata = readSyncMetadata(
      currentAssembly?.id,
    )

    setLastSyncAt(metadata.lastSyncAt)
    setLastSyncError(metadata.lastSyncError)

    refreshPendingCount().catch((error) => {
      console.warn(
        'Actualisation de la file de synchronisation impossible :',
        error,
      )
    })

    return () => {
      active = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener(
        OFFLINE_QUEUE_CHANGED_EVENT,
        handleQueueChanged,
      )
    }
  }, [currentAssembly, loadData])

  useEffect(() => {
    if (
      !currentAssembly?.id ||
      stockOverview.length === 0
    ) {
      return
    }

    saveAssemblyCache(currentAssembly.id, {
      publications,
      publicationCatalog,
      movements,
      publishers,
      pendingDistributions,
      stockOverview,
    }).catch((cacheError) => {
      console.warn(
        'Impossible de sauvegarder l’état du stock :',
        cacheError,
      )
    })
  }, [
    currentAssembly?.id,
    publications,
    publicationCatalog,
    movements,
    publishers,
    pendingDistributions,
    stockOverview,
  ])

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
    saveActiveAssembly(assembly)
    await loadData(assembly)
  }

  const persistCurrentData = async ({
    nextPublications = publications,
    nextPublicationCatalog = publicationCatalog,
    nextMovements = movements,
    nextPublishers = publishers,
    nextPendingDistributions = pendingDistributions,
    nextStockOverview = stockOverview,
  } = {}) => {
    if (!currentAssembly?.id) return

    try {
      await saveAssemblyCache(currentAssembly.id, {
        publications: nextPublications,
        publicationCatalog: nextPublicationCatalog,
        movements: nextMovements,
        publishers: nextPublishers,
        pendingDistributions: nextPendingDistributions,
        stockOverview: nextStockOverview,
      })
    } catch (cacheError) {
      console.warn(
        'Impossible de mettre à jour le cache local :',
        cacheError,
      )
    }
  }

  const addPublication = async (publication) => {
    const created = await createPublication(
      publication,
      currentAssembly?.id,
      currentAssembly?.code,
    )

    const nextPublications = [...publications, created].sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'fr'),
    )
    setPublications(nextPublications)

    const nextMovements = await getStockMovements(
      currentAssembly.id,
    )

    setMovements(nextMovements)
    await persistCurrentData({
      nextPublications,
      nextMovements,
    })

    return created
  }

  const addPublicationCatalogEntry = async ({ name, hasDate }) => {
    const created = await createPublicationCatalogEntry({
      assemblyId: currentAssembly?.id,
      name,
      hasDate,
    })
    const nextPublicationCatalog = [
      ...publicationCatalog,
      created,
    ].sort((left, right) => left.name.localeCompare(right.name, 'fr'))

    setPublicationCatalog(nextPublicationCatalog)
    await persistCurrentData({ nextPublicationCatalog })

    return created
  }

  const removePublication = async (id) => {
    await deletePublication(
      id,
      currentAssembly?.id,
      currentAssembly?.code,
    )

    const nextPublications = publications.filter(
      (item) => item.id !== id,
    )
    const nextMovements = movements.filter(
      (item) => item.publicationId !== id,
    )

    setPublications(nextPublications)
    setMovements(nextMovements)
    await persistCurrentData({
      nextPublications,
      nextMovements,
    })
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
        assemblyId: currentAssembly?.id,
      })

      const nextPublications = publications.map((item) =>
        item.id === updated.id ? updated : item,
      )
      const nextMovements = [movement, ...movements]

      setPublications(nextPublications)
      setMovements(nextMovements)
      await persistCurrentData({
        nextPublications,
        nextMovements,
      })

      return updated
    } catch (error) {
      await updatePublicationStock(
        updated,
        -numericAmount,
        currentAssembly?.id,
        currentAssembly?.code,
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

    const nextPublishers = [...publishers, created].sort(
      (a, b) => {
        const lastNameComparison =
          a.lastName.localeCompare(b.lastName, 'fr')

        if (lastNameComparison !== 0) {
          return lastNameComparison
        }

        return a.firstName.localeCompare(
          b.firstName,
          'fr',
        )
      },
    )
    setPublishers(nextPublishers)
    await persistCurrentData({
      nextPublishers,
    })

    return created
  }

  const editPublisher = async (id, publisher) => {
    const updated = await updatePublisher(
      id,
      publisher,
      currentAssembly?.id,
      currentAssembly?.code,
    )

    const nextPublishers = publishers
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
      })

    setPublishers(nextPublishers)
    await persistCurrentData({
      nextPublishers,
    })

    return updated
  }

  const removePublisher = async (id) => {
    await deletePublisher(
      id,
      currentAssembly?.id,
      currentAssembly?.code,
    )

    const nextPublishers = publishers.filter(
      (item) => item.id !== id,
    )

    setPublishers(nextPublishers)
    await persistCurrentData({
      nextPublishers,
    })
  }

  const saveDistributions = async (rows) => {
    if (!currentAssembly?.id) {
      throw new Error(
        'Aucune assemblée n’est sélectionnée.',
      )
    }

    const accessCode = getAssemblyAccessCode(
      currentAssembly,
    )

    if (String(accessCode).replace(/\D/g, '').length !== 6) {
      throw new Error(
        'Le code de l’assemblée est introuvable.',
      )
    }

    const queuedOperations = []

    for (const row of rows) {
      const result = await enqueueDistributionOperation({
        assemblyId: currentAssembly.id,
        accessCode,
        publisherId: row.publisherId,
        publicationId: row.publicationId,
        quantity: row.remainingQuantity,
        publicationName: row.publicationName,
        publisherName:
          `${row.publisherFirstName ?? ''} ${row.publisherLastName ?? ''}`.trim(),
      })

      queuedOperations.push(result.operation)
    }

    const optimisticData = applyQueuedDistributions(
      {
        publications,
        publicationCatalog,
        movements,
        publishers,
        pendingDistributions,
        stockOverview,
      },
      queuedOperations,
    )

    setPublications(optimisticData.publications)
    setMovements(optimisticData.movements)
    setPendingDistributions(
      optimisticData.pendingDistributions,
    )

    try {
      await saveAssemblyCache(
        currentAssembly.id,
        optimisticData,
      )
    } catch (cacheError) {
      console.warn(
        'Impossible de sauvegarder la distribution hors ligne :',
        cacheError,
      )
    }

    setPendingSyncCount(
      await countOfflineOperations(),
    )

    if (!navigator.onLine) {
      setIsOnline(false)

      return {
        queued: true,
      }
    }

    setSyncStatus('syncing')

    const syncResult = await syncOfflineOperations({
      accessCodes: {
        [String(currentAssembly.id)]: accessCode,
      },
    })

    const operationsAfterSync =
      await listOfflineOperations()

    setPendingSyncOperations(operationsAfterSync)
    setPendingSyncCount(operationsAfterSync.length)
    setSyncStatus(
      syncResult.failed.length > 0 ? 'error' : 'idle',
    )

    await loadData(currentAssembly, {
      skipSync: true,
    })

    return {
      queued:
        (await countOfflineOperations(
          currentAssembly.id,
        )) > 0,
    }
  }

  const handleRetrySynchronization = async () => {
    if (!navigator.onLine || !currentAssembly?.id) return

    setSyncStatus('syncing')
    setLastSyncError('')

    await loadData(currentAssembly)
  }

  const handleCancelSyncOperation = async (operationId) => {
    if (!navigator.onLine || !currentAssembly?.id) return

    await removeOfflineOperation(operationId)

    const remainingOperations =
      await listOfflineOperations()

    setPendingSyncOperations(remainingOperations)
    setPendingSyncCount(remainingOperations.length)

    await loadData(currentAssembly, {
      skipSync: true,
    })
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
      saveActiveAssembly(savedSession)

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
      clearActiveAssembly()
      localStorage.removeItem(ACTIVE_ASSEMBLY_STORAGE_KEY)

      setSession(null)
      setAssemblySession(null)
      setAssemblies([])
      setCurrentAssembly(null)
      setPublications([])
      setPublicationCatalog([])
      setMovements([])
      setPublishers([])
      setPendingDistributions([])
      setStockOverview([])
      setUsingCachedData(false)
      setPendingSyncOperations([])
      setPendingSyncCount(0)
      setSyncStatus('idle')
      setLastSyncAt(null)
      setLastSyncError('')
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
    screen === 'administration' ||
    screen === 'more' ||
    screen === 'syncStatus' ||
    screen === 'installation' ||
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
    screen === 'administration' ||
    screen === 'adminPanel'

  const visibleScreen =
    isAssembly && adminOnlyScreen
      ? 'dashboard'
      : screen

  const currentSyncOperations = currentAssembly?.id
    ? pendingSyncOperations.filter(
        (operation) =>
          String(operation.assemblyId) ===
          String(currentAssembly.id),
      )
    : pendingSyncOperations

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
        publishers={publishers}
        pendingDistributions={pendingDistributions}
        cachedStockOverview={stockOverview}
        onStockOverviewChange={setStockOverview}
        currentAssembly={currentAssembly}
        onNavigate={setScreen}
        isAdmin={isAdmin}
        isOnline={isOnline && !usingCachedData}
        pendingSyncCount={currentSyncOperations.length}
        syncStatus={syncStatus}
      />
    ),

    inventory: (
      <Inventory
        publications={publications}
        publicationCatalog={publicationCatalog}
        movements={movements}
        currentAssembly={currentAssembly}
        onAdd={addPublication}
        onAddCatalogEntry={addPublicationCatalogEntry}
        onChangeStock={changeStock}
        onDelete={removePublication}
        onNavigate={setScreen}
        isAdmin={isAdmin}
      />
    ),

    distribution: (
      <Distribution
        currentAssembly={currentAssembly}
        pendingDistributions={pendingDistributions}
        onSaveDistribution={saveDistributions}
        onNavigate={setScreen}
        isAdmin={isAdmin}
        isOnline={isOnline && !usingCachedData}
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
        pendingSyncCount={currentSyncOperations.length}
        syncStatus={syncStatus}
        lastSyncAt={lastSyncAt}
        onNavigate={setScreen}
        onLogout={handleLogout}
        logoutLoading={logoutLoading}
        isAdmin={isAdmin}
      />
    ),

    administration: (
      <Administration
        currentAssembly={currentAssembly}
        publisherCount={publishers.length}
        onNavigate={setScreen}
      />
    ),

    syncStatus: (
      <SyncStatus
        currentAssembly={currentAssembly}
        isOnline={isOnline}
        usingCachedData={usingCachedData}
        syncStatus={syncStatus}
        operations={currentSyncOperations}
        lastSyncAt={lastSyncAt}
        lastSyncError={lastSyncError}
        onRetry={handleRetrySynchronization}
        onCancel={handleCancelSyncOperation}
        onBack={() => setScreen('more')}
      />
    ),

    installation: (
      <InstallationGuide
        onBack={() => setScreen('more')}
      />
    ),

    privacy: (
      <AppInformation
        document="privacy"
        onBack={() =>
          setScreen(session || assemblySession ? 'more' : 'welcome')
        }
      />
    ),

    terms: (
      <AppInformation
        document="terms"
        onBack={() =>
          setScreen(session || assemblySession ? 'more' : 'welcome')
        }
      />
    ),

    releaseNotes: (
      <AppInformation
        document="releaseNotes"
        onBack={() =>
          setScreen(session || assemblySession ? 'more' : 'welcome')
        }
      />
    ),

    support: (
      <AppInformation
        document="support"
        onBack={() =>
          setScreen(session || assemblySession ? 'more' : 'welcome')
        }
      />
    ),

    adminPanel: (
      <AdminPanel
        onBack={() => setScreen('administration')}
      />
    ),
  }

  return (
    <main className="app-shell">
      <PwaUpdatePrompt />

      <div
        className="offline-status-stack"
        aria-live="polite"
      >
        {(!isOnline || usingCachedData) && (
          <div className="offline-banner" role="status">
            <strong>Mode hors ligne</strong>
            <span>
              Les données enregistrées sur cet appareil restent
              disponibles.
            </span>
          </div>
        )}

        {pendingSyncCount > 0 && (
          <div
            className="sync-banner"
            role="status"
          >
            <div>
              <strong>
                {syncStatus === 'syncing'
                  ? 'Synchronisation en cours…'
                  : `${pendingSyncCount} distribution${
                      pendingSyncCount > 1 ? 's' : ''
                    } à synchroniser`}
              </strong>
              <span>
                {isOnline
                  ? syncStatus === 'error'
                    ? 'La synchronisation sera retentée automatiquement.'
                    : 'Les données sont envoyées vers PubliService.'
                  : 'La synchronisation démarrera au retour d’Internet.'}
              </span>
            </div>

            {isOnline && syncStatus !== 'syncing' && (
              <button
                type="button"
                onClick={() => loadData(currentAssembly)}
              >
                Réessayer
              </button>
            )}
          </div>
        )}
      </div>

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
                await loadData(currentAssembly)
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
