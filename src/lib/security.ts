/**
 * Logique de sécurité SideBySide
 * - Validation forte du téléphone camerounais (E.164)
 * - Validation et force du mot de passe
 * - Gestion OTP 6 chiffres avec expiration + tentatives
 * - Niveaux de confiance (Trust Score)
 */

/* ===================================================================
   TÉLÉPHONE CAMEROUNAIS (E.164 +237 6XX XX XX XX)
   =================================================================== */

/** Préfixe pays Cameroun. */
export const CM_DIAL_CODE = '+237';

/**
 * Préfixes valides au Cameroun (après +237).
 * MTN : 67x, 68x, 65x, 69x  |  Orange : 65x, 69x, 6 autres
 * Les 6XX couvrent tous les mobiles modernes — on accepte donc 6XX et 2XX (fixe).
 */
const CM_VALID_PREFIXES = ['6', '2'];

export interface PhoneValidation {
  valid: boolean;
  formatted: string;       // ex. "+237 691 23 45 67"
  e164: string;            // ex. "+237691234567"
  operator?: 'MTN' | 'Orange' | 'Camtel' | 'Inconnu';
  error?: string;
}

/**
 * Valide un numéro camerounais.
 * Accepte les saisies avec ou sans préfixe, espaces, tirets.
 * Format attendu final : +237 6XX XX XX XX (9 chiffres après +237).
 */
export function validatePhoneCM(raw: string): PhoneValidation {
  const cleaned = raw.replace(/[^\d+]/g, '');

  // Retirer le préfixe pays
  let local = cleaned;
  if (local.startsWith('+237')) local = local.slice(4);
  else if (local.startsWith('237')) local = local.slice(3);
  else if (local.startsWith('00237')) local = local.slice(5);

  if (local.length === 0) {
    return { valid: false, formatted: '', e164: '', error: 'Numéro requis' };
  }

  if (!CM_VALID_PREFIXES.includes(local[0]!)) {
    return {
      valid: false,
      formatted: raw,
      e164: '',
      error: 'Le numéro doit commencer par 6 (mobile) ou 2 (fixe)',
    };
  }

  if (local.length !== 9) {
    return {
      valid: false,
      formatted: raw,
      e164: '',
      error: `Le numéro doit faire exactement 9 chiffres (actuellement ${local.length})`,
    };
  }

  if (!/^\d{9}$/.test(local)) {
    return { valid: false, formatted: raw, e164: '', error: 'Caractères non autorisés' };
  }

  // Operator detection (approximatif — basé sur les préfixes communs CM)
  const prefix3 = local.slice(0, 3);
  const prefix2 = local.slice(0, 2);
  let operator: PhoneValidation['operator'] = 'Inconnu';
  if (['67', '68', '650', '651', '652', '653', '654'].some((p) => prefix3.startsWith(p) || prefix2 === p)) {
    operator = 'MTN';
  } else if (['69', '655', '656', '657', '658', '659'].some((p) => prefix3.startsWith(p) || prefix2 === p)) {
    operator = 'Orange';
  } else if (local.startsWith('2')) {
    operator = 'Camtel';
  }

  // Formattage : +237 6XX XX XX XX
  const formatted = `${CM_DIAL_CODE} ${local.slice(0, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7, 9)}`;
  const e164 = `${CM_DIAL_CODE}${local}`;

  return { valid: true, formatted, e164, operator };
}

