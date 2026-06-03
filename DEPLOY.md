# 🚀 Déployer SideBySide en URL publique — étape par étape

Cette procédure vous donne 2 URLs publiques (front + back) en ~30 min :

- Front : `https://sidebyside-XXX.vercel.app`
- API   : `https://sidebyside-api-XXX.up.railway.app`
- DB    : Neon (déjà en place)

**Coût total** : 0 € pour démarrer. (Railway donne 5 $ de crédit/mois, Vercel et Neon ont un free tier suffisant.)

---

## Étape 1 — Comptes (5 min)

Créez ces 3 comptes (login GitHub partout) :

1. **GitHub** → https://github.com/signup (si pas déjà fait)
2. **Vercel** → https://vercel.com/signup → bouton "Continue with GitHub"
3. **Railway** → https://railway.com → bouton "Login with GitHub"

> Vous n'aurez **pas besoin** de saisir de carte bancaire pour démarrer.

---

## Étape 2 — Pousser le backend sur GitHub (3 min)

Le backend `sidebyside-api` n'a pas encore de repo distant. Sur https://github.com :

1. Click **"New repository"** (bouton vert en haut à gauche après "Repositories")
2. Repository name : `sidebyside-api`
3. Choisir **Private** (recommandé — contient des secrets en config)
4. **Ne cochez RIEN** d'autre (pas de README, pas de .gitignore, pas de license)
5. Click **"Create repository"**

GitHub vous montrera une page avec les commandes. **Copiez l'URL** affichée (ex. `https://github.com/votre-username/sidebyside-api.git`) — vous en aurez besoin à l'étape suivante.

Puis dans le terminal (votre PC) :

```bash
cd C:\Users\hp\Desktop\sidebyside-api
git remote add origin https://github.com/VOTRE-USERNAME/sidebyside-api.git
git branch -M main
git push -u origin main
```

---

## Étape 3 — Déployer le backend sur Railway (10 min)

1. https://railway.com/dashboard → click **"New Project"**
2. Choisir **"Deploy from GitHub repo"**
3. (Si demandé) Autoriser Railway à voir vos repos GitHub
4. Choisir le repo **`sidebyside-api`**
5. Railway détecte automatiquement Node.js et démarre un build

**Configurer les variables d'environnement** (très important) :

Onglet **"Variables"** → **"+ New Variable"** → ajoutez une par une :

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `LOG_LEVEL` | `info` |
| `DATABASE_URL` | (copier depuis votre `.env` local, ligne `DATABASE_URL`) |
| `JWT_ACCESS_SECRET` | générer une nouvelle (voir ci-dessous) |
| `JWT_REFRESH_SECRET` | générer une nouvelle (voir ci-dessous) |
| `JWT_ACCESS_TTL` | `15m` |
| `JWT_REFRESH_TTL` | `30d` |
| `CORS_ORIGINS` | `https://sidebyside-XXX.vercel.app` (à mettre à jour après étape 4) |
| `OTP_PROVIDER` | `mock` |
| `PAYMENT_PROVIDER` | `mock` |
| `STORAGE_PROVIDER` | `local` |
| `BCRYPT_ROUNDS` | `12` |

**Générer un secret JWT fort** — dans PowerShell :
```powershell
[Convert]::ToBase64String((1..64 | % { Get-Random -Maximum 256 }))
```
Copiez la chaîne (≥ 32 caractères) et collez-la dans Railway pour `JWT_ACCESS_SECRET`. **Refaites-le** pour `JWT_REFRESH_SECRET` (valeur DIFFÉRENTE).

**Récupérer l'URL publique** :

Onglet **"Settings"** → section **"Networking"** → click **"Generate Domain"**
→ Railway vous donne une URL `https://sidebyside-api-production-XXXX.up.railway.app`
→ **Notez-la**, vous en aurez besoin à l'étape 4.

**Vérifier que ça marche** :
Ouvrez `https://sidebyside-api-XXXX.up.railway.app/health` dans votre navigateur. Vous devriez voir `{"status":"ok",...}`.

---

## Étape 4 — Déployer le front sur Vercel (5 min)

Le front `sidebyside` est déjà sur GitHub (`fogangyoubi-a11y/sidebyside`).

Mais d'abord, il faut pousser les derniers changements depuis votre PC :
```bash
cd C:\Users\hp\Desktop\sidebyside
git add -A
git commit -m "feat: connect to live backend + many improvements"
git push
```

Puis sur Vercel :

1. https://vercel.com/new → choisir **"Import Git Repository"**
2. Sélectionner **`sidebyside`**
3. **Framework Preset** : Vite (auto-détecté ✓)
4. Avant de cliquer "Deploy", développer **"Environment Variables"** :
   - Clé : `VITE_API_URL`
   - Valeur : l'URL Railway de l'étape 3 (ex. `https://sidebyside-api-production-XXXX.up.railway.app`)
5. Click **"Deploy"**

Vercel build + déploie en ~1 min. Notez l'URL finale `https://sidebyside-XXXX.vercel.app`.

---

## Étape 5 — Mettre à jour CORS sur Railway (1 min)

Retourner sur Railway → projet sidebyside-api → onglet **Variables** :

- Modifier `CORS_ORIGINS` :
  → Remplacer la valeur par l'URL Vercel : `https://sidebyside-XXXX.vercel.app`

Railway redémarre tout seul. Attendez 30 sec.

---

## ✅ Test final

1. Ouvrir `https://sidebyside-XXXX.vercel.app` dans Chrome
2. Click **"Chercher un trajet"** → vous devriez voir le badge "Live" + 3 trajets seedés
3. Click **"S'inscrire"** → faire l'inscription complète (le code OTP dev s'affiche)
4. ⭐ **Donner cette URL à n'importe qui** — elle marche partout, 24h/24

---

## 🆘 Si quelque chose foire

| Symptôme | Cause probable | Fix |
|---|---|---|
| Front charge mais pas de trajets | CORS rejette les requêtes | Vérifier `CORS_ORIGINS` sur Railway, doit matcher exactement l'URL Vercel |
| `Failed to fetch` dans la console | `VITE_API_URL` mal configuré | Vérifier dans Vercel → Settings → Env Vars. Redéployer après changement. |
| Backend `502 Bad Gateway` | Le service Railway est down | Onglet Deployments → voir les logs. Souvent : migration Prisma a échoué (DATABASE_URL incorrect). |
| Login renvoie 401 systématiquement | Tokens JWT signés avec une clé différente | Vérifier que `JWT_ACCESS_SECRET` est bien set sur Railway et fait ≥ 32 chars |

---

**Une fois la démo publique stable**, prochaine étape (mois 1-2) :
- Acheter un domaine (`sidebyside.app` ou `.cm`) → pointer Vercel + Railway dessus (3 clics chacun)
- Brancher Twilio ou Africa's Talking pour les vrais SMS OTP
- Créer l'entreprise camerounaise + onboarder Campay/CinetPay pour les paiements réels
