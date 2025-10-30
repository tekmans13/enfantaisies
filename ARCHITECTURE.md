# Architecture du Projet - Centre Aéré ENFANTAISIES

## 📋 Vue d'ensemble

Application web de gestion des inscriptions pour un centre aéré, développée avec React, TypeScript et Supabase.

## 🏗️ Structure du Projet

```
src/
├── components/          # Composants React réutilisables
│   ├── ui/             # Composants UI de base (shadcn)
│   ├── InscriptionEditDialog.tsx
│   ├── InscriptionRecapDialog.tsx
│   ├── InscriptionStatusBadge.tsx
│   ├── SejourManageDialog.tsx
│   ├── SejourDetailsDialog.tsx
│   ├── SmtpConfigDialog.tsx
│   └── TarifManageDialog.tsx
│
├── pages/              # Pages de l'application
│   ├── Index.tsx              # Page d'accueil
│   ├── Inscription.tsx        # Formulaire d'inscription
│   ├── Bureau.tsx             # Interface de gestion (admin)
│   ├── RecapInscription.tsx   # Récapitulatif d'inscription
│   ├── Tarifs.tsx             # Gestion des tarifs
│   ├── Auth.tsx               # Authentification
│   └── admin/
│       ├── Configuration.tsx  # Configuration système
│       └── Users.tsx          # Gestion des utilisateurs
│
├── hooks/              # Custom React Hooks
│   ├── use-tarif-calculator.ts  # Calculs de tarifs
│   └── use-sejours.ts           # Gestion des séjours
│
├── lib/                # Utilitaires et helpers
│   ├── constants.ts           # Constantes globales
│   ├── formatters.ts          # Fonctions de formatage
│   ├── documentHelpers.ts     # Gestion des documents
│   ├── downloadDocuments.ts   # Téléchargement de fichiers
│   ├── excelExport.ts         # Export Excel
│   └── utils.ts               # Utilitaires divers
│
└── integrations/
    └── supabase/       # Configuration Supabase
        ├── client.ts   # Client Supabase
        └── types.ts    # Types générés

supabase/
├── functions/          # Edge Functions (backend)
│   ├── send-inscription-email/  # Envoi d'emails
│   ├── create-stripe-payment-link/
│   ├── stripe-webhook/
│   ├── admin-create-user/
│   ├── admin-delete-user/
│   ├── admin-reset-password/
│   └── get-users-list/
│
└── migrations/         # Migrations de base de données
```

## 🔧 Technologies Utilisées

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **React Router** - Routing
- **TanStack Query** - Gestion du cache et des requêtes
- **Tailwind CSS** - Styling
- **shadcn/ui** - Composants UI

### Backend
- **Supabase** - Base de données PostgreSQL, Auth, Storage
- **Edge Functions** - Functions serverless (Deno)
- **SMTP** - Envoi d'emails via denomailer
- **Stripe** - Paiements en ligne

## 📊 Modèle de Données

### Tables Principales

#### `inscriptions`
Contient toutes les inscriptions des enfants avec :
- Informations enfant (nom, âge, classe, allergies, etc.)
- Informations parents/responsables légaux
- Choix de séjours (préférences et alternatives)
- Statut de l'inscription
- Quotient familial pour le calcul du tarif

#### `sejours`
Définit les séjours disponibles :
- Titre et description
- Dates (début, fin)
- Groupe d'âge (pitchouns, minots, mias)
- Type (animation, séjour)
- Places disponibles

#### `tarifs`
Grille tarifaire basée sur le quotient familial :
- Tranches de QF (min/max)
- Tarifs journaliers pour animations
- Tarifs journaliers pour séjours
- Année d'application

#### `smtp_config`
Configuration SMTP pour l'envoi d'emails :
- Host, port, username, password
- Email expéditeur
- Options TLS

#### `user_roles`
Gestion des rôles utilisateurs (admin, user)

