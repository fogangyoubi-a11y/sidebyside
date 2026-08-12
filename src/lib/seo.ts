/**
 * SEO — meta tags centralisés par route.
 *
 * Avantage de centraliser ici plutôt qu'inline dans chaque Route :
 *  - On voit toute la stratégie SEO d'un coup d'œil
 *  - On peut auditer / améliorer les descriptions sans toucher au routing
 *  - Source unique de vérité pour les marketeurs (futur)
 */

import type { SeoHeadProps } from '@/components/seo/SeoHead';

const SITE = 'https://www.sidebyside.cm';

export const SEO_LANDING: SeoHeadProps = {
  title: 'SideBySide · Covoiturage Douala–Bafoussam',
  description:
    "Plateforme de covoiturage interurbain au Cameroun. Voyagez Douala–Bafoussam en sécurité, à prix partagé. Chauffeurs vérifiés, paiement Mobile Money.",
  canonical: `${SITE}/`,
  ogImage: `${SITE}/img/og-default.png`,
  locale: 'fr_CM',
};

export const SEO_DIASPORA: SeoHeadProps = {
  title: 'Offre un trajet sûr à ta famille au Cameroun · SideBySide Diaspora',
  description:
    "Tu es camerounais en Europe, USA, Canada ? Réserve depuis chez toi un chauffeur vérifié pour tes proches au pays. Paiement en euros. Suivi en temps réel.",
  ogTitle: 'Pour que maman voyage en sécurité, même quand tu es à 6 000 km',
  ogDescription:
    "Réserve depuis l'Europe. Paye en euros via PayPal. Reçois la confirmation d'arrivée. Cette nuit-là, dors enfin tranquille.",
  canonical: `${SITE}/diaspora`,
  ogImage: `${SITE}/img/og-diaspora.png`,
  locale: 'fr_BE',
};

export const SEO_ONBOARDING: SeoHeadProps = {
  title: "S'inscrire · SideBySide",
  description: 'Crée ton compte SideBySide en 2 minutes. Numéro vérifié par SMS, identité vérifiée, profil chauffeur ou passager.',
  canonical: `${SITE}/onboarding`,
  noindex: true, // Pages de tunnel, pas besoin d'indexation
};

export const SEO_LOGIN: SeoHeadProps = {
  title: 'Se connecter · SideBySide',
  description: 'Connecte-toi à ton compte SideBySide pour réserver un trajet ou en publier.',
  canonical: `${SITE}/login`,
  noindex: true,
};

export const SEO_SEARCH: SeoHeadProps = {
  title: 'Rechercher un trajet · SideBySide',
  description: "Trouve un trajet Douala–Bafoussam ou sur d'autres axes camerounais. Filtre par prix, note du chauffeur, options.",
  canonical: `${SITE}/search`,
  ogImage: `${SITE}/img/og-default.png`,
  locale: 'fr_CM',
};

export const SEO_TRIP_DETAIL = (tripId: string): SeoHeadProps => ({
  title: 'Détails du trajet · SideBySide',
  description: "Découvre le profil du chauffeur, les options du véhicule et les points de rendez-vous pour ce trajet.",
  canonical: `${SITE}/trip/${tripId}`,
  ogImage: `${SITE}/img/og-default.png`,
  locale: 'fr_CM',
});

export const SEO_BOOKING = (tripId: string): SeoHeadProps => ({
  title: 'Réservation · SideBySide',
  description: 'Réserve ton trajet en quelques clics. Paiement sécurisé via Mobile Money, carte ou PayPal.',
  canonical: `${SITE}/booking/${tripId}`,
  noindex: true, // Pas besoin d'indexer le tunnel de paiement
});

export const SEO_PUBLISH: SeoHeadProps = {
  title: 'Publier un trajet · SideBySide',
  description: 'Tu es chauffeur ? Publie ton trajet et gagne de l’argent en partageant ta voiture sur l’axe Douala–Bafoussam et au-delà.',
  canonical: `${SITE}/publish`,
  ogImage: `${SITE}/img/og-driver.png`,
  locale: 'fr_CM',
};

export const SEO_MY_TRIPS: SeoHeadProps = {
  title: 'Vos trajets · SideBySide',
  description: 'Toutes tes réservations à venir, passées et tes trajets publiés.',
  canonical: `${SITE}/my-trips`,
  noindex: true,
};

export const SEO_MESSAGES: SeoHeadProps = {
  title: 'Messages · SideBySide',
  description: 'Tes échanges sécurisés avec les chauffeurs et passagers.',
  canonical: `${SITE}/messages`,
  noindex: true,
};

export const SEO_PROFILE: SeoHeadProps = {
  title: 'Profil · SideBySide',
  description: 'Ton profil, tes stats, tes paramètres.',
  canonical: `${SITE}/profile`,
  noindex: true,
};

export const SEO_LEGAL: SeoHeadProps = {
  title: 'Informations légales · SideBySide',
  description:
    'Conditions générales, politique de confidentialité et cookies de SideBySide. Plateforme de covoiturage interurbain au Cameroun.',
  canonical: `${SITE}/legal`,
  locale: 'fr_CM',
};

export const SEO_CONTACT: SeoHeadProps = {
  title: 'Nous contacter · SideBySide',
  description:
    "Une question, une suggestion, un problème ? Écris-nous à contact@sidebyside.cm — réponse sous 48h ouvrées.",
  canonical: `${SITE}/contact`,
  locale: 'fr_CM',
};

export const SEO_ADMIN: SeoHeadProps = {
  title: 'Back-office · SideBySide',
  description: 'Interface d\'administration SideBySide.',
  canonical: `${SITE}/admin`,
  noindex: true,
};
