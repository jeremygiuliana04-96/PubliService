let deferredInstallPrompt = null
const listeners = new Set()

function isStandalone() {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function getPlatform() {
  if (typeof navigator === 'undefined') return 'other'

  const userAgent = navigator.userAgent ?? ''
  const isIPadOS =
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1

  if (/iphone|ipad|ipod/i.test(userAgent) || isIPadOS) {
    return 'ios'
  }

  if (/android/i.test(userAgent)) return 'android'

  return 'desktop'
}

function getSnapshot() {
  return {
    canInstall: Boolean(deferredInstallPrompt),
    installed: isStandalone(),
    platform: getPlatform(),
  }
}

function notify() {
  const snapshot = getSnapshot()
  listeners.forEach((listener) => listener(snapshot))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    notify()
  })
}

export function getInstallState() {
  return getSnapshot()
}

export function subscribeToInstallState(listener) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export async function requestPwaInstallation() {
  if (!deferredInstallPrompt) return false

  const prompt = deferredInstallPrompt
  deferredInstallPrompt = null
  await prompt.prompt()

  const choice = await prompt.userChoice
  notify()

  return choice?.outcome === 'accepted'
}
