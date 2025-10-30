# Configuration post-installation

Ce guide vous accompagne après l'installation initiale pour finaliser la configuration de votre application ENFANTAISIES.

## 1. Configuration Backend (Lovable Cloud / Supabase)

### Configuration des URLs de redirection

**Avec Lovable Cloud :**
1. Connectez-vous à Lovable
2. Ouvrez votre projet
3. Allez dans **Project Settings > Backend > Authentication**
4. Configurez :
   - **Site URL** : `https://votre-domaine.fr`
   - **Redirect URLs** : Ajoutez `https://votre-domaine.fr/**`

**Avec Supabase externe :**
1. Connectez-vous à https://supabase.com
2. Ouvrez votre projet
3. Allez dans **Authentication > URL Configuration**
4. Configurez :
   - **Site URL** : `https://votre-domaine.fr`
   - **Redirect URLs** : `https://votre-domaine.fr/**`

### Déploiement des Edge Functions (Supabase externe uniquement)

Si vous utilisez Lovable Cloud, les Edge Functions sont déjà déployées automatiquement. **Passez à l'étape suivante.**

Si vous utilisez Supabase externe :

```bash
# Installer Supabase CLI si pas déjà fait
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
cd /home/appuser/enfantaisies
supabase link --project-ref votre-project-id

# Déployer toutes les Edge Functions
supabase functions deploy send-inscription-email
supabase functions deploy create-stripe-payment-link
supabase functions deploy stripe-webhook
supabase functions deploy admin-create-user
supabase functions deploy admin-delete-user
supabase functions deploy admin-reset-password
supabase functions deploy get-users-list
```

### Configuration des secrets pour Edge Functions

Les Edge Functions ont besoin de secrets configurés :

**Avec Lovable Cloud :**
1. Dans Lovable, allez dans **Project Settings > Secrets**
2. Ajoutez les secrets suivants :
   - **Nom** : `STRIPE_SECRET_KEY`
     **Valeur** : Votre clé secrète Stripe (`sk_test_xxx` ou `sk_live_xxx`)
   - **Nom** : `SUPABASE_SERVICE_ROLE_KEY`
     **Valeur** : Votre Service Role Key

**Avec Supabase externe :**
```bash
# Configurer les secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Vérifier les secrets
supabase secrets list
```

## 2. Configuration Stripe

### Création du webhook

1. Connectez-vous à https://dashboard.stripe.com
2. Allez dans **Developers > Webhooks**
3. Cliquez sur **Add endpoint**
4. Configurez :
   
   **Endpoint URL :**
   - Lovable Cloud : `https://seuqrfwzpeegfxcegthf.supabase.co/functions/v1/stripe-webhook`
   - Supabase externe : `https://[votre-projet-id].supabase.co/functions/v1/stripe-webhook`
   
   **Events to send :**
   - ✓ `checkout.session.completed`
   - ✓ `payment_intent.succeeded`
   - ✓ `payment_intent.payment_failed`
   
5. Cliquez sur **Add endpoint**
6. **Important** : Copiez le **Signing secret** qui commence par `whsec_`

### Configuration du signing secret

**Avec Lovable Cloud :**
1. Dans Lovable > Project Settings > Secrets
2. Ajoutez un nouveau secret :
   - **Nom** : `STRIPE_WEBHOOK_SECRET`
   - **Valeur** : Le signing secret copié (`whsec_xxx`)

**Avec Supabase externe :**
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Test du webhook

1. Dans Stripe, allez dans **Developers > Webhooks**
2. Cliquez sur votre endpoint
3. Cliquez sur **Send test webhook**
4. Choisissez `checkout.session.completed`
5. Vérifiez que le statut est "succeeded"

## 3. Création du premier utilisateur administrateur

### Inscription

1. Allez sur `https://votre-domaine.fr/auth`
2. Inscrivez-vous avec vos identifiants
3. Vérifiez votre email si la confirmation est activée

