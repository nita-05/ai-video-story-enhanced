@echo off
echo 🚀 GITHUB SETUP SCRIPT
echo =====================
echo.

echo 📋 PREREQUISITES CHECK:
echo =======================

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first.
    echo    Download from: https://git-scm.com/download/win
    pause
    exit /b 1
) else (
    echo ✅ Git is installed
)

echo.
echo 🎯 SETUP STEPS:
echo ================
echo 1. Create GitHub account at https://github.com
echo 2. Create new repository
echo 3. Copy repository URL
echo 4. Run this script with your repository URL
echo.

set /p REPO_URL="Enter your GitHub repository URL: "

if "%REPO_URL%"=="" (
    echo ❌ Repository URL is required
    pause
    exit /b 1
)

echo.
echo 🔧 INITIALIZING GIT REPOSITORY:
echo ================================

REM Initialize git repository
git init
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize git repository
    pause
    exit /b 1
)

echo ✅ Git repository initialized

REM Add all files
git add .
if %errorlevel% neq 0 (
    echo ❌ Failed to add files
    pause
    exit /b 1
)

echo ✅ Files added to staging

REM Create initial commit
git commit -m "Initial commit: Enhanced AI Video Story platform with professional UI/UX"
if %errorlevel% neq 0 (
    echo ❌ Failed to create commit
    pause
    exit /b 1
)

echo ✅ Initial commit created

REM Add remote origin
git remote add origin %REPO_URL%
if %errorlevel% neq 0 (
    echo ❌ Failed to add remote origin
    pause
    exit /b 1
)

echo ✅ Remote origin added

REM Set main branch
git branch -M main
if %errorlevel% neq 0 (
    echo ❌ Failed to set main branch
    pause
    exit /b 1
)

echo ✅ Main branch set

echo.
echo 🚀 PUSHING TO GITHUB:
echo =====================
echo You will be prompted for your GitHub credentials.
echo Use your GitHub username and Personal Access Token as password.
echo.

REM Push to GitHub
git push -u origin main
if %errorlevel% neq 0 (
    echo ❌ Failed to push to GitHub
    echo Please check your credentials and try again
    pause
    exit /b 1
)

echo.
echo 🎉 SUCCESS!
echo ===========
echo Your AI Video Story project has been successfully pushed to GitHub!
echo.
echo 📋 NEXT STEPS:
echo ==============
echo 1. Go to your GitHub repository
echo 2. Verify all files are uploaded
echo 3. Set up GitHub Pages for free hosting
echo 4. Connect to Vercel or Netlify for deployment
echo.
echo 🔗 Repository URL: %REPO_URL%
echo.

pause
