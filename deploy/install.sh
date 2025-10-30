#!/bin/bash

# Script d'installation pour ENFANTAISIES sur Debian/Ubuntu
# Ce script configure un serveur web complet avec Nginx et l'application

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Installation ENFANTAISIES${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Vérifier que le script est exécuté en tant que root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Ce script doit être exécuté en tant que root${NC}" 
   exit 1
fi

# 1. COLLECTER LES INFORMATIONS
echo -e "${YELLOW}=== Configuration du serveur ===${NC}"
read -p "Nom de domaine (ex: enfantaisies.fr): " DOMAIN_NAME
read -p "Email pour Let's Encrypt: " ADMIN_EMAIL
read -p "Port de l'application (défaut: 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}

echo ""
echo -e "${YELLOW}=== Configuration Lovable Cloud / Supabase ===${NC}"
echo "Ces informations se trouvent dans Lovable (Project Settings > Backend)"
echo "ou dans votre projet Supabase (Settings > API)"
read -p "URL du backend (ex: https://xxx.supabase.co): " SUPABASE_URL
read -sp "Clé anonyme (Anon Key): " SUPABASE_ANON_KEY
echo ""
read -sp "Clé Service Role: " SUPABASE_SERVICE_ROLE_KEY
echo ""
read -p "ID du projet: " SUPABASE_PROJECT_ID

echo ""
echo -e "${YELLOW}=== Configuration Stripe ===${NC}"
echo "Ces informations se trouvent dans Stripe (Developers > API keys)"
read -p "Clé publique Stripe (pk_test_xxx ou pk_live_xxx): " STRIPE_PUBLISHABLE_KEY
read -sp "Clé secrète Stripe (sk_test_xxx ou sk_live_xxx): " STRIPE_SECRET_KEY
echo ""

echo ""
echo -e "${YELLOW}=== Configuration du repository ===${NC}"
read -p "URL du repository Git (ex: https://github.com/user/repo.git): " GIT_REPO

# 2. MISE À JOUR DU SYSTÈME
echo ""
echo -e "${GREEN}=== Mise à jour du système ===${NC}"
apt update
apt upgrade -y

# 3. INSTALLATION DES DÉPENDANCES
echo ""
echo -e "${GREEN}=== Installation des dépendances ===${NC}"

# Installation de Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "Installation de Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Installation de Git
if ! command -v git &> /dev/null; then
    echo "Installation de Git..."
    apt install -y git
fi

# Installation de Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installation de Nginx..."
    apt install -y nginx
else
    echo "Nginx déjà installé, passage à l'étape suivante..."
fi

# Installation de Certbot pour SSL
if ! command -v certbot &> /dev/null; then
    echo "Installation de Certbot..."
    apt install -y certbot python3-certbot-nginx
fi

# Installation de PM2 pour la gestion des processus
if ! command -v pm2 &> /dev/null; then
    echo "Installation de PM2..."
    npm install -g pm2
fi

# 4. CRÉATION DE L'UTILISATEUR DE L'APPLICATION
echo ""
echo -e "${GREEN}=== Création de l'utilisateur application ===${NC}"
if ! id -u appuser &> /dev/null; then
    useradd -m -s /bin/bash appuser
fi

# 5. CLONAGE DU REPOSITORY
echo ""
echo -e "${GREEN}=== Téléchargement de l'application ===${NC}"
APP_DIR="/home/appuser/enfantaisies"

if [ -d "$APP_DIR" ]; then
    echo "Le répertoire existe déjà, suppression..."
    rm -rf "$APP_DIR"
fi

sudo -u appuser git clone "$GIT_REPO" "$APP_DIR"
cd "$APP_DIR"

# 6. CRÉATION DU FICHIER .env
echo ""
echo -e "${GREEN}=== Configuration des variables d'environnement ===${NC}"
cat > "$APP_DIR/.env" <<EOF
# Configuration Lovable Cloud / Supabase (Frontend)
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_ANON_KEY
VITE_SUPABASE_PROJECT_ID=$SUPABASE_PROJECT_ID

# Configuration Stripe (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY

# Configuration de l'application
NODE_ENV=production
PORT=$APP_PORT
EOF

chown appuser:appuser "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

echo ""
echo -e "${YELLOW}⚠️  Configuration des Edge Functions${NC}"
echo "Les Edge Functions nécessitent des secrets configurés dans votre backend."
echo ""
echo "Avec Lovable Cloud :"
echo "  1. Allez dans Project Settings > Secrets"
echo "  2. Ajoutez les secrets suivants :"
echo "     - STRIPE_SECRET_KEY = $STRIPE_SECRET_KEY"
echo "     - SUPABASE_SERVICE_ROLE_KEY = [votre service role key]"
echo ""
echo "Avec Supabase externe, exécutez :"
echo "  supabase secrets set STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
echo "  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
echo ""
read -p "Appuyez sur Entrée une fois les secrets configurés..."

# 7. INSTALLATION DES DÉPENDANCES ET BUILD
echo ""
echo -e "${GREEN}=== Installation des dépendances ===${NC}"
sudo -u appuser npm install

echo ""
echo -e "${GREEN}=== Build de l'application ===${NC}"
sudo -u appuser npm run build

# 8. CONFIGURATION DE PM2
echo ""
echo -e "${GREEN}=== Configuration PM2 ===${NC}"
cat > "$APP_DIR/ecosystem.config.js" <<EOF
module.exports = {
  apps: [{
    name: 'enfantaisies',
    script: 'npx',
    args: 'serve -s dist -l $APP_PORT',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

chown appuser:appuser "$APP_DIR/ecosystem.config.js"

# Installation de serve pour servir l'application
sudo -u appuser npm install -g serve

# Démarrage avec PM2
sudo -u appuser pm2 start "$APP_DIR/ecosystem.config.js"
sudo -u appuser pm2 save

# Configuration PM2 pour démarrer au boot
pm2 startup systemd -u appuser --hp /home/appuser
sudo -u appuser pm2 save

# 9. CONFIGURATION DE NGINX
echo ""
echo -e "${GREEN}=== Configuration Nginx ===${NC}"
cat > "/etc/nginx/sites-available/$DOMAIN_NAME" <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    client_max_body_size 100M;
}
EOF

# Activation du site
ln -sf "/etc/nginx/sites-available/$DOMAIN_NAME" "/etc/nginx/sites-enabled/$DOMAIN_NAME"

# Test de la configuration
nginx -t

# Rechargement de Nginx (reload au lieu de restart pour ne pas interrompre les autres sites)
systemctl reload nginx
systemctl enable nginx

# 10. CONFIGURATION SSL AVEC LET'S ENCRYPT
echo ""
echo -e "${GREEN}=== Configuration SSL ===${NC}"
echo -e "${YELLOW}Configuration de Let's Encrypt pour $DOMAIN_NAME${NC}"
certbot --nginx -d "$DOMAIN_NAME" -d "www.$DOMAIN_NAME" --non-interactive --agree-tos -m "$ADMIN_EMAIL"

# 11. CONFIGURATION DU PARE-FEU (UFW)
echo ""
echo -e "${GREEN}=== Configuration du pare-feu ===${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw --force enable
fi

# 12. AFFICHAGE DES INFORMATIONS FINALES
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Installation terminée !${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Informations importantes :${NC}"
echo "- Application installée dans: $APP_DIR"
echo "- L'application tourne sur le port: $APP_PORT"
echo "- Domaine: https://$DOMAIN_NAME"
echo "- Certificat SSL: Configuré avec Let's Encrypt"
echo ""
echo -e "${YELLOW}Commandes utiles :${NC}"
echo "- Voir les logs: sudo -u appuser pm2 logs enfantaisies"
echo "- Redémarrer l'app: sudo -u appuser pm2 restart enfantaisies"
echo "- Voir le statut: sudo -u appuser pm2 status"
echo "- Mettre à jour l'app: cd $APP_DIR && sudo -u appuser git pull && sudo -u appuser npm install && sudo -u appuser npm run build && sudo -u appuser pm2 restart enfantaisies"
echo ""
echo -e "${GREEN}Votre application est maintenant accessible à: https://$DOMAIN_NAME${NC}"
echo ""
echo -e "${YELLOW}N'oubliez pas de :${NC}"
echo ""
echo "1. Configurer les URL de redirection dans votre backend :"
echo "   Lovable Cloud : Project Settings > Backend > Authentication"
echo "   Supabase : Authentication > URL Configuration"
echo "   - Site URL: https://$DOMAIN_NAME"
echo "   - Redirect URLs: https://$DOMAIN_NAME/**"
echo ""
echo "2. Déployer les Edge Functions (si Supabase externe) :"
echo "   cd $APP_DIR"
echo "   supabase functions deploy send-inscription-email"
echo "   supabase functions deploy create-stripe-payment-link"
echo "   supabase functions deploy stripe-webhook"
echo "   supabase functions deploy admin-create-user"
echo "   supabase functions deploy admin-delete-user"
echo "   supabase functions deploy admin-reset-password"
echo "   supabase functions deploy get-users-list"
echo ""
echo "3. Configurer le webhook Stripe :"
echo "   - URL: https://[votre-projet].supabase.co/functions/v1/stripe-webhook"
echo "   - Events: checkout.session.completed, payment_intent.succeeded"
echo "   - Ajoutez le signing secret dans les secrets backend"
echo ""
echo "4. Configurer SMTP depuis l'interface admin :"
echo "   - Connectez-vous sur https://$DOMAIN_NAME/auth"
echo "   - Allez dans Configuration"
echo "   - Remplissez les informations SMTP"
echo ""
echo "5. Créer le premier utilisateur admin :"
echo "   - Inscrivez-vous sur https://$DOMAIN_NAME/auth"
echo "   - Dans votre backend, ajoutez un rôle 'admin' dans user_roles"
echo ""
