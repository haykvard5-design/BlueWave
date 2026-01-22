#!/bin/bash

# Setup script для инициализации проекта

echo "🚀 Bluewave Messenger - Setup Script"
echo "======================================"

# 1. Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установи из https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# 2. Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

echo "✅ npm: $(npm --version)"

# 3. Установка зависимостей
echo ""
echo "📦 Установка зависимостей..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей"
    exit 1
fi

echo "✅ Зависимости установлены"

# 4. Копирование .env файла
if [ ! -f .env ]; then
    echo ""
    echo "📝 Копирование .env.example в .env"
    cp .env.example .env
    echo "⚠️  Не забудь отредактировать .env файл с корректными данными БД"
else
    echo "✅ .env уже существует"
fi

# 5. Проверка PostgreSQL
echo ""
echo "🔍 Проверка PostgreSQL..."

if command -v docker &> /dev/null; then
    echo ""
    echo "💡 Хочешь запустить PostgreSQL в Docker? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        echo "🐳 Запуск Docker Compose..."
        docker-compose up -d
        echo "✅ PostgreSQL запущён"
        echo "⏳ Ожидаю инициализацию БД (30 сек)..."
        sleep 30
    fi
else
    echo "ℹ️  Docker не найден. Убедись что PostgreSQL запущён вручную"
fi

echo ""
echo "✨ Setup завершён!"
echo ""
echo "📖 Следующие шаги:"
echo "1. Отредактируй .env файл"
echo "2. Запусти: npm run start:dev"
echo "3. Открой http://localhost:3000"
echo ""
echo "📚 Документация: README.md"
