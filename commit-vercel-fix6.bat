@echo off
git add .
git commit --no-verify -m "fix: force Node.js 18 and update build config"
git push origin main
