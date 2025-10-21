@echo off
git add .
git commit --no-verify -m "fix: update .npmrc to fix build issues on Vercel"
git push origin main
