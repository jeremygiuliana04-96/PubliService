import packageInfo from '../../package.json'

const SUPPORT_EMAIL = 'jeremy.giuliana04@gmail.com'
const LAST_UPDATED = '26 juillet 2026'

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

function InformationLayout({
  eyebrow,
  title,
  intro,
  onBack,
  children,
}) {
  return (
    <section className="phone-page dashboard-page information-page">
      <header className="information-header">
        <button
          type="button"
          aria-label="Revenir à l’écran Plus"
          onClick={onBack}
        >
          <BackIcon />
        </button>

        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </header>

      <div className="information-content">
        {intro ? <p className="information-intro">{intro}</p> : null}
        {children}
      </div>
    </section>
  )
}

function InformationSection({ title, children }) {
  return (
    <section className="information-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function PrivacyPolicy({ onBack }) {
  const deletionSubject = encodeURIComponent(
    'Demande relative à mes données PubliService',
  )

  return (
    <InformationLayout
      eyebrow="Informations légales"
      title="Confidentialité et données"
      intro={`Dernière mise à jour : ${LAST_UPDATED}`}
      onBack={onBack}
    >
      <InformationSection title="Responsable et contact">
        <p>
          PubliService est exploité par Jérémy Giuliana. Toute
          question relative aux données personnelles peut être
          envoyée à{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
        <p>
          L’assemblée et ses administrateurs déterminent les
          informations qu’ils enregistrent dans PubliService. Ils
          doivent informer les personnes concernées et s’assurer
          qu’ils disposent d’une base juridique appropriée.
        </p>
      </InformationSection>

      <InformationSection title="Données utilisées">
        <ul>
          <li>
            adresse e-mail et informations d’authentification des
            administrateurs ;
          </li>
          <li>
            nom de l’assemblée, statut et code d’accès ;
          </li>
          <li>
            nom et prénom des proclamateurs, ainsi que leurs
            préférences de publications ;
          </li>
          <li>
            publications, quantités, stocks, mouvements et
            historique des distributions ;
          </li>
          <li>
            informations techniques nécessaires à la sécurité, au
            fonctionnement et à la synchronisation.
          </li>
        </ul>
        <div className="information-notice">
          <strong>Protection renforcée</strong>
          <p>
            Dans leur contexte, certaines informations peuvent
            révéler ou permettre de déduire une participation à une
            activité religieuse. Elles doivent être limitées au
            strict nécessaire et accessibles uniquement aux
            personnes autorisées.
          </p>
        </div>
      </InformationSection>

      <InformationSection title="Finalités">
        <p>Ces données servent uniquement à :</p>
        <ul>
          <li>authentifier les administrateurs et les assemblées ;</li>
          <li>gérer les publications et l’état du stock ;</li>
          <li>préparer et enregistrer les distributions ;</li>
          <li>
            permettre l’utilisation hors ligne et la synchronisation
            au retour de la connexion ;
          </li>
          <li>sécuriser et maintenir le service.</li>
        </ul>
        <p>
          PubliService ne vend pas les données et n’utilise ni
          publicité ciblée ni outil d’analyse publicitaire.
        </p>
      </InformationSection>

      <InformationSection title="Stockage et destinataires">
        <p>
          Les données en ligne sont traitées au moyen de Supabase
          pour la base de données et l’authentification, et de Vercel
          pour l’hébergement de l’application. Ces prestataires
          techniques n’interviennent que pour fournir leurs services.
        </p>
        <p>
          Une copie locale peut être conservée dans le navigateur ou
          sur l’appareil afin de rendre PubliService disponible hors
          ligne. Les distributions enregistrées sans connexion sont
          conservées localement jusqu’à leur synchronisation.
        </p>
      </InformationSection>

      <InformationSection title="Conservation">
        <p>
          Les données sont conservées pendant l’utilisation de
          PubliService par l’assemblée, puis supprimées lorsqu’elles
          ne sont plus nécessaires ou lorsqu’une demande valable est
          traitée. Les données locales restent sur l’appareil jusqu’à
          l’effacement des données du site ou de l’application.
        </p>
      </InformationSection>

      <InformationSection title="Vos droits">
        <p>
          Selon le RGPD, une personne peut notamment demander
          l’accès, la rectification, l’effacement, la limitation ou
          l’opposition au traitement de ses données, lorsque ces
          droits sont applicables.
        </p>
        <a
          className="information-action"
          href={`mailto:${SUPPORT_EMAIL}?subject=${deletionSubject}`}
        >
          Demander l’accès ou la suppression de mes données
        </a>
        <a
          className="information-secondary-link"
          href="/data-deletion.html"
          target="_blank"
          rel="noreferrer"
        >
          Consulter la procédure de suppression
        </a>
      </InformationSection>

      <InformationSection title="Sécurité et modifications">
        <p>
          PubliService utilise des contrôles d’accès, des connexions
          chiffrées et des règles d’accès à la base de données. Aucun
          système ne peut toutefois garantir une sécurité absolue.
        </p>
        <p>
          Cette politique peut évoluer avec l’application. La date
          affichée en haut de la page indique sa dernière mise à
          jour.
        </p>
      </InformationSection>

      <a
        className="information-secondary-link information-public-link"
        href="/privacy-policy.html"
        target="_blank"
        rel="noreferrer"
      >
        Ouvrir la version publique de cette politique
      </a>
    </InformationLayout>
  )
}

function TermsOfUse({ onBack }) {
  return (
    <InformationLayout
      eyebrow="Informations légales"
      title="Conditions d’utilisation"
      intro={`Version en vigueur au ${LAST_UPDATED}`}
      onBack={onBack}
    >
      <InformationSection title="Objet du service">
        <p>
          PubliService est un outil indépendant destiné à faciliter
          la gestion interne des publications, des stocks et des
          distributions d’une assemblée.
        </p>
        <div className="information-notice">
          <strong>Application non officielle</strong>
          <p>
            PubliService n’est ni édité, ni parrainé, ni approuvé par
            l’organisation des Témoins de Jéhovah ou par jw.org.
          </p>
        </div>
      </InformationSection>

      <InformationSection title="Accès autorisé">
        <p>
          L’utilisateur doit disposer de l’autorisation nécessaire
          pour accéder aux données d’une assemblée. Les identifiants
          administrateur et les codes d’accès ne doivent pas être
          partagés avec une personne non autorisée.
        </p>
      </InformationSection>

      <InformationSection title="Données et exactitude">
        <p>
          Les administrateurs sont responsables des informations
          qu’ils saisissent, de leur exactitude, de leur mise à jour
          et du respect des personnes concernées. Seules les données
          strictement utiles au fonctionnement du service doivent
          être enregistrées.
        </p>
      </InformationSection>

      <InformationSection title="Mode hors ligne">
        <p>
          Les opérations réalisées hors ligne sont enregistrées sur
          l’appareil puis synchronisées lorsque la connexion revient.
          L’utilisateur doit vérifier le résultat de la
          synchronisation avant de considérer une opération comme
          définitivement enregistrée.
        </p>
      </InformationSection>

      <InformationSection title="Disponibilité">
        <p>
          Des interruptions peuvent survenir lors d’une maintenance,
          d’une panne réseau ou d’un incident chez un prestataire.
          PubliService est fourni comme outil d’assistance ; il ne
          remplace pas les vérifications organisationnelles utiles.
        </p>
      </InformationSection>

      <InformationSection title="Contact">
        <p>
          Une question concernant ces conditions peut être envoyée à{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </InformationSection>
    </InformationLayout>
  )
}

function ReleaseNotes({ onBack }) {
  return (
    <InformationLayout
      eyebrow="PubliService"
      title="Notes de mise à jour"
      intro={`Version installée : ${packageInfo.version}`}
      onBack={onBack}
    >
      <article className="release-card">
        <div className="release-card-heading">
          <div>
            <span>Version {packageInfo.version}</span>
            <h2>Catalogue et dates optionnelles</h2>
          </div>
          <time dateTime="2026-07-27">27 juillet 2026</time>
        </div>

        <ul>
          <li>
            formulaire complet Publication, Langue, Format et Date
            désormais identique pour les administrateurs et les
            assemblées ;
          </li>
          <li>
            l’option de création d’un nouveau nom reste exclusivement
            réservée aux administrateurs ;
          </li>
          <li>
            regroupement des anciens intitulés contenant une langue,
            un format ou une date en une seule publication ;
          </li>
          <li>
            catalogue composé de noms uniques afin d’éviter une entrée
            différente pour chaque mois et chaque année ;
          </li>
          <li>
            ajout de l’option « Créer une nouvelle publication »,
            réservée aux administrateurs ;
          </li>
          <li>
            choix entre publication datée et publication sans date ;
          </li>
          <li>
            les champs Mois et Année sont masqués lorsqu’ils ne sont
            pas nécessaires ;
          </li>
          <li>
            regroupement du stock en rubriques, avec les publications
            classées par date croissante ;
          </li>
          <li>
            conservation et classement automatique de toutes les
            publications déjà présentes dans chaque assemblée ;
          </li>
          <li>
            création de nouvelles publications réservée aux
            administrateurs ;
          </li>
          <li>
            langue, format, mois et année conservés dans un formulaire
            structuré ;
          </li>
          <li>
            pour les assemblées, ajout de stock limité aux
            publications préalablement définies par un administrateur.
          </li>
        </ul>
      </article>

      <article className="release-card">
        <div className="release-card-heading">
          <div>
            <span>Version 1.3.2</span>
            <h2>Création depuis la liste</h2>
          </div>
          <time dateTime="2026-07-27">27 juillet 2026</time>
        </div>

        <ul>
          <li>
            ajout d’une nouvelle publication directement depuis le
            menu déroulant administrateur ;
          </li>
          <li>
            ajout automatique du nouveau nom dans l’assemblée
            sélectionnée.
          </li>
        </ul>
      </article>

      <article className="release-card">
        <div className="release-card-heading">
          <div>
            <span>Version 1.2.0</span>
            <h2>Navigation et prévision de commande</h2>
          </div>
          <time dateTime="2026-07-26">26 juillet 2026</time>
        </div>

        <ul>
          <li>
            accueil repensé autour de la préparation des commandes ;
          </li>
          <li>
            calcul du besoin prévu, de la quantité à commander et du
            surplus estimé ;
          </li>
          <li>
            accès direct à la distribution depuis l’accueil ;
          </li>
          <li>
            navigation réorganisée avec les écrans Distribution,
            Stock et Administration ;
          </li>
          <li>
            regroupement des options secondaires dans Réglages et
            aide.
          </li>
        </ul>
      </article>

      <article className="release-card">
        <div className="release-card-heading">
          <div>
            <span>Version 1.1.0</span>
            <h2>Synchronisation et installation</h2>
          </div>
          <time dateTime="2026-07-26">26 juillet 2026</time>
        </div>

        <ul>
          <li>nouvel écran de suivi de la synchronisation ;</li>
          <li>
            détail et annulation des distributions en attente ;
          </li>
          <li>
            affichage de la dernière synchronisation réussie et des
            erreurs ;
          </li>
          <li>
            notification lorsqu’une nouvelle version est disponible ;
          </li>
          <li>
            guide d’installation adapté à l’iPhone, l’iPad, Android
            et l’ordinateur.
          </li>
        </ul>
      </article>

      <article className="release-card">
        <div className="release-card-heading">
          <div>
            <span>Version 1.0.0</span>
            <h2>Première version aboutie</h2>
          </div>
          <time dateTime="2026-07-26">26 juillet 2026</time>
        </div>

        <ul>
          <li>consultation des données déjà chargées hors ligne ;</li>
          <li>
            enregistrement des distributions sans connexion et
            synchronisation automatique ;
          </li>
          <li>
            gestion des assemblées, publications, stocks et
            proclamateurs ;
          </li>
          <li>historique et préférences de distribution ;</li>
          <li>navigation mobile et tablette optimisée ;</li>
          <li>
            ajout des informations de confidentialité, d’assistance
            et de suppression des données.
          </li>
        </ul>
      </article>
    </InformationLayout>
  )
}

function Support({ onBack }) {
  const supportSubject = encodeURIComponent(
    `Assistance PubliService ${packageInfo.version}`,
  )
  const deletionSubject = encodeURIComponent(
    'Demande de suppression de données PubliService',
  )

  return (
    <InformationLayout
      eyebrow="Aide"
      title="Assistance et suppression"
      intro="Nous répondons aux questions techniques et aux demandes relatives aux données."
      onBack={onBack}
    >
      <InformationSection title="Contacter l’assistance">
        <p>
          Décrivez le problème rencontré, l’écran concerné et, si
          possible, la version de PubliService utilisée.
        </p>
        <a
          className="information-action"
          href={`mailto:${SUPPORT_EMAIL}?subject=${supportSubject}`}
        >
          Envoyer une demande d’assistance
        </a>
        <p className="information-contact">
          {SUPPORT_EMAIL}
        </p>
      </InformationSection>

      <InformationSection title="Supprimer des données">
        <p>
          Une personne concernée ou un administrateur autorisé peut
          demander la suppression d’un compte administrateur, d’une
          fiche de proclamateur ou des données d’une assemblée. La
          demande doit permettre d’identifier précisément les données
          concernées.
        </p>
        <a
          className="information-action information-action--danger"
          href={`mailto:${SUPPORT_EMAIL}?subject=${deletionSubject}`}
        >
          Demander une suppression
        </a>
        <a
          className="information-secondary-link"
          href="/data-deletion.html"
          target="_blank"
          rel="noreferrer"
        >
          Voir la procédure complète
        </a>
      </InformationSection>

      <InformationSection title="Version">
        <p>
          PubliService {packageInfo.version} — application
          indépendante et non officielle.
        </p>
      </InformationSection>
    </InformationLayout>
  )
}

function AppInformation({ document, onBack }) {
  if (document === 'terms') {
    return <TermsOfUse onBack={onBack} />
  }

  if (document === 'releaseNotes') {
    return <ReleaseNotes onBack={onBack} />
  }

  if (document === 'support') {
    return <Support onBack={onBack} />
  }

  return <PrivacyPolicy onBack={onBack} />
}

export default AppInformation