#### `inscription_documents`
Métadonnées des documents uploadés (fiches sanitaires, certificats, etc.)

## 🔄 Flux de Données

### 1. Inscription d'un Enfant

```
Parent → Formulaire (5 étapes) → Validation → Upload documents → 
Création inscription en DB → Envoi email confirmation → Redirection récap
```

### 2. Attribution des Séjours (Admin)

```
Admin ouvre Bureau → Sélectionne inscription → Dialogue d'édition → 
Choix séjours → Mise à jour DB + gestion places → Notification
```

### 3. Calcul et Paiement

```
Récupération QF → Recherche tarif applicable → Calcul prix selon jours → 
Création lien Stripe → Envoi email avec lien → Webhook Stripe → 
Mise à jour statut paiement
```

## 🎨 Architecture des Composants

### Hiérarchie
```
App
├── Index (Accueil)
├── Inscription (Formulaire multi-étapes)
│   ├── Step 1: Documents à préparer
│   ├── Step 2: Informations enfant
│   ├── Step 3: Contacts et autorisations
│   ├── Step 4: Choix des séjours
│   └── Step 5: Upload documents
├── Bureau (Dashboard Admin)
│   ├── Statistiques
│   ├── Liste inscriptions
│   ├── Gestion séjours
│   └── Actions (édition, paiement, export)
├── RecapInscription (Confirmation)
└── Admin
    ├── Configuration (SMTP, Stripe, Supabase)
    ├── Users (Gestion utilisateurs)
    └── Tarifs (Grille tarifaire)
```

### Composants Réutilisables

- **InscriptionStatusBadge** : Badge de statut coloré
- **InscriptionEditDialog** : Dialogue d'édition d'inscription
- **InscriptionRecapDialog** : Récapitulatif dans un dialogue
- **SejourManageDialog** : Création/édition de séjours
- **TarifManageDialog** : Création/édition de tarifs

## 🔐 Sécurité

### Row Level Security (RLS)
- Les inscriptions sont accessibles uniquement par le parent (via email) ou les admins
- Les séjours et tarifs sont visibles par tous, modifiables par admins seulement
- La config SMTP est accessible uniquement aux admins

### Authentication
- Supabase Auth pour l'authentification
- Système de rôles (admin, user)
- Edge functions protégées par JWT

### Upload de Fichiers
- Storage Supabase avec bucket privé `inscription-documents`
- Nommage standardisé : `nom_prenom_type-document.ext`
- Validation côté client et serveur

## 📝 Conventions de Code

### Nommage
- **Composants** : PascalCase (`InscriptionEditDialog.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`use-tarif-calculator.ts`)
- **Utilitaires** : camelCase (`formatters.ts`)
- **Constantes** : SCREAMING_SNAKE_CASE (`TOTAL_INSCRIPTION_STEPS`)

### Organisation
- **1 composant = 1 fichier**
- **Commentaires JSDoc** pour toutes les fonctions publiques
- **Types TypeScript** explicites
- **Imports groupés** : React → Libraries → Components → Utils

### Gestion d'État
- **React Query** pour les données serveur (cache, refetch automatique)
- **useState** pour l'état local des composants
- **Realtime subscriptions** pour les mises à jour en temps réel

## 🚀 Déploiement

### Variables d'Environnement Requises
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_SUPABASE_PROJECT_ID=xxx
```

### Configuration SMTP (en DB)
- Host, port, username, password
- Email expéditeur
- Options TLS

### Configuration Stripe (en DB)
- Publishable key (frontend)
- Secret key (backend - edge functions)
- Webhook secret

## 🧪 Tests et Debug

### Mode Debug
- `localStorage.setItem('debugMode', 'true')` pour bypass les validations
- Logs dans la console pour le suivi des actions

### Outils de Debug
- React DevTools
- Supabase Studio (base de données)
- Network tab pour les edge functions

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
