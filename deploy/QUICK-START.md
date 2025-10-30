# Guide de démarrage rapide - ENFANTAISIES

Ce guide résume les étapes essentielles pour déployer rapidement votre application.

## Résumé en 5 étapes

### 1️⃣ Préparer les informations

Rassemblez :
- ✅ Domaine configuré (DNS pointant vers votre serveur)
- ✅ URL Lovable Cloud/Supabase + clés (Anon Key, Service Role Key, Project ID)
- ✅ Clés Stripe (Publishable Key et Secret Key)
- ✅ URL de votre repository GitHub

### 2️⃣ Lancer l'installation

```bash
ssh root@votre-serveur.com
mkdir -p /tmp/deploy && cd /tmp/deploy
curl -O https://raw.githubusercontent.com/votre-repo/main/deploy/install.sh
chmod +x install.sh
./install.sh
```

Répondez aux questions du script avec les informations préparées.

### 3️⃣ Configurer le backend

**Lovable Cloud :**
- Project Settings > Backend > Authentication
- Ajoutez Site URL : `https://votre-domaine.fr`
- Ajoutez Redirect URL : `https://votre-domaine.fr/**`
- Project Settings > Secrets : Ajoutez `STRIPE_SECRET_KEY` et `SUPABASE_SERVICE_ROLE_KEY`

**Supabase externe :**
- Authentication > URL Configuration (même URLs)
- Déployez les Edge Functions (voir POST-INSTALL.md)
- Configurez les secrets

### 4️⃣ Configurer Stripe

1. Dashboard Stripe > Developers > Webhooks > Add endpoint
2. URL : `https://[projet].supabase.co/functions/v1/stripe-webhook`
3. Events : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copiez le Signing secret
5. Ajoutez `STRIPE_WEBHOOK_SECRET` dans les secrets backend

### 5️⃣ Configuration initiale

1. **Créer un admin :** Inscrivez-vous sur `/auth`, puis ajoutez le rôle `admin` dans `user_roles`
2. **Configurer SMTP :** Dans Configuration, remplissez les infos SMTP
3. **Créer les tarifs :** Via "Gérer les tarifs"
4. **Créer les séjours :** Via "Nouveau séjour"
5. **Personnaliser :** Via "Page Accueil"

## Vérification rapide

✅ Site accessible en HTTPS  
✅ Inscription test réussie  
✅ Email de confirmation reçu  
✅ Connexion admin fonctionnelle  
✅ Paiement test réussi  

## Commandes essentielles

```bash
# Voir les logs
sudo -u appuser pm2 logs enfantaisies

# Redémarrer l'app
sudo -u appuser pm2 restart enfantaisies

# Mettre à jour
cd /home/appuser/enfantaisies
sudo -u appuser git pull
sudo -u appuser npm install
sudo -u appuser npm run build
sudo -u appuser pm2 restart enfantaisies
```

## Dépannage rapide

**Site inaccessible :**
```bash
sudo -u appuser pm2 status
systemctl status nginx
```

**Erreur backend :**
- Vérifiez les URLs dans Lovable/Supabase
- Vérifiez `/home/appuser/enfantaisies/.env`
- Vérifiez les secrets configurés

**Emails non reçus :**
- Vérifiez la config SMTP dans l'admin
- Vérifiez les logs : `sudo -u appuser pm2 logs`

**Paiement ne fonctionne pas :**
- Vérifiez les clés Stripe dans `.env` et secrets
- Vérifiez le webhook Stripe
- Vérifiez `STRIPE_WEBHOOK_SECRET`

## Documentation complète

- **Installation détaillée :** `deploy/README.md`
- **Configuration post-installation :** `deploy/POST-INSTALL.md`
- **Checklist complète :** `deploy/DEPLOYMENT-CHECKLIST.md`
- **Architecture :** `ARCHITECTURE.md`

## Support

En cas de blocage :
1. Consultez les logs : `pm2 logs`
2. Vérifiez le statut : `pm2 status` et `systemctl status nginx`
3. Consultez la documentation complète
4. Vérifiez la checklist de déploiement
