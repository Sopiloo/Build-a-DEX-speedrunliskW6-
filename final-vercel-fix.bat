@echo off
echo Cleaning up...
rmdir /s /q node_modules
rmdir /s /q packages\nextjs\node_modules
rm yarn.lock
rm packages\nextjs\yarn.lock

echo Installing dependencies...
yarn install --force

cd packages\nextjs
yarn install --force
cd ..\..

echo Committing changes...
git add .
git commit --no-verify -m "fix: final update for Vercel build issues"
git push origin main

echo Done! Your changes have been pushed to GitHub.
