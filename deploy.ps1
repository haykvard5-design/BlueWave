# BlueWave Deploy Script for Render (PowerShell)
# Запуск: .\deploy.ps1  или  pwsh .\deploy.ps1

$ErrorActionPreference = "Stop"

# 1️⃣ Перейти в папку проекта
Set-Location "G:\bluewave"
Write-Host "[1/9] Working directory: $(Get-Location)" -ForegroundColor Cyan

# 2️⃣ Проверить ветку main
git checkout main
Write-Host "[2/9] Checked out main" -ForegroundColor Cyan

# 3️⃣ Обновить локальный репозиторий и подтянуть изменения с GitHub
git pull origin main --allow-unrelated-histories
Write-Host "[3/9] Pulled from origin main" -ForegroundColor Cyan

# 4️⃣ Удаляем SSL (если случайно остался)
if (Test-Path "ssl") {
    Remove-Item -Recurse -Force ssl
    Write-Host "[4/9] ssl/ removed" -ForegroundColor Yellow
} else {
    Write-Host "[4/9] ssl/ not found, skip" -ForegroundColor Gray
}

# 5️⃣ Обновляем .gitignore
if (-not (Select-String -Path ".gitignore" -Pattern "ssl/" -Quiet)) {
    Add-Content .gitignore "`nssl/"
    git add .gitignore
    Write-Host "[5/9] Added ssl/ to .gitignore" -ForegroundColor Yellow
} else {
    Write-Host "[5/9] ssl/ already in .gitignore" -ForegroundColor Gray
}

# 6️⃣ Установка зависимостей (игнорируем peerDependencies)
npm install --legacy-peer-deps
Write-Host "[6/9] npm install done" -ForegroundColor Cyan

# 7️⃣ Сборка проекта NestJS
npm run build
Write-Host "[7/9] npm run build done" -ForegroundColor Cyan

# 8️⃣ Добавляем изменения и делаем коммит
git add .
$hasChanges = git status --porcelain
if ($hasChanges) {
    git commit -m "Auto deploy prepare for Render" -a
    Write-Host "[8/9] Committed changes" -ForegroundColor Green
} else {
    Write-Host "[8/9] No changes to commit" -ForegroundColor Gray
}

# 9️⃣ Пушим на GitHub (force только если нужен перезапись истории)
git push -u origin main --force
Write-Host "[9/9] Pushed to origin main" -ForegroundColor Green

# ✅ Готово
Write-Host ""
Write-Host "BlueWave готов к деплою на Render!" -ForegroundColor Green
