import { useEffect, useMemo, useState } from 'react'
import packageInfo from '../../package.json'
import {
  getInstallState,
  requestPwaInstallation,
  subscribeToInstallState,
} from '../lib/pwaInstall'

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function InstallationGuide({ onBack }) {
  const [installState, setInstallState] = useState(
    () => getInstallState(),
  )
  const [installing, setInstalling] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(
    () => subscribeToInstallState(setInstallState),
    [],
  )

  const content = useMemo(() => {
    if (installState.installed) {
      return {
        label: 'Application installée',
        title: 'PubliService est déjà installé',
        intro:
          'Tu peux l’ouvrir directement depuis l’écran d’accueil ou le menu des applications.',
        steps: [
          'Ouvre PubliService depuis son icône.',
          'Connecte-toi une première fois avec Internet.',
          'Les données chargées resteront ensuite disponibles hors ligne.',
        ],
      }
    }

    if (installState.platform === 'ios') {
      return {
        label: 'iPhone ou iPad',
        title: 'Installer avec Safari',
        intro:
          'Sur iPhone et iPad, l’installation se fait depuis le menu de partage de Safari.',
        steps: [
          'Ouvre PubliService dans Safari.',
          'Appuie sur le bouton Partager (le carré avec une flèche vers le haut).',
          'Fais défiler puis choisis « Sur l’écran d’accueil ».',
          'Appuie sur « Ajouter » pour terminer.',
        ],
      }
    }

    if (installState.platform === 'android') {
      return {
        label: 'Android',
        title: 'Installer sur Android',
        intro:
          'Chrome peut installer PubliService comme une application classique.',
        steps: [
          'Ouvre PubliService dans Chrome.',
          'Utilise le bouton ci-dessous ou le menu ⋮ de Chrome.',
          'Choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».',
          'Confirme l’installation.',
        ],
      }
    }

    return {
      label: 'Ordinateur',
      title: 'Installer sur cet ordinateur',
      intro:
        'Chrome ou Edge peut ajouter PubliService au menu des applications.',
      steps: [
        'Ouvre PubliService dans Chrome ou Microsoft Edge.',
        'Utilise le bouton ci-dessous ou l’icône d’installation dans la barre d’adresse.',
        'Confirme avec « Installer ».',
      ],
    }
  }, [installState])

  const install = async () => {
    if (installing) return

    setInstalling(true)
    setMessage('')

    try {
      const accepted = await requestPwaInstallation()

      setMessage(
        accepted
          ? 'Installation lancée avec succès.'
          : 'Installation annulée. Tu pourras la relancer plus tard.',
      )
    } catch (error) {
      console.error('Installation impossible :', error)
      setMessage(
        'Le navigateur ne permet pas de lancer automatiquement l’installation.',
      )
    } finally {
      setInstalling(false)
    }
  }

  return (
    <section className="phone-page dashboard-page installation-page">
      <header className="information-header">
        <button
          type="button"
          aria-label="Revenir à l’écran Plus"
          onClick={onBack}
        >
          <BackIcon />
        </button>

        <div>
          <p>Installation</p>
          <h1>Installer PubliService</h1>
        </div>
      </header>

      <div className="installation-content">
        <section className="installation-hero">
          <span>{content.label}</span>
          <h2>{content.title}</h2>
          <p>{content.intro}</p>

          {installState.canInstall &&
          !installState.installed ? (
            <button
              type="button"
              onClick={install}
              disabled={installing}
            >
              {installing
                ? 'Installation…'
                : 'Installer maintenant'}
            </button>
          ) : null}

          {message ? (
            <p className="installation-message" role="status">
              {message}
            </p>
          ) : null}
        </section>

        <ol className="installation-steps">
          {content.steps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>

        <section className="installation-note">
          <strong>À savoir</strong>
          <p>
            Après chaque déploiement, PubliService proposera
            automatiquement la nouvelle version. L’installation ne
            supprime pas les données déjà enregistrées hors ligne.
          </p>
        </section>

        <p className="installation-version">
          Version actuelle : {packageInfo.version}
        </p>
      </div>
    </section>
  )
}

export default InstallationGuide
