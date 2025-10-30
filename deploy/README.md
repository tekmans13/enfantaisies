# Guide de déploiement ENFANTAISIES

Ce guide vous explique comment déployer l'application ENFANTAISIES sur un serveur Debian 13.

## Architecture de l'application

L'application ENFANTAISIES est une application web React/Vite qui utilise plusieurs services externes :

- **Frontend** : Application React servie par Nginx
- **Backend** : Lovable Cloud (Supabase) pour la base de données, authentification, storage et edge functions
- **Paiements** : Stripe pour la gestion des paiements
- **Emails** : SMTP configurable pour l'envoi d'emails (configuration stockée en base)

## Prérequis

- Un serveur Debian 13 avec au moins 2 Go de RAM
- Accès root au serveur
- Un nom de domaine pointant vers votre serveur
- Accès au projet Lovable Cloud (ou projet Supabase externe)
- Un compte Stripe avec vos clés API (pour les paiements)

## Informations à préparer avant l'installation

### 1. Configuration Lovable Cloud / Supabase

#### Si vous utilisez Lovable Cloud :
Lovable Cloud est déjà configuré automatiquement. Vous devez récupérer les clés depuis Lovable :
- Dans Lovable, allez dans **Project Settings > Backend**
- Copiez les informations suivantes :
  - **URL** : Format `https://xxxxx.supabase.co`
  - **Anon Key** : Clé publique
  - **Service Role Key** : ⚠️ Clé secrète à ne jamais exposer
  - **Project ID** : Identifiant du projet

#### Si vous utilisez Supabase externe :
Connectez-vous à votre projet Supabase et récupérez :
- **URL Supabase** : Dans Settings > API > Project URL
- **Anon Key** : Dans Settings > API > Project API keys > anon/public
- **Service Role Key** : Dans Settings > API > Project API keys > service_role
- **Project ID** : Dans Settings > General > Reference ID

### 2. Configuration Stripe

