# Guide de déploiement ENFANTAISIES

Ce guide vous explique comment déployer l'application ENFANTAISIES sur un serveur Debian/Ubuntu.

## Prérequis

- Un serveur Debian 11/12 ou Ubuntu 20.04/22.04
- Accès root au serveur
- Un nom de domaine pointant vers votre serveur
- Un compte Supabase avec votre projet configuré
- Un compte Stripe avec vos clés API
- Un compte Resend pour l'envoi d'emails

## Informations à préparer avant l'installation

### 1. Configuration Supabase

Connectez-vous à votre projet Supabase et récupérez :

- **URL Supabase** : Dans Settings > API > Project URL
  - Format : `https://xxxxx.supabase.co`
- **Anon Key** : Dans Settings > API > Project API keys > anon/public
- **Service Role Key** : Dans Settings > API > Project API keys > service_role (⚠️ À garder secret)
- **Project ID** : Dans Settings > General > Reference ID

### 2. Configuration Stripe

Depuis votre tableau de bord Stripe :

- **Secret Key** : Developers > API keys > Secret key
  - Mode test : `sk_test_xxxxx`
  - Mode production : `sk_live_xxxxx`

### 3. Configuration Resend

Depuis votre compte Resend :

- **API Key** : API Keys > Create API Key
  - Format : `re_xxxxx`

⚠️ **Important** : N'oubliez pas de vérifier votre domaine d'envoi dans Resend

### 4. Configuration Git

- **Repository URL** : L'URL de votre repository GitHub
  - Format : `https://github.com/username/repo.git`
  - Ou connectez votre projet à GitHub via Lovable

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
4. **URL Supabase**
5. **Clé anonyme Supabase**
6. **Clé Service Role Supabase**
7. **ID du projet Supabase**
8. **Clé secrète Stripe**
9. **Clé API Resend**
10. **URL du repository Git**

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

### Étape 5 : Configuration Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **Authentication > URL Configuration**
3. Configurez :
   - **Site URL** : `https://votre-domaine.fr`
   - **Redirect URLs** : `https://votre-domaine.fr/**`

### Étape 6 : Configuration Stripe (si applicable)

1. Dans votre tableau de bord Stripe
2. Allez dans **Developers > Webhooks**
3. Ajoutez un endpoint : `https://votre-domaine.fr/api/stripe-webhook`
4. Sélectionnez les événements nécessaires

## Ce que le script installe

- ✅ Node.js 20.x
- ✅ Git
- ✅ Nginx (serveur web)
- ✅ Certbot (certificats SSL)
- ✅ PM2 (gestionnaire de processus)
- ✅ Configuration automatique du pare-feu
- ✅ Certificat SSL Let's Encrypt
- ✅ Build et déploiement de l'application

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

### Problèmes de connexion Supabase

1. Vérifiez que les clés dans `/home/appuser/enfantaisies/.env` sont correctes
2. Vérifiez que les URLs de redirection sont configurées dans Supabase
3. Vérifiez que le projet Supabase est actif

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
