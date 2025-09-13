@echo off
echo 🚀 CLEAN GIT PUSH SCRIPT
echo ========================
echo.

echo 🧹 CLEANING GIT HISTORY...
echo ==========================

REM Remove old remote
git remote remove origin 2>nul

echo ✅ Removed old remote

REM Create orphan branch (clean history)
git checkout --orphan clean-main 2>nul

echo ✅ Created clean branch

REM Add all files
git add .

echo ✅ Added all files

REM Commit with clean message
git commit -m "Initial commit: Enhanced AI Video Story platform with professional UI/UX"

echo ✅ Created clean commit

REM Delete old main branch
git branch -D main 2>nul

echo ✅ Deleted old main branch

REM Rename current branch to main
git branch -m main

echo ✅ Renamed branch to main

echo.
echo 🔗 ADDING NEW REMOTE...
echo =======================

REM Add correct remote
git remote add origin https://github.com/nita-05/ai-video-story-enhanced.git

echo ✅ Added new remote

echo.
echo 🚀 PUSHING TO GITHUB...
echo =======================

REM Push to GitHub
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo 🎉 SUCCESS!
    echo ===========
    echo Your AI Video Story project has been successfully pushed to GitHub!
    echo.
    echo 🔗 Repository: https://github.com/nita-05/ai-video-story-enhanced
    echo.
) else (
    echo.
    echo ❌ PUSH FAILED
    echo ==============
    echo Please check your GitHub repository URL and try again.
    echo.
    echo 💡 Make sure you have created the repository at:
    echo    https://github.com/nita-05/ai-video-story-enhanced
    echo.
)

pause
