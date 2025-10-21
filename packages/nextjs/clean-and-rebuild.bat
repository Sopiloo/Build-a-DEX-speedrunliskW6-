@echo off
echo Cleaning up...

REM Remove build artifacts
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

REM Remove node modules and reinstall
echo Reinstalling dependencies...
cd ..\..
yarn install --force

cd packages\nextjs
yarn install --force

echo Building the application...
yarn build

if %ERRORLEVEL% EQU 0 (
    echo Build successful! You can now deploy to Vercel.
) else (
    echo Build failed. Please check the error messages above.
    pause
)