### Attribution du rôle admin

**Avec Lovable Cloud :**
1. Connectez-vous à Lovable
2. Allez dans **Project Settings > Backend > Database**
3. Trouvez la table `user_roles`
4. Cliquez sur **Insert row**
5. Remplissez :
   - **user_id** : L'UUID de votre utilisateur (trouvez-le dans la table `auth.users`)
   - **role** : `admin`

**Avec Supabase externe :**
1. Allez dans votre projet Supabase
2. Allez dans **Table Editor**
3. Ouvrez la table `user_roles`
4. Cliquez sur **Insert row**
5. Remplissez :
   - **user_id** : L'UUID de votre utilisateur
   - **role** : `admin`

**Alternative en SQL :**
```sql
-- Remplacez EMAIL par votre email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'votre-email@example.com';
```

## 4. Configuration SMTP

1. Connectez-vous avec votre compte admin : `https://votre-domaine.fr/auth`
2. Accédez au tableau de bord Bureau
3. Cliquez sur le bouton **Configuration** (en haut à droite)
4. Remplissez le formulaire SMTP :

### Exemples de configuration

**Gmail :**
```
Hôte : smtp.gmail.com
Port : 587
TLS : ✓ Activé
Username : votre-email@gmail.com
Mot de passe : [mot de passe d'application]
Email expéditeur : votre-email@gmail.com
```

⚠️ **Important pour Gmail** : Vous devez créer un "mot de passe d'application"
1. Allez sur https://myaccount.google.com/security
2. Activez la validation en 2 étapes si pas déjà fait
3. Allez dans "Mots de passe des applications"
4. Créez un nouveau mot de passe pour "Mail"
5. Utilisez ce mot de passe (16 caractères) dans la configuration

**Office 365 / Outlook :**
```
Hôte : smtp.office365.com
Port : 587
TLS : ✓ Activé
Username : votre-email@outlook.com
Mot de passe : [votre mot de passe]
Email expéditeur : votre-email@outlook.com
```

**OVH :**
```
Hôte : ssl0.ovh.net
Port : 587
TLS : ✓ Activé
Username : votre-email@votredomaine.fr
Mot de passe : [votre mot de passe]
Email expéditeur : votre-email@votredomaine.fr
```

5. Cliquez sur **Enregistrer**
6. Testez l'envoi en créant une inscription test

## 5. Configuration de l'application

### Gestion des tarifs

1. Dans le tableau de bord Bureau, cliquez sur **Gérer les tarifs**
2. Créez les grilles tarifaires pour l'année en cours
3. Pour chaque tarif, remplissez :
   - **Numéro de tarif** : 1, 2, 3, etc.
   - **QF minimum** : Quotient familial minimum
   - **QF maximum** : Quotient familial maximum (laissez vide pour le dernier)
   - **Tarif journée centre aéré** : Prix par jour
   - **Tarif journée séjour** : Prix par jour pour les séjours

### Création des séjours

1. Dans le tableau de bord Bureau, cliquez sur **Nouveau séjour**
2. Pour chaque séjour, remplissez :
   - **Titre** : Nom du séjour
   - **Type** : Centre aéré ou Séjour
   - **Groupe d'âge** : Pitchouns, Minots ou Mias
   - **Lieu** : Lieu du séjour
   - **Date début** et **Date fin**
   - **Places disponibles** : Nombre de places

### Personnalisation de la page d'accueil

1. Dans le tableau de bord Bureau, cliquez sur **Page Accueil**
2. Modifiez les textes :
   - **Texte d'introduction** : Présentation du centre
   - **Encart Groupes adaptés** : Description des groupes
   - **Encart Séjours variés** : Description des séjours
   - **Encart Inscription simplifiée** : Description du processus
3. Cliquez sur **Enregistrer**

### Documents

