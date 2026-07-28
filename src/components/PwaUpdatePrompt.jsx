import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

let updateCheckInterval = null

function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      if (updateCheckInterval) return

      updateCheckInterval = window.setInterval(() => {
        registration.update().catch((error) => {
          console.warn(
            'Vérification de mise à jour impossible :',
            error,
          )
        })
      }, 60 * 60 * 1000)
    },
    onRegisterError(error) {
      console.error(
        'Enregistrement du mode hors ligne impossible :',
        error,
      )
    },
  })

  useEffect(() => {
    if (!offlineReady || needRefresh) return undefined

    const timeout = window.setTimeout(
      () => setOfflineReady(false),
      5500,
    )

    return () => window.clearTimeout(timeout)
  }, [offlineReady, needRefresh, setOfflineReady])

  if (!offlineReady && !needRefresh) return null

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <aside
      className={
        needRefresh
          ? 'pwa-update-toast pwa-update-toast--available'
          : 'pwa-update-toast'
      }
      role="status"
      aria-live="polite"
    >
      <div>
        <strong>
          {needRefresh
            ? 'Nouvelle version disponible'
            : 'PubliService est prêt hors ligne'}
        </strong>
        <span>
          {needRefresh
            ? 'La mise à jour prend seulement quelques secondes.'
            : 'Les données déjà chargées resteront accessibles sans connexion.'}
        </span>
      </div>

      <div className="pwa-update-actions">
        {needRefresh ? (
          <button
            className="pwa-update-confirm"
            type="button"
            onClick={() => updateServiceWorker(true)}
          >
            Mettre à jour
          </button>
        ) : null}

        <button
          className="pwa-update-close"
          type="button"
          aria-label={
            needRefresh ? 'Reporter la mise à jour' : 'Fermer'
          }
          onClick={close}
        >
          {needRefresh ? 'Plus tard' : 'Fermer'}
        </button>
      </div>
    </aside>
  )
}

export default PwaUpdatePrompt
