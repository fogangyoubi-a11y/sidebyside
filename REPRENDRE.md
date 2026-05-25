# 🚗 Reprendre le projet SideBySide

Plateforme de covoiturage interurbain au Cameroun — axe Douala–Bafoussam.

## 🚀 Relancer le projet en 1 minute

```bash
cd C:\Users\hp\Desktop\sidebyside

# 1. Démarrer le serveur de développement
npm run dev
```

L'app s'ouvre sur **http://localhost:5173/** avec hot-reload activé.

> ⚠️ Si vous obtenez une erreur, lancez d'abord `npm install`.

## 📂 Où sont les choses

| Dossier | Contenu |
|---|---|
| `src/screens/` | 4 écrans : Landing, Search, Onboarding, ComingSoon |
| `src/components/ui/` | UI : Button, Badge, SbsLogo, Avatar, Input |
| `src/lib/` | Logique métier (types, search, utils) |
| `src/data/` | cities.ts (8 villes CM), trips.ts (6 trajets mock) |
| `public/img/` | Logo SideBySide (sièges bleu + jaune) |
| `SIDEBYSIDE_Cahier_des_Charges.docx` | Cahier des charges complet |

## 🎨 Identité visuelle

- **Bleu navy** `#1E3A8A` — primary (siège conducteur)
- **Jaune doré** `#FCD116` — accent (siège passager, drapeau CM)
- **Manrope** (titres) + **Inter** (texte)
- Logo : 2 sièges auto SVG vectoriel dans `SbsLogo.tsx`

## ✅ Ce qui est fait (MVP visuel)

- 🏠 **Landing page** complète : Hero + mockup app + 4 sections (How it works, Routes, Driver CTA avec calculatrice, Testimonials, Footer)
- 🔐 **Onboarding 4 étapes** : choix rôle (Passager/Chauffeur) → identité → OTP SMS → bienvenue
- 🔍 **Recherche de trajets** : sélecteurs villes (8 villes CM), filtres avancés (prix max, note min, options), résultats avec timeline + chauffeur + options
- 📱 **Responsive** : mobile-first, breakpoints `sm/md/lg`
- 🎨 **Design tokens** : palette bleu+jaune cohérente, ombres, radius, animations
- 📊 **Mock data** : 5 chauffeurs vérifiés + 6 trajets Douala↔Bafoussam

## 🚧 Reste à faire (par ordre de priorité cahier)

| Tâche | Priorité | Effort |
|---|---|---|
| 📄 Écran détail trajet (profil chauffeur, options, points RDV map) | 🔴 MVP | 1 j |
| 💳 Modal paiement Mobile Money (MTN + Orange + carte + portefeuille) | 🔴 MVP | 2 j |
| 🎫 Billet de réservation + confirmation | 🔴 MVP | 1/2 j |
| 🚙 Écran "Publier un trajet" (form chauffeur) | 🔴 MVP | 1 j |
| 👤 Écran profil (vérif CNI, historique, stats) | 🟡 Important | 1-2 j |
| 💬 Messagerie chauffeur ↔ passager (numéros masqués) | 🟡 Important | 2-3 j |
| ⭐ Système notation + avis après trajet | 🟡 Important | 1 j |
| 📊 Back-office admin (utilisateurs, trajets, litiges) | 🟢 Phase 3 | 2-3 j |
| 🔧 Backend Node.js + Express + Postgres + JWT | 🔴 Bloqueur prod | 8-15 j |
| 💸 Intégration CinetPay / Campay (paiement réel) | 🔴 Bloqueur prod | 3-5 j |
| 📲 React Native (iOS+Android) | 🟢 Phase 2 | 3-4 sem |

## 🔑 Comptes / clés à créer avant la prod

- **CinetPay ou Campay** : agrégateur Mobile Money pour MTN MoMo + Orange Money Cameroun
- **Twilio ou Africa's Talking** : SMS / OTP avec couverture CM
- **Google Maps Platform** : itinéraires + autocomplete villes + carte
- **AWS ou DigitalOcean** : hébergement (Frankfurt latency-friendly pour CM)
- **Supabase ou Neon** : Postgres managé
- **Domaine** : `sidebyside.cm` ou `.app`
- **Compte Apple Developer** ($99/an) + **Google Play Console** ($25 one-shot) pour la phase mobile

## 📚 Documents de référence

- [SIDEBYSIDE_Cahier_des_Charges.docx](SIDEBYSIDE_Cahier_des_Charges.docx) — Cahier des charges fonctionnel complet
- [cahier.txt](cahier.txt) — Version texte du cahier (lisible par grep)

## 🆘 En cas de problème au redémarrage

```bash
# Si npm install échoue
rm -rf node_modules package-lock.json
npm install

# Si Vite refuse de démarrer (port 5173 occupé)
# Sur Windows :
taskkill /F /IM node.exe

# Vérifier que TS compile sans erreur
npx tsc --noEmit

# Build de production
npm run build
```

---

**Auteur** : Fogang Youbi Brice Arnold — Bruxelles, Belgique
**Dernière mise à jour** : 2026-05-25 — MVP visuel (3 écrans + landing). Backend à venir.