Les documents PDF doivent être présents dans `/home/appuser/enfantaisies/public/documents/` :
- `ENFANTAISIES_autorisations_parentales.pdf`
- `ENFANTAISIES_certificat_medical.pdf`
- `ENFANTAISIES_charte_permanences_parents.pdf`
- `ENFANTAISIES_fiche_sanitaire.pdf`
- `ENFANTAISIES_reglement.pdf`

Si vous devez ajouter ou modifier des documents :
```bash
cd /home/appuser/enfantaisies/public/documents/
# Copiez vos nouveaux PDF ici
sudo chown appuser:appuser *.pdf
```

## 6. Tests de fonctionnement

### Test d'inscription complète

1. En navigation privée, allez sur `https://votre-domaine.fr`
2. Cliquez sur **Commencer l'inscription**
3. Remplissez le formulaire complet
4. Téléchargez des documents
5. Validez l'inscription
6. Vérifiez la réception de l'email de confirmation

### Test de l'espace Bureau

1. Connectez-vous en tant qu'admin
2. Vérifiez que l'inscription test apparaît
3. Attribuez un séjour
4. Testez l'export Excel
5. Testez le téléchargement des documents

### Test de paiement

⚠️ **En mode test uniquement !**

1. Depuis le Bureau, cliquez sur "Envoyer paiement" pour une inscription
2. Le lien de paiement Stripe doit s'ouvrir
3. Utilisez une carte de test : `4242 4242 4242 4242`
4. Complétez le paiement
5. Vérifiez que le statut de l'inscription passe à "Payé"

### Cartes de test Stripe

- **Paiement réussi** : `4242 4242 4242 4242`
- **Paiement refusé** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0027 6000 3184`

Date d'expiration : n'importe quelle date future
CVC : n'importe quel 3 chiffres
Code postal : n'importe quel code

## 7. Vérifications de sécurité

### Scanner de sécurité (Lovable Cloud)

1. Dans Lovable, allez dans **Project Settings > Security**
2. Cliquez sur **Run Security Scan**
3. Corrigez tous les problèmes critiques trouvés
4. Visez 0 erreur critique avant la mise en production

### Checklist sécurité

- [ ] RLS activé sur toutes les tables
- [ ] Certificat SSL actif (HTTPS)
- [ ] Pare-feu UFW configuré
- [ ] Service Role Key non exposée dans le frontend
- [ ] Stripe Secret Key non exposée
- [ ] Permissions fichier .env à 600
- [ ] Fail2ban installé (optionnel mais recommandé)

## 8. Passage en production

### Avant de passer en production

- [ ] Remplacer les clés Stripe test par les clés production
- [ ] Reconfigurer le webhook Stripe avec l'URL production
- [ ] Vérifier tous les textes et contenus
- [ ] Effectuer plusieurs inscriptions de test complètes
- [ ] Vérifier les emails envoyés
- [ ] Tester sur mobile et desktop
- [ ] Scanner la sécurité une dernière fois

### Mise à jour des clés Stripe en production

1. Mettez à jour `.env` :
```bash
sudo nano /home/appuser/enfantaisies/.env
# Remplacez VITE_STRIPE_PUBLISHABLE_KEY par pk_live_xxx
```

2. Mettez à jour les secrets backend :
   - Lovable Cloud : Project Settings > Secrets > Modifier `STRIPE_SECRET_KEY`
   - Supabase : `supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx`

3. Reconfigurer le webhook Stripe avec les nouvelles clés

4. Redémarrez l'application :
```bash
sudo -u appuser pm2 restart enfantaisies
```

## Support

En cas de problème, consultez :
- Le fichier `deploy/README.md` pour les commandes de dépannage
- Les logs : `sudo -u appuser pm2 logs enfantaisies`
- La checklist : `deploy/DEPLOYMENT-CHECKLIST.md`

Pour les problèmes spécifiques :
- Backend : Logs des Edge Functions dans Lovable/Supabase
- Paiements : Logs dans Stripe Dashboard
- Emails : Vérifier la configuration SMTP et les logs