/** Formatte au fil de la saisie : transforme "691234567" en "691 23 45 67". */
export function formatPhoneCMLive(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

/* ===================================================================
   MOT DE PASSE — Force + critères
   =================================================================== */

export type PasswordStrength = 'tres-faible' | 'faible' | 'moyen' | 'fort' | 'tres-fort';

export interface PasswordCheck {
  /** Booléens individuels par critère. */
  rules: {
    minLength: boolean;       // >= 12
    hasUpper: boolean;
    hasLower: boolean;
    hasDigit: boolean;
    hasSymbol: boolean;
    notCommon: boolean;       // pas dans la blacklist
  };
  /** Score 0..5. */
  score: number;
  strength: PasswordStrength;
  /** Message global. */
  message: string;
  /** Le mot de passe satisfait-il aux exigences minimales SideBySide ? */
  valid: boolean;
}

const COMMON_PASSWORDS = new Set([
  '123456789012', 'password1234', 'azertyuiop12', 'qwertyuiop12',
  'sidebyside01', 'douala123456', 'cameroun2026',
]);

/** Exigences minimales SideBySide. */
export const PWD_MIN_LENGTH = 12;

export function checkPassword(pwd: string): PasswordCheck {
  const rules = {
    minLength: pwd.length >= PWD_MIN_LENGTH,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasDigit: /\d/.test(pwd),
    hasSymbol: /[^A-Za-z0-9]/.test(pwd),
    notCommon: pwd.length > 0 && !COMMON_PASSWORDS.has(pwd.toLowerCase()),
  };

  const passedCount = Object.values(rules).filter(Boolean).length;

  // Score : 1 par règle satisfaite, bonus pour longueur > 16
  let score = passedCount;
  if (pwd.length >= 16) score = Math.min(score + 1, 5);
  score = Math.min(score, 5);

  let strength: PasswordStrength;
  let message: string;
  if (pwd.length === 0) { strength = 'tres-faible'; message = ''; }
  else if (score <= 1) { strength = 'tres-faible'; message = 'Mot de passe très faible'; }
  else if (score === 2) { strength = 'faible'; message = 'Mot de passe faible'; }
  else if (score === 3) { strength = 'moyen'; message = 'Mot de passe moyen'; }
  else if (score === 4) { strength = 'fort'; message = 'Mot de passe fort'; }
  else { strength = 'tres-fort'; message = 'Excellent mot de passe'; }

  // Validation : toutes les règles doivent passer
  const valid = Object.values(rules).every(Boolean);

  return { rules, score, strength, message, valid };
}

/* ===================================================================
   OTP — Code à 6 chiffres avec expiration
   =================================================================== */

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_SECONDS = 5 * 60;       // 5 minutes
export const OTP_MAX_ATTEMPTS = 3;
export const OTP_COOLDOWN_SECONDS = 60;         // pour renvoyer un nouveau code

export interface OtpState {
  code: string[];           // tableau de 6 cases
  attemptsLeft: number;
  expiresAt: number;        // timestamp ms
  resendAt: number;         // timestamp ms à partir duquel on peut renvoyer
}

export function createOtpState(): OtpState {
  return {
    code: Array(OTP_LENGTH).fill(''),
    attemptsLeft: OTP_MAX_ATTEMPTS,
    expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
    resendAt: Date.now() + OTP_COOLDOWN_SECONDS * 1000,
  };
}

export function isOtpComplete(otp: OtpState): boolean {
  return otp.code.every((d) => d.length === 1);
}

export function isOtpExpired(otp: OtpState): boolean {
  return Date.now() > otp.expiresAt;
}

/* ===================================================================
   TRUST SCORE — Niveau de confiance utilisateur
   =================================================================== */

export type TrustLevel = 'basic' | 'verified' | 'premium';

export interface TrustProfile {
  level: TrustLevel;
  phoneVerified: boolean;
  identityVerified: boolean;   // CNI uploadée et validée
  selfieMatched: boolean;      // selfie matché à la CNI
  licenseVerified?: boolean;   // permis de conduire (chauffeurs)
  vehicleVerified?: boolean;   // carte grise + photos véhicule
  tripsCompleted: number;
  noIncidents: boolean;
}

const TRUST_LABELS: Record<TrustLevel, { label: string; description: string }> = {
  basic: {
    label: 'Basique',
    description: 'Téléphone vérifié uniquement',
  },
  verified: {
    label: 'Vérifié',
    description: 'CNI + selfie + téléphone validés par SideBySide',
  },
  premium: {
    label: 'Premium',
    description: 'Vérifié + 20 trajets sans incident + permis (si chauffeur)',
  },
};

export function getTrustLabel(level: TrustLevel) {
  return TRUST_LABELS[level];
}

export function computeTrustLevel(profile: TrustProfile, role: 'passenger' | 'driver'): TrustLevel {
  if (!profile.phoneVerified) return 'basic';
  if (!profile.identityVerified || !profile.selfieMatched) return 'basic';

  const baseVerified = profile.phoneVerified && profile.identityVerified && profile.selfieMatched;

  if (role === 'driver') {
    if (!profile.licenseVerified || !profile.vehicleVerified) return 'verified';
    if (baseVerified && profile.tripsCompleted >= 20 && profile.noIncidents) return 'premium';
    return 'verified';
  }

  // Passenger
  if (baseVerified && profile.tripsCompleted >= 20 && profile.noIncidents) return 'premium';
  return 'verified';
}
