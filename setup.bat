@echo off
REM Setup script для Windows

echo 🚀 Bluewave Messenger - Setup Script
echo ======================================

REM 1. Проверка Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен. Установи из https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js: %%i

REM 2. Проверка npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm не установлен
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do echo ✅ npm: %%i

REM 3. Установка зависимостей
echo.
echo 📦 Установка зависимостей...
call npm install

if errorlevel 1 (
    echo ❌ Ошибка при установке зависимостей
    pause
    exit /b 1
)

echo ✅ Зависимости установлены

REM 4. Копирование .env файла
if not exist .env (
    echo.
    echo 📝 Копирование .env.example в .env
    copy .env.example .env
    echo ⚠️  Не забудь отредактировать .env файл с корректными данными БД
) else (
    echo ✅ .env уже существует
)

echo.
echo ✨ Setup завершён!
echo.
echo 📖 Следующие шаги:
echo 1. Отредактируй .env файл
echo 2. Запусти: npm run start:dev
echo 3. Открой http://localhost:3000
echo.
echo 📚 Документация: README.md
echo.
pause
