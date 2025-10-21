@echo off
echo Installing required dependencies...

# Installer sharp pour l'optimisation des images
cd packages\nextjs
yarn add sharp

# Mettre à jour les dépendances de navigateur
npx update-browserslist-db@latest
npx browserslist@latest --update-db

# Nettoyer le cache
cd ..\..
rmdir /s /q .next
cd packages\nextjs
rmdir /s /q .next

# Reconstruire l'application
echo Building the application...
yarn build

# Démarrer le serveur
echo Starting development server...
yarn dev
