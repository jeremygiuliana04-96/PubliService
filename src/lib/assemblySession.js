const ASSEMBLY_SESSION_KEY = 'publiservice-assembly-session'
const ACTIVE_ASSEMBLY_KEY = 'publiservice-active-assembly'

function normalizeAssembly(assembly) {
  if (!assembly?.id || !assembly?.name) return null

  return {
    id: assembly.id,
    name: assembly.name,
    isActive: assembly.isActive ?? true,
    code:
      assembly.code ??
      assembly.accessCode ??
      assembly.access_code ??
      '',
  }
}

function readStoredAssembly(key) {
  const storedAssembly = localStorage.getItem(key)

  if (!storedAssembly) return null

  try {
    const assembly = normalizeAssembly(
      JSON.parse(storedAssembly),
    )

    if (!assembly) {
      localStorage.removeItem(key)
      return null
    }

    return assembly
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

export function saveAssemblySession(assembly) {
  const session = normalizeAssembly(assembly)

  if (!session) {
    throw new Error(
      'La session de l’assemblée est incomplète.',
    )
  }

  localStorage.setItem(
    ASSEMBLY_SESSION_KEY,
    JSON.stringify(session),
  )

  return session
}

export function getAssemblySession() {
  return readStoredAssembly(ASSEMBLY_SESSION_KEY)
}

export function clearAssemblySession() {
  localStorage.removeItem(ASSEMBLY_SESSION_KEY)
}

export function saveActiveAssembly(assembly) {
  const activeAssembly = normalizeAssembly(assembly)

  if (!activeAssembly) {
    throw new Error(
      'L’assemblée active est incomplète.',
    )
  }

  localStorage.setItem(
    ACTIVE_ASSEMBLY_KEY,
    JSON.stringify(activeAssembly),
  )

  return activeAssembly
}

export function getActiveAssembly() {
  return readStoredAssembly(ACTIVE_ASSEMBLY_KEY)
}

export function clearActiveAssembly() {
  localStorage.removeItem(ACTIVE_ASSEMBLY_KEY)
}

