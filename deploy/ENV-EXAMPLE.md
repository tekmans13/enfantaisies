# Exemple de fichier .env

Ce fichier montre la structure du fichier `.env` généré lors de l'installation.

## Localisation

Le fichier `.env` se trouve à : `/home/appuser/enfantaisies/.env`

## Structure du fichier

```bash
# Configuration Lovable Cloud / Supabase (Frontend)
# Ces variables sont préfixées par VITE_ pour être accessibles dans React/Vite
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=xxxxxxxxxxxxx

# Configuration Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Configuration de l'application
NODE_ENV=production
PORT=3000
```

## Description des variables

### Backend (Lovable Cloud / Supabase)

#### `VITE_SUPABASE_URL`
- **Description :** URL de votre projet backend
- **Format :** `https://[project-id].supabase.co`
- **Où trouver :**
  - Lovable Cloud : Project Settings > Backend
  - Supabase : Settings > API > Project URL
- **Public :** ✅ Oui (préfixe VITE_)

#### `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Description :** Clé publique (anon key) pour l'accès frontend
- **Format :** Token JWT commençant par `eyJ...`
- **Où trouver :**
  - Lovable Cloud : Project Settings > Backend
  - Supabase : Settings > API > anon/public key
- **Public :** ✅ Oui (préfixe VITE_)

#### `VITE_SUPABASE_PROJECT_ID`
- **Description :** Identifiant unique du projet
- **Format :** Chaîne alphanumérique
- **Où trouver :**
  - Lovable Cloud : Project Settings > Backend
  - Supabase : Settings > General > Reference ID
- **Public :** ✅ Oui (préfixe VITE_)

### Stripe

#### `VITE_STRIPE_PUBLISHABLE_KEY`
- **Description :** Clé publique Stripe pour le frontend
- **Format :** `pk_test_...` (test) ou `pk_live_...` (production)
- **Où trouver :** Stripe Dashboard > Developers > API keys > Publishable key
- **Public :** ✅ Oui (préfixe VITE_)
- **⚠️ Important :** Utilisez `pk_test_` pendant le développement

### Application

#### `NODE_ENV`
- **Description :** Environnement d'exécution
- **Valeur :** `production`
- **Public :** ❌ Non (backend seulement)

#### `PORT`
- **Description :** Port sur lequel l'application écoute
- **Valeur :** `3000` (par défaut)
- **Public :** ❌ Non (backend seulement)

## Variables NON présentes dans .env

Ces variables sont configurées comme **secrets** dans le backend (Lovable Cloud / Supabase) et ne doivent JAMAIS être dans le .env frontend :

### `STRIPE_SECRET_KEY`
- **Description :** Clé secrète Stripe (PRIVÉE)
- **Format :** `sk_test_...` ou `sk_live_...`
- **Où configurer :**
  - Lovable Cloud : Project Settings > Secrets
  - Supabase : `supabase secrets set STRIPE_SECRET_KEY=sk_xxx`
- **⚠️ CRITIQUE :** Ne JAMAIS exposer cette clé

### `SUPABASE_SERVICE_ROLE_KEY`
- **Description :** Clé de service avec tous les privilèges (PRIVÉE)
- **Format :** Token JWT très long
- **Où configurer :**
  - Lovable Cloud : Project Settings > Secrets
  - Supabase : `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx`
- **⚠️ CRITIQUE :** Ne JAMAIS exposer cette clé

### `STRIPE_WEBHOOK_SECRET`
- **Description :** Secret pour valider les webhooks Stripe
- **Format :** `whsec_...`
- **Où configurer :**
  - Lovable Cloud : Project Settings > Secrets
  - Supabase : `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx`
- **Obtention :** Stripe Dashboard > Developers > Webhooks > [votre endpoint] > Signing secret

## Modification du .env

### Éditer le fichier

```bash
sudo nano /home/appuser/enfantaisies/.env
```

### Après modification

```bash
# Redémarrer l'application
sudo -u appuser pm2 restart enfantaisies
```

## Sécurité

### Permissions

Le fichier `.env` doit avoir les permissions `600` (lecture/écriture propriétaire seulement) :

```bash
chmod 600 /home/appuser/enfantaisies/.env
chown appuser:appuser /home/appuser/enfantaisies/.env
```

### Vérification

```bash
ls -la /home/appuser/enfantaisies/.env
# Résultat attendu : -rw------- 1 appuser appuser
```

## Différence Test / Production

### Mode Test (Développement)

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx

# Secrets backend
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxx
```

### Mode Production

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxx

# Secrets backend
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx
```

⚠️ **Important :** 
- Ne passez en production qu'après avoir testé en profondeur
- Recréez le webhook Stripe avec les clés de production
- Mettez à jour tous les secrets backend en même temps

## Sauvegarde

```bash
# Créer une sauvegarde du .env
sudo cp /home/appuser/enfantaisies/.env /root/backup/.env.backup-$(date +%Y%m%d)
```

## Restauration

```bash
# Restaurer depuis une sauvegarde
sudo cp /root/backup/.env.backup-20250101 /home/appuser/enfantaisies/.env
sudo chown appuser:appuser /home/appuser/enfantaisies/.env
sudo chmod 600 /home/appuser/enfantaisies/.env
sudo -u appuser pm2 restart enfantaisies
```
