# Checklist de déploiement ENFANTAISIES

Utilisez cette checklist pour vous assurer que tous les éléments sont configurés correctement.

## Avant le déploiement

### Préparation des services externes

- [ ] **Lovable Cloud / Supabase**
  - [ ] Projet créé et accessible
  - [ ] URL du projet notée
  - [ ] Anon Key copiée
  - [ ] Service Role Key copiée (⚠️ secrète)
  - [ ] Project ID noté
  - [ ] Base de données migrée avec les derniers changements
  - [ ] RLS (Row Level Security) activé sur toutes les tables
  
- [ ] **Stripe**
  - [ ] Compte créé (test ou production)
  - [ ] Publishable Key copiée
  - [ ] Secret Key copiée (⚠️ secrète)
  - [ ] Mode choisi (test pour développement, live pour production)
  
- [ ] **SMTP** (optionnel - peut être configuré après)
  - [ ] Fournisseur SMTP choisi
  - [ ] Credentials créés
  - [ ] Pour Gmail : mot de passe d'application créé
  
- [ ] **Serveur**
  - [ ] Serveur Debian 13 disponible (min 2 Go RAM)
  - [ ] Accès root disponible
  - [ ] Domaine acheté
  - [ ] DNS configuré (A record pointant vers IP du serveur)

- [ ] **Code source**
  - [ ] Repository GitHub créé
  - [ ] Code pushé sur GitHub
  - [ ] URL du repository notée

## Installation

- [ ] Script d'installation téléchargé
- [ ] Script exécuté avec succès
- [ ] Application démarrée (vérifier avec `pm2 status`)
- [ ] Nginx configuré et actif
- [ ] Certificat SSL obtenu (Let's Encrypt)
- [ ] Application accessible via HTTPS

## Configuration post-installation

### Backend (Lovable Cloud / Supabase)

- [ ] **URLs de redirection configurées**
  - [ ] Site URL : `https://votre-domaine.fr`
  - [ ] Redirect URLs : `https://votre-domaine.fr/**`

- [ ] **Edge Functions déployées**
  - [ ] `send-inscription-email`
  - [ ] `create-stripe-payment-link`
  - [ ] `stripe-webhook`
  - [ ] `admin-create-user`
  - [ ] `admin-delete-user`
  - [ ] `admin-reset-password`
  - [ ] `get-users-list`

- [ ] **Secrets configurés pour Edge Functions**
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET` (après configuration webhook)

### Stripe

- [ ] **Webhook configuré**
  - [ ] Endpoint URL : `https://xxx.supabase.co/functions/v1/stripe-webhook`
  - [ ] Events sélectionnés :
    - [ ] `checkout.session.completed`
    - [ ] `payment_intent.succeeded`
    - [ ] `payment_intent.payment_failed`
  - [ ] Signing secret copié
  - [ ] Signing secret configuré dans les secrets backend

### Application

- [ ] **Premier utilisateur admin créé**
  - [ ] Se connecter via `/auth`
  - [ ] Créer un compte
  - [ ] Dans le backend, ajouter le rôle 'admin' dans la table `user_roles`

- [ ] **Configuration SMTP** (dans l'interface admin)
  - [ ] Hôte SMTP configuré
  - [ ] Port configuré
  - [ ] Credentials configurés
  - [ ] Email expéditeur configuré
  - [ ] Test d'envoi effectué

- [ ] **Tarifs configurés**
  - [ ] Accéder à "Gérer les tarifs"
  - [ ] Créer les grilles tarifaires pour 2025
  - [ ] Vérifier les calculs

- [ ] **Séjours créés**
  - [ ] Créer les séjours pour la saison
  - [ ] Vérifier les groupes d'âge
  - [ ] Vérifier les places disponibles

- [ ] **Documents téléchargés**
  - [ ] Documents PDF présents dans `/public/documents/`
  - [ ] Documents accessibles via l'interface

- [ ] **Contenu de la page d'accueil**
  - [ ] Textes personnalisés via "Page Accueil"
  - [ ] Vérifier l'affichage sur le site public

## Tests fonctionnels

- [ ] **Inscription publique**
  - [ ] Formulaire d'inscription accessible
  - [ ] Soumission d'une inscription test
  - [ ] Téléchargement de documents
  - [ ] Email de confirmation reçu

- [ ] **Espace Bureau**
  - [ ] Connexion admin fonctionnelle
  - [ ] Liste des inscriptions visible
  - [ ] Attribution de séjours fonctionnelle
  - [ ] Génération de lien de paiement Stripe
  - [ ] Export Excel des inscriptions
  - [ ] Téléchargement des documents

- [ ] **Paiement**
  - [ ] Lien de paiement Stripe généré
  - [ ] Paiement test effectué
  - [ ] Webhook reçu et traité
  - [ ] Statut de paiement mis à jour dans l'application

## Sécurité

- [ ] **Pare-feu**
  - [ ] UFW activé
  - [ ] Ports 80, 443, 22 ouverts uniquement
  
- [ ] **SSL/TLS**
  - [ ] Certificat Let's Encrypt installé
  - [ ] HTTPS fonctionnel
  - [ ] Redirection HTTP → HTTPS active
  
- [ ] **Clés secrètes**
  - [ ] Service Role Key non exposée dans le frontend
  - [ ] Stripe Secret Key non exposée
  - [ ] Fichier `.env` avec permissions 600
  
- [ ] **Base de données**
  - [ ] RLS activé sur toutes les tables
  - [ ] Policies correctement configurées
  - [ ] Scanner de sécurité Lovable exécuté (0 erreurs critiques)

- [ ] **Fail2ban** (optionnel mais recommandé)
  - [ ] Installé et configuré
  - [ ] Protection SSH active

## Monitoring

- [ ] **Logs**
  - [ ] Savoir accéder aux logs PM2
  - [ ] Savoir accéder aux logs Nginx
  - [ ] Savoir accéder aux logs Edge Functions
  
- [ ] **Statut**
  - [ ] Commande `pm2 status` testée
  - [ ] Commande `systemctl status nginx` testée
  
- [ ] **Sauvegarde** (optionnel)
  - [ ] Script de sauvegarde créé
  - [ ] Cron configuré
  - [ ] Première sauvegarde testée

## Maintenance

- [ ] **Documentation**
  - [ ] Commandes de mise à jour notées
  - [ ] Contacts support notés
  - [ ] Procédures d'urgence documentées

- [ ] **Mises à jour**
  - [ ] Script de mise à jour testé
  - [ ] Procédure de rollback connue

## Validation finale

- [ ] Site accessible publiquement via HTTPS
- [ ] Inscription test complète réalisée avec succès
- [ ] Paiement test effectué avec succès
- [ ] Email de confirmation reçu
- [ ] Administration fonctionnelle
- [ ] Aucune erreur dans les logs
- [ ] Performance satisfaisante (temps de chargement < 3s)
- [ ] Compatible mobile (test sur smartphone)

---

**Date de déploiement** : _______________

**Déployé par** : _______________

**Remarques** :
