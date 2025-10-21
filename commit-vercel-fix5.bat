@echo off
git add .
git commit --no-verify -m "fix: update Vercel configuration to fix build issues"
git push origin main
