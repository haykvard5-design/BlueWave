# BlueWave Messenger Backend

Advanced Telegram-like messenger backend built with **NestJS 11**, **PostgreSQL**, and **WebSocket** (Socket.IO).

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 12+
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bluewave
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database and JWT secret:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=bluewave_messenger
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   PORT=3000
   ```

4. **Create PostgreSQL database**
   ```bash
   createdb bluewave_messenger
   ```
   
   Or using psql:
   ```sql
   CREATE DATABASE bluewave_messenger;
   ```

5. **Run the application**
   ```bash
   npm run start:dev
   ```

   The server will start on `http://localhost:3000` (or your configured PORT).

## 📋 Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server (requires build first)
- `npm run lint` - Run ESLint and fix issues
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage

## 🏗️ Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── config/
│   └── database.config.ts  # TypeORM database configuration
└── modules/
    ├── auth/               # Authentication (JWT, Login, Register)
    ├── users/              # User management
    ├── chats/              # Chat management (private, group)
    ├── messages/           # Messages and offline queue
    └── websocket/          # WebSocket Gateway (real-time events)
```

## 🔌 API Endpoints

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

- `GET /users/me` - Get current user profile
- `GET /users/:id` - Get user by ID
- `GET /users/search?q=username` - Search users
- `PUT /users/me` - Update profile
- `PUT /users/:id/status` - Update user status

### Chats

- `POST /chats/private` - Create private chat
- `POST /chats/group` - Create group chat
- `GET /chats` - Get all user chats
- `GET /chats/:id` - Get chat by ID
- `PUT /chats/:id` - Update chat
- `POST /chats/:id/members` - Add member
- `DELETE /chats/:id/members/:memberId` - Remove member
- `PUT /chats/:id/archive` - Archive chat

### Messages

- `POST /messages` - Send message
- `GET /messages/chat/:chatId` - Get chat messages (paginated)
- `GET /messages/:id` - Get message by ID
- `PUT /messages/:id/status` - Update message status
- `PUT /messages/:id/read` - Mark as read
- `DELETE /messages/:id` - Delete message (soft delete)
- `GET /messages/sync/data` - Sync messages

## 🔌 WebSocket Events

### Client → Server

- `message:send` - Send a message
- `message:status` - Update message status
- `chat:subscribe` - Subscribe to chat room
- `chat:unsubscribe` - Unsubscribe from chat room
- `typing:start` / `typing:stop` - Typing indicators
- `user:status` - Update user status
- `sync:request` - Request message synchronization

### Server → Client

- `chat:{chatId}:message` - New message in chat
- `message:statusUpdated` - Message status updated
- `typing:start` / `typing:stop` - Typing indicator
- `user-online` / `user-offline` - User presence
- `sync:response` - Sync data response
- `offline-queue:items` - Offline queue items

## 🔐 Authentication

All protected endpoints require a **JWT token** in the Authorization header:

```
Authorization: Bearer <access_token>
```

For WebSocket connections, pass the token in the handshake:

```javascript
socket.connect({
  auth: {
    token: 'your-jwt-token'
  }
});
```

## 💾 Database

The project uses **TypeORM** with PostgreSQL. In development mode, tables are automatically synchronized. For production, use migrations.

### Schema Overview

- **users** - User accounts with online/offline status
- **chats** - Private and group chats
- **chat_members** - Chat membership with unread counters
- **messages** - Messages with status (sent/delivered/read)
- **offline_queue** - Queue for offline message delivery

## 🛠️ Technologies

- **NestJS 11** - Progressive Node.js framework
- **TypeORM** - ORM for TypeScript
- **PostgreSQL** - Relational database
- **Socket.IO** - WebSocket library
- **Passport** - Authentication middleware
- **JWT** - JSON Web Tokens
- **bcrypt** - Password hashing
- **class-validator** - DTO validation

## 📝 Development Notes

- TypeORM `synchronize` is enabled in development (auto-creates tables)
- JWT tokens expire in 24 hours by default (configurable via `JWT_EXPIRATION`)
- WebSocket connections are authenticated via JWT in handshake
- Messages support soft delete (isDeleted flag)
- Offline queue system for message delivery when users are offline

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production` in `.env`
2. Disable TypeORM `synchronize` (use migrations)
3. Set a strong `JWT_SECRET`
4. Configure proper CORS origins
5. Build the project: `npm run build`
6. Start: `npm run start:prod`

## 📄 License

MIT

---

**Ready to use!** 🎉
