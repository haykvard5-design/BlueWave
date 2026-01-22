# ⚡ Quick Start Guide - Bluewave Messenger

Запусти мессенджер локально за 5 минут!

## 📋 Требования

- Node.js 16+ ([скачай](https://nodejs.org/))
- PostgreSQL 12+ ([скачай](https://www.postgresql.org/download/))
- npm или yarn

## 🚀 1-2-3 Запуск

### Вариант A: С использованием Docker (Рекомендуется)

```bash
# 1. Установи Docker Desktop
# https://www.docker.com/products/docker-desktop

# 2. В корне проекта (где есть docker-compose.yml)
cd bluewave

# 3. Запусти PostgreSQL
docker-compose up -d postgres

# 4. Подожди 30 секунд, потом установи зависимости
npm install

# 5. Скопируй .env
cp .env.example .env

# 6. Запусти в режиме разработки
npm run start:dev

# 7. Сервер готов! 🎉
# http://localhost:3000
```

### Вариант B: PostgreSQL установлена локально

```bash
# 1. Создай БД
createdb bluewave_messenger

# 2. Загрузи schema
psql -U postgres -d bluewave_messenger -f schema.sql

# 3. Скопируй .env и заполни данные БД
cp .env.example .env
# Отредактируй:
# DB_HOST=localhost
# DB_USERNAME=postgres
# DB_PASSWORD=your_password

# 4. Установи зависимости
npm install

# 5. Запусти
npm run start:dev
```

## ✅ Проверка, что всё работает

### 1️⃣ Тест API
```bash
# Откой терминал и выполни:
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "username": "testuser"
  }'

# Должен вернуть:
# {
#   "accessToken": "eyJhbGc...",
#   "user": { "id": "...", "email": "test@example.com", ... }
# }
```

### 2️⃣ Используй Postman
```
1. Импортируй коллекцию: Bluewave_Messenger.postman_collection.json
2. Откою Postman
3. File → Import → Выбери файл
4. Запусти Register и Login
5. Скопируй accessToken в переменную {{accessToken}}
```

### 3️⃣ WebSocket тест
```javascript
// В браузере DevTools Console:
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-access-token-here'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected!');
});

socket.on('connect_error', (error) => {
  console.log('❌ Error:', error);
});
```

## 📱 Следующие шаги

### Создать чат
```bash
curl -X POST http://localhost:3000/chats/private \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"recipientId": "other-user-id"}'
```

### Отправить сообщение
```bash
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "chat-id",
    "content": "Hello!",
    "type": "text"
  }'
```

### Получить все чаты
```bash
curl http://localhost:3000/chats \
  -H "Authorization: Bearer <access_token>"
```

## 🎯 Common Commands

```bash
# Запуск в режиме разработки (с hot reload)
npm run start:dev

# Сборка для production
npm run build

# Запуск production версии
npm run start:prod

# Запуск тестов
npm test

# Проверка типов TypeScript
npm run build

# Проверка линтера
npm run lint

# Остановить все Docker контейнеры
docker-compose down

# Просмотр логов PostgreSQL
docker-compose logs postgres
```

## 🐛 Troubleshooting

### Ошибка: "Cannot find module..."
```bash
# Переустанови зависимости
rm -rf node_modules package-lock.json
npm install
```

### Ошибка: "Port 3000 already in use"
```bash
# На Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# На macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Ошибка: "PostgreSQL connection refused"
```bash
# Проверь, запущена ли БД
# Docker:
docker ps

# Локально (macOS):
brew services list | grep postgres

# Перезапусти Docker контейнер
docker-compose restart postgres
```

### Ошибка: "Cannot read property 'toString' of undefined"
```bash
# Убедись, что в .env все переменные заполнены
cat .env

# Пересоздай .env из примера
cp .env.example .env
```

### WebSocket не подключается
```bash
# Проверь token в auth:
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_VALID_TOKEN'  // Убедись, что токен валидный
  }
});

# Проверь CORS в браузере (DevTools → Network → WS)
# Должна быть зелёная иконка
```

## 📚 Полная документация

- **API Endpoints**: [README.md](./README.md)
- **Архитектура**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **WebSocket**: [websocket-client.ts](./websocket-client.ts)

## 💡 Tips & Tricks

### Быстро создать тестовых пользователей
```bash
# Создай скрипт seed.ts и запусти:
npm run seed

# Это создаст тестовых пользователей с известными credentials
```

### Debug режим
```bash
# Node с inspector
node --inspect dist/main.js

# Chrome DevTools
chrome://inspect
```

### Мониторинг в реальном времени
```bash
npm install -g pm2
pm2 start dist/main.js
pm2 monit
```

### Просмотр БД
```bash
# С помощью adminer (если используешь docker-compose)
# Открой http://localhost:8080
# Credentials: PostgreSQL, localhost, postgres, postgres
```

## 🎓 Что дальше?

1. **Изучи API** - тестируй все endpoints в Postman
2. **Понимай WebSocket** - посмотри на примеры в websocket-client.ts
3. **Напиши Android клиент** - используй Kotlin + Socket.io
4. **Deploy на production** - следуй [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🤝 Need Help?

- 📖 Полная документация в README.md
- 🏗️ Архитектура в ARCHITECTURE.md
- 🚀 Deployment guide в DEPLOYMENT.md
- 💬 Примеры кода в websocket-client.ts

---

**Готово!** Теперь у тебя есть работающий backend мессенджера. Пора писать Android клиент! 💪