Depuis votre tableau de bord Stripe (https://dashboard.stripe.com) :

- **Publishable Key** : Developers > API keys > Publishable key
  - Mode test : `pk_test_xxxxx`
  - Mode production : `pk_live_xxxxx`
- **Secret Key** : Developers > API keys > Secret key
  - Mode test : `sk_test_xxxxx`
  - Mode production : `sk_live_xxxxx`

⚠️ **Important** : Utilisez les clés de test pendant le développement et les clés de production uniquement pour le déploiement final.

### 3. Configuration SMTP (Optionnel - peut être fait après installation)

L'application permet de configurer SMTP depuis l'interface d'administration après installation. Préparez :
- **Hôte SMTP** : ex. `smtp.gmail.com`, `smtp.office365.com`
- **Port** : généralement 587 (TLS) ou 465 (SSL)
- **Username** : votre adresse email
- **Mot de passe** : mot de passe d'application
- **Email expéditeur** : l'adresse qui apparaîtra comme expéditeur

### 4. Configuration Git

- **Repository URL** : L'URL de votre repository GitHub
  - Format : `https://github.com/username/repo.git`
  - Ou connectez votre projet à GitHub via Lovable (Settings > GitHub)

## Installation

### Étape 1 : Connexion au serveur

```bash
ssh root@votre-serveur.com
```

### Étape 2 : Téléchargement du script

```bash
# Créer un dossier temporaire
mkdir -p /tmp/deploy
cd /tmp/deploy

# Télécharger le script (remplacez par l'URL de votre repo)
curl -O https://raw.githubusercontent.com/votre-repo/main/deploy/install.sh

# Rendre le script exécutable
chmod +x install.sh
```

### Étape 3 : Lancement de l'installation

```bash
./install.sh
```

Le script vous posera les questions suivantes :

1. **Nom de domaine** : ex. `enfantaisies.fr`
2. **Email pour Let's Encrypt** : pour les notifications SSL
3. **Port de l'application** : par défaut 3000
4. **URL Lovable Cloud/Supabase** : `https://xxxxx.supabase.co`
5. **Clé anonyme (Anon Key)** : Clé publique
6. **Clé Service Role** : ⚠️ Clé privée (ne sera jamais affichée)
7. **ID du projet** : Identifiant du projet
8. **Clé publique Stripe** : `pk_test_xxx` ou `pk_live_xxx`
9. **Clé secrète Stripe** : `sk_test_xxx` ou `sk_live_xxx`
10. **URL du repository Git** : `https://github.com/...`

⚠️ **Sécurité** : Les clés secrètes (Service Role, Stripe Secret) ne seront jamais affichées à l'écran lors de la saisie.

### Étape 4 : Configuration DNS

Assurez-vous que votre domaine pointe vers votre serveur :

```
Type: A
Name: @
Value: [IP de votre serveur]

Type: A
Name: www
Value: [IP de votre serveur]
```

### Étape 5 : Configuration Lovable Cloud / Supabase

#### Configuration de l'authentification :

**Si vous utilisez Lovable Cloud :**
1. Dans Lovable, allez dans **Project Settings > Backend > Authentication**
2. Configurez les URL autorisées :
   - **Site URL** : `https://votre-domaine.fr`
   - **Redirect URLs** : Ajoutez `https://votre-domaine.fr/**`

**Si vous utilisez Supabase externe :**
1. Connectez-vous à votre projet Supabase
2. Allez dans **Authentication > URL Configuration**
3. Configurez :
   - **Site URL** : `https://votre-domaine.fr`
   - **Redirect URLs** : `https://votre-domaine.fr/**`

#### Configuration des Edge Functions :

Les Edge Functions suivantes doivent être déployées :
- `send-inscription-email` : Envoi des emails de confirmation d'inscription
- `create-stripe-payment-link` : Création des liens de paiement Stripe
- `stripe-webhook` : Gestion des webhooks Stripe
- `admin-create-user` : Création d'utilisateurs admin
- `admin-delete-user` : Suppression d'utilisateurs
- `admin-reset-password` : Réinitialisation de mot de passe
- `get-users-list` : Récupération de la liste des utilisateurs

**Avec Lovable Cloud :**
Les Edge Functions sont automatiquement déployées. Aucune action manuelle requise.

**Avec Supabase externe :**
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à votre projet
supabase login
supabase link --project-ref votre-project-id

# Déployer les Edge Functions
cd /home/appuser/enfantaisies
supabase functions deploy send-inscription-email
supabase functions deploy create-stripe-payment-link
supabase functions deploy stripe-webhook
supabase functions deploy admin-create-user
supabase functions deploy admin-delete-user
supabase functions deploy admin-reset-password
supabase functions deploy get-users-list
```

### Étape 6 : Configuration des secrets pour Edge Functions

Les Edge Functions nécessitent des secrets configurés :

**Avec Lovable Cloud :**
Les secrets sont automatiquement synchronisés. Vérifiez dans Lovable que les secrets suivants sont configurés :
- `STRIPE_SECRET_KEY` : Votre clé secrète Stripe
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role
- Autres secrets pour SMTP si configurés

**Avec Supabase externe :**
```bash
# Configurer les secrets pour les Edge Functions
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Étape 7 : Configuration Stripe

1. Dans votre tableau de bord Stripe (https://dashboard.stripe.com)
2. Allez dans **Developers > Webhooks**
3. Cliquez sur **Add endpoint**
4. Configurez :
   - **Endpoint URL** : `https://votre-domaine-supabase.functions.supabase.co/stripe-webhook`
   - **Events to send** : Sélectionnez :
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
5. Copiez le **Signing secret** (commence par `whsec_`)
6. Configurez ce secret :
   - **Lovable Cloud** : Dans Project Settings > Secrets, ajoutez `STRIPE_WEBHOOK_SECRET`
   - **Supabase externe** : `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### Étape 8 : Configuration SMTP (Administration)

La configuration SMTP se fait depuis l'interface d'administration après installation :

1. Connectez-vous avec un compte admin : `https://votre-domaine.fr/auth`
2. Allez dans **Configuration** (bouton dans le tableau de bord Bureau)
3. Remplissez les informations SMTP :
   - Hôte SMTP
   - Port (587 pour TLS, 465 pour SSL)
   - Username (adresse email)
   - Mot de passe
   - Email expéditeur
   - Activez/désactivez TLS selon votre fournisseur

**Exemples de configuration par fournisseur :**

**Gmail :**
- Hôte : `smtp.gmail.com`
- Port : `587`
- TLS : Activé
- ⚠️ Créez un "mot de passe d'application" depuis votre compte Google

**Office 365 / Outlook :**
- Hôte : `smtp.office365.com`
- Port : `587`
- TLS : Activé

**OVH :**
- Hôte : `ssl0.ovh.net`
- Port : `587`
- TLS : Activé

## Ce que le script installe

- ✅ Node.js 20.x LTS
- ✅ Git pour la gestion du code source
- ✅ Nginx (serveur web reverse proxy)
- ✅ Certbot (certificats SSL Let's Encrypt)
- ✅ PM2 (gestionnaire de processus Node.js)
- ✅ Configuration automatique du pare-feu UFW
- ✅ Certificat SSL Let's Encrypt (HTTPS)
- ✅ Build et déploiement de l'application React/Vite
- ✅ Configuration des variables d'environnement sécurisées

## Commandes utiles après installation

### Gestion de l'application

```bash
# Voir les logs en temps réel
sudo -u appuser pm2 logs enfantaisies

# Arrêter l'application
sudo -u appuser pm2 stop enfantaisies

# Redémarrer l'application
sudo -u appuser pm2 restart enfantaisies

# Voir le statut
sudo -u appuser pm2 status
```

### Mise à jour de l'application

```bash
cd /home/appuser/enfantaisies
sudo -u appuser git pull
sudo -u appuser npm install
sudo -u appuser npm run build
sudo -u appuser pm2 restart enfantaisies
```

### Gestion de Nginx

```bash
# Redémarrer Nginx
systemctl restart nginx

# Voir le statut
systemctl status nginx

# Tester la configuration
nginx -t

# Voir les logs
tail -f /var/log/nginx/error.log
```

### Renouvellement SSL

Let's Encrypt renouvelle automatiquement les certificats, mais vous pouvez forcer le renouvellement :

```bash
certbot renew --dry-run  # Test
certbot renew             # Renouvellement réel
```

## Sauvegarde

### Fichiers importants à sauvegarder

```bash
# Variables d'environnement
/home/appuser/enfantaisies/.env

# Configuration Nginx
/etc/nginx/sites-available/votre-domaine.fr

# Configuration PM2
/home/appuser/enfantaisies/ecosystem.config.js
```

### Script de sauvegarde automatique

Créez un script `/root/backup.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Sauvegarde de la configuration
cp /home/appuser/enfantaisies/.env $BACKUP_DIR/
cp /etc/nginx/sites-available/* $BACKUP_DIR/

# Compression
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

# Garder seulement les 7 derniers jours
find /backups -name "*.tar.gz" -mtime +7 -delete
```

Ajoutez au cron :

```bash
crontab -e
# Ajouter : 0 2 * * * /root/backup.sh
```

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs
sudo -u appuser pm2 logs enfantaisies

# Vérifier que le port est libre
netstat -tlnp | grep 3000

# Redémarrer
sudo -u appuser pm2 restart enfantaisies
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que l'application tourne
sudo -u appuser pm2 status

# Vérifier les logs Nginx
tail -f /var/log/nginx/error.log

# Redémarrer Nginx
systemctl restart nginx
```

### Problèmes SSL

```bash
# Vérifier les certificats
certbot certificates

# Renouveler manuellement
certbot renew --force-renewal
```

### Problèmes de connexion Backend (Lovable Cloud / Supabase)

```bash
# Vérifier les variables d'environnement
cat /home/appuser/enfantaisies/.env

# Vérifier que les clés sont correctes
# Les variables doivent commencer par VITE_ pour être accessibles dans le frontend
```

**Actions à vérifier :**
1. Les clés dans `.env` sont correctes et à jour
2. Les URLs de redirection sont configurées dans Lovable Cloud / Supabase
3. Le projet backend est actif et accessible
4. Les Edge Functions sont déployées
5. Les secrets des Edge Functions sont configurés

### Problèmes avec les Edge Functions

```bash
# Vérifier les logs des Edge Functions (Lovable Cloud)
# Connectez-vous à Lovable > Project Settings > Backend > Functions

# Vérifier les logs (Supabase externe)
supabase functions logs send-inscription-email
supabase functions logs create-stripe-payment-link
```

### Problèmes d'envoi d'email

1. Vérifiez la configuration SMTP dans l'interface admin
2. Testez avec un service SMTP connu (Gmail, Office365)
3. Vérifiez les logs de l'Edge Function `send-inscription-email`
4. Pour Gmail, assurez-vous d'utiliser un mot de passe d'application

### Problèmes de paiement Stripe

1. Vérifiez que les clés Stripe sont correctes (test vs production)
2. Vérifiez que le webhook Stripe est configuré
3. Vérifiez que `STRIPE_SECRET_KEY` est configuré dans les secrets
4. Vérifiez les logs de l'Edge Function `create-stripe-payment-link`

## Sécurité

### Bonnes pratiques

1. ✅ Mettez à jour régulièrement le système : `apt update && apt upgrade`
2. ✅ Utilisez des clés SSH au lieu de mots de passe
3. ✅ Configurez fail2ban pour protéger SSH
4. ✅ Activez le pare-feu (UFW est configuré par le script)
5. ✅ Sauvegardez régulièrement
6. ✅ Surveillez les logs

### Installation de fail2ban

```bash
apt install fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

## Support

En cas de problème :

1. Vérifiez les logs de l'application : `sudo -u appuser pm2 logs`
2. Vérifiez les logs Nginx : `tail -f /var/log/nginx/error.log`
3. Vérifiez que tous les services tournent :
   - `sudo -u appuser pm2 status`
   - `systemctl status nginx`

## Monitoring

### Installation d'outils de monitoring (optionnel)

```bash
# Installation de htop pour surveiller les ressources
apt install htop

# Installation de netdata pour un dashboard complet
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

Accédez ensuite à `http://votre-serveur:19999` pour voir le dashboard.
