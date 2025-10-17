#!/bin/bash

# Script de mise à jour pour ENFANTAISIES
# Execute ce script pour mettre à jour l'application après un push Git

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_DIR="/home/appuser/enfantaisies"

echo -e "${GREEN}=== Mise à jour ENFANTAISIES ===${NC}"

# Vérifier que le script est exécuté en tant que root
if [[ $EUID -ne 0 ]]; then
   echo "Ce script doit être exécuté en tant que root" 
   exit 1
fi

cd "$APP_DIR"

echo -e "${YELLOW}1. Récupération des dernières modifications...${NC}"
sudo -u appuser git pull

echo -e "${YELLOW}2. Installation des dépendances...${NC}"
sudo -u appuser npm install

echo -e "${YELLOW}3. Build de l'application...${NC}"
sudo -u appuser npm run build

echo -e "${YELLOW}4. Redémarrage de l'application...${NC}"
sudo -u appuser pm2 restart enfantaisies

echo -e "${GREEN}✓ Mise à jour terminée !${NC}"
echo ""
echo "Vérifier le statut : sudo -u appuser pm2 status"
echo "Voir les logs : sudo -u appuser pm2 logs enfantaisies"
