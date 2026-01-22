# Bluewave Messenger Backend

Продвинутый мессенджер на **NestJS + PostgreSQL + WebSocket**.

## 🚀 Установка и запуск

### Требования
- Node.js 16+
- PostgreSQL 12+
- npm или yarn

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка БД
Скопируй `.env.example` в `.env` и заполни переменные:
```bash
cp .env.example .env
```

Загрузи схему в PostgreSQL:
```bash
psql -U postgres -d bluewave_messenger -f schema.sql
```

### 3. Запуск разработка
```bash
npm run start:dev
```

Сервер запустится на `http://localhost:3000`

## 📡 API Endpoints

### Authentication

**POST** `/auth/register`
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "secure_password",
  "username": "johndoe"
}
```

**POST** `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Users

**GET** `/users/me` - Профиль текущего пользователя
**GET** `/users/:id` - Получить пользователя по ID
**GET** `/users/search?q=username` - Поиск пользователей
**PUT** `/users/me` - Обновить профиль
**PUT** `/users/:id/status` - Обновить статус

### Chats

**POST** `/chats/private` - Создать личный чат
```json
{
  "recipientId": "user-id"
}
```

**POST** `/chats/group` - Создать групповой чат
```json
{
  "name": "Team Chat",
  "avatar": "url",
  "memberIds": ["user-id-1", "user-id-2"]
}
```

**GET** `/chats` - Получить все чаты пользователя
**GET** `/chats/:id` - Получить чат по ID
**PUT** `/chats/:id` - Обновить чат
**POST** `/chats/:id/members` - Добавить участника
**DELETE** `/chats/:id/members/:memberId` - Удалить участника
**PUT** `/chats/:id/archive` - Архивировать чат

### Messages

**POST** `/messages` - Отправить сообщение
```json
{
  "chatId": "chat-id",
  "content": "Hello!",
  "type": "text",
  "mediaUrl": "optional-url",
  "fileName": "optional-file-name",
  "tempId": "optional-client-id"
}
```

**GET** `/messages/chat/:chatId?limit=50&offset=0` - Получить сообщения чата
**GET** `/messages/:id` - Получить сообщение по ID
**PUT** `/messages/:id/status` - Обновить статус сообщения
**PUT** `/messages/:id/read` - Отметить как прочитанное
**DELETE** `/messages/:id` - Удалить сообщение
**GET** `/messages/sync/data?lastSyncTime=timestamp` - Синхронизировать сообщения

## 🔌 WebSocket Events

### Client -> Server

**message:send**
```json
{
  "chatId": "chat-id",
  "content": "Hello!",
  "type": "text",
  "mediaUrl": "optional",
  "fileName": "optional",
  "tempId": "client-id"
}
```

**message:status**
```json
{
  "messageId": "msg-id",
  "status": "read"
}
```

**chat:subscribe** - Подписаться на чат
```json
{
  "chatId": "chat-id"
}
```

**typing:start** / **typing:stop**
```json
{
  "chatId": "chat-id",
  "userId": "user-id"
}
```

**user:status**
```json
{
  "status": "online|offline|away"
}
```

**sync:request**
```json
{
  "lastSyncTime": "2024-01-22T10:00:00Z"
}
```

### Server -> Client

**chat:MESSAGE_ID:message** - Новое сообщение
**message:statusUpdated** - Обновление статуса сообщения
**typing:start** / **typing:stop** - Индикатор печати
**user-online** / **user-offline** - Статус пользователя
**sync:response** - Данные синхронизации
**offline-queue:items** - Очередь оффлайн сообщений

## 🔐 Authentication

Все защищённые endpoints требуют **JWT токен** в header:
```
Authorization: Bearer <access_token>
```

## 📦 Структура проекта

```
src/
├── main.ts                 # Entry point
├── app.module.ts           # Root module
├── config/
│   └── database.config.ts  # Database configuration
├── modules/
│   ├── auth/               # Authentication (JWT, Login, Register)
│   ├── users/              # User management
│   ├── chats/              # Chat management
│   ├── messages/           # Messages and offline queue
│   └── websocket/          # WebSocket Gateway (realtime)
└── database/               # Migrations, seeds
```

## 💾 Database Schema

- **users** - Пользователи с статусом online/offline
- **chats** - Личные и групповые чаты
- **chat_members** - Участники чатов с unread счётчиком
- **messages** - Сообщения с статусом sent/delivered/read
- **offline_queue** - Очередь для оффлайн сообщений

## 🔄 Синхронизация

### Offline Queue
При потере интернета сообщения сохраняются локально и отправляются автоматически при восстановлении связи.

### Message Status
- **sent** - Сообщение создано и отправлено на сервер
- **delivered** - Получено хотя бы одним участником
- **read** - Прочитано получателем

### Real-time Sync
WebSocket обеспечивает мгновенную доставку сообщений и синхронизацию статусов.

## 🚨 Error Handling

Все ошибки возвращаются в формате:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "BadRequest"
}
```

## 📝 Notes

- Без шифрования (E2E)
- Без поддержки видео
- Максимум 50 сообщений за раз
- TypeORM автоматически создаёт таблицы в режиме development

## 🔧 Deployment

Для production:

1. Создай `.env` с переменными
2. Запусти миграции TypeORM
3. Сбилдь проект: `npm run build`
4. Запусти: `npm run start:prod`

## 📞 Support

Для вопросов по архитектуре или implementation - смотри комментарии в коде.

---

**Готово к использованию!** 🎉
