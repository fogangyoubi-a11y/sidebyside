/**
 * SeoHead — composant qui pose les meta tags d'une page.
 *
 * Encapsule react-helmet-async pour standardiser le SEO et
 * les previews sociaux (Open Graph + Twitter Card) sur toute l'app.
 *
 * Usage :
 *   <SeoHead
 *     title="Offrez un trajet · SideBySide Diaspora"
 *     description="Réservez depuis l'Europe..."
 *     canonical="https://www.sidebyside.cm/diaspora"
 *     ogImage="https://www.sidebyside.cm/img/og-diaspora.png"
 *   />
 */
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://www.sidebyside.cm';
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/og-default.png`;
const SITE_NAME = 'SideBySide';

export interface SeoHeadProps {
  /** Titre de la page (apparaît dans l'onglet + résultats Google). */
  title: string;
  /** Description courte (160 caractères max recommandé). */
  description: string;
  /** Title spécifique pour le partage social. Si omis, reprend `title`. */
  ogTitle?: string;
  /** Description spécifique pour le partage social. Si omise, reprend `description`. */
  ogDescription?: string;
  /** Image visible quand un lien est partagé sur WhatsApp/FB/X. 1200×630 recommandé. */
  ogImage?: string;
  /** Type de page. `article` pour blog, `website` pour le reste. */
  ogType?: 'website' | 'article';
  /** URL canonique de la page (sans paramètres de tracking). */
  canonical?: string;
  /** Locale pour Open Graph. `fr_CM` pour CM, `fr_BE` pour BE, etc. */
  locale?: 'fr_CM' | 'fr_FR' | 'fr_BE' | 'fr_CA';
  /** Si vrai → la page ne sera pas indexée par les moteurs. À utiliser pour /admin, /booking-confirmed, etc. */
  noindex?: boolean;
}

export function SeoHead({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  canonical,
  locale = 'fr_FR',
  noindex = false,
}: SeoHeadProps) {
  const fullTitle = title.toLowerCase().includes('sidebyside')
    ? title
    : `${title} · ${SITE_NAME}`;
  const finalOgTitle = ogTitle ?? title;
  const finalOgDescription = ogDescription ?? description;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph (Facebook / WhatsApp / LinkedIn / Pinterest) */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonical && <meta property="og:url" content={canonical} />}

      {/* Twitter Card (X) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
