const ASSEMBLY_SESSION_KEY = 'publiservice-assembly-session'

export function saveAssemblySession(assembly) {
  const session = {
    id: assembly.id,
    name: assembly.name,
    isActive: assembly.isActive ?? true,
    code: assembly.code ?? assembly.accessCode ?? '',
  }

  localStorage.setItem(
    ASSEMBLY_SESSION_KEY,
    JSON.stringify(session),
  )

  return session
}

export function getAssemblySession() {
  const storedSession = localStorage.getItem(
    ASSEMBLY_SESSION_KEY,
  )

  if (!storedSession) return null

  try {
    const session = JSON.parse(storedSession)

    if (!session?.id || !session?.name) {
      clearAssemblySession()
      return null
    }

    return session
  } catch {
    clearAssemblySession()
    return null
  }
}

export function clearAssemblySession() {
  localStorage.removeItem(ASSEMBLY_SESSION_KEY)
}

