@echo off
echo Cleaning up...
del /s /q .next

cd packages\nextjs
del /s /q .next
cd ..\..

echo Installing dependencies...
yarn install --force

cd packages\nextjs
yarn dev
