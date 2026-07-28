import { del, get, set } from 'idb-keyval'

const CACHE_VERSION = 2
const CACHE_PREFIX = 'publiservice-assembly-cache'

function requireAssemblyId(assemblyId) {
  if (!assemblyId) {
    throw new Error(
      'Aucune assemblée n’est sélectionnée pour le cache.',
    )
  }

  return String(assemblyId)
}

function createCacheKey(assemblyId, version = CACHE_VERSION) {
  const safeAssemblyId = requireAssemblyId(assemblyId)

  return `${CACHE_PREFIX}:v${version}:${safeAssemblyId}`
}

function normalizeCache(cache, assemblyId) {
  if (!cache) return null

  return {
    ...cache,
    version: CACHE_VERSION,
    assemblyId: String(assemblyId),
    publications: Array.isArray(cache.publications)
      ? cache.publications
      : [],
    publicationCatalog: Array.isArray(cache.publicationCatalog)
      ? cache.publicationCatalog
      : [],
    movements: Array.isArray(cache.movements)
      ? cache.movements
      : [],
    publishers: Array.isArray(cache.publishers)
      ? cache.publishers
      : [],
    pendingDistributions: Array.isArray(
      cache.pendingDistributions,
    )
      ? cache.pendingDistributions
      : [],
    stockOverview: Array.isArray(cache.stockOverview)
      ? cache.stockOverview
      : [],
  }
}

export async function saveAssemblyCache(
  assemblyId,
  {
    publications = [],
    publicationCatalog = [],
    movements = [],
    publishers = [],
    pendingDistributions = [],
    stockOverview = [],
  } = {},
) {
  const key = createCacheKey(assemblyId)

  const cache = {
    version: CACHE_VERSION,
    assemblyId: String(assemblyId),
    publications,
    publicationCatalog,
    movements,
    publishers,
    pendingDistributions,
    stockOverview,
    savedAt: new Date().toISOString(),
  }

  await set(key, cache)

  return cache
}

export async function getAssemblyCache(assemblyId) {
  const key = createCacheKey(assemblyId)
  let cache = await get(key)

  if (!cache) {
    const legacyKey = createCacheKey(assemblyId, 1)
    const legacyCache = await get(legacyKey)

    if (legacyCache) {
      cache = normalizeCache(legacyCache, assemblyId)
      await set(key, cache)
    }
  }

  return normalizeCache(cache, assemblyId)
}

export async function hasAssemblyCache(assemblyId) {
  const cache = await getAssemblyCache(assemblyId)

  return Boolean(cache)
}

export async function clearAssemblyCache(assemblyId) {
  const key = createCacheKey(assemblyId)
  const legacyKey = createCacheKey(assemblyId, 1)

  await Promise.all([
    del(key),
    del(legacyKey),
  ])
}
