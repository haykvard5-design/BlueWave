# 🌊 Bluewave Messenger - Complete Backend Implementation

> **Professional-grade NestJS backend for Android messenger** | Production-ready | Fully documented | WebSocket real-time | PostgreSQL | JWT Auth

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![NestJS](https://img.shields.io/badge/Framework-NestJS%2010-red)
![TypeScript](https://img.shields.io/badge/Language-TypeScript%205-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2014-336791)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📚 Documentation

Choose what you need:

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **[QUICKREF.md](./QUICKREF.md)** | 📌 Quick reference card | 2 min |
| **[QUICKSTART.md](./QUICKSTART.md)** | ⚡ 5-minute setup | 5 min |
| **[README.md](./README.md)** | 📖 Full API documentation | 15 min |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 🏗️ System design & flows | 20 min |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | 🚀 Production deployment | 15 min |
| **[CHECKLIST.md](./CHECKLIST.md)** | ✅ Implementation checklist | 10 min |
| **[SUMMARY.md](./SUMMARY.md)** | 📋 Complete overview | 10 min |

---

## 🚀 Quick Start (3 steps)

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Run (with Docker PostgreSQL)
docker-compose up -d && npm run start:dev
```

**API running on:** `http://localhost:3000` ✅

---

## ✨ Features Implemented

### 🔐 Authentication
- Register with email or phone
- Login with JWT tokens (24h expiration)
- Bcrypt password hashing
- Protected routes with guards

### 👥 User Management
- User profiles with avatars
- Search users by username
- Online/offline status tracking
- User presence detection

### 💬 Chat Management
- Private 1-to-1 chats
- Group chats
- Member management
- Chat archiving
- Unread message count

### 📨 Messaging
- Text, image, and file messages
- Message status: sent → delivered → read
- Message deletion (soft delete)
- Message sync & pagination
- Offline message queue

### 🔌 Real-time Features
- WebSocket with Socket.io
- Typing indicators
- Real-time message broadcasting
- User presence notifications
- Data synchronization
- Automatic reconnection

### 🛡️ Security
- JWT authentication
- Input validation & sanitization
- SQL injection prevention (TypeORM)
- CORS protection
- Password hashing (bcrypt)

---

## 📦 Project Structure

```
bluewave/
├── src/
│   ├── modules/
│   │   ├── auth/           # Authentication & JWT
│   │   ├── users/          # User profiles & search
│   │   ├── chats/          # Chat management
│   │   ├── messages/       # Message handling & offline queue
│   │   └── websocket/      # Real-time Socket.io gateway
│   ├── config/             # Database configuration
│   ├── main.ts             # Application entry point
│   └── app.module.ts       # Root module
│
├── schema.sql              # PostgreSQL schema with indexes
├── docker-compose.yml      # Docker setup
├── package.json            # Dependencies
├── .env.example            # Environment template
│
├── 📄 QUICKREF.md          # Quick reference card
├── 📄 QUICKSTART.md        # 5-minute setup guide
├── 📄 README.md            # API documentation
├── 📄 ARCHITECTURE.md      # System design
├── 📄 DEPLOYMENT.md        # Production deployment
├── 📄 SUMMARY.md           # Implementation overview
└── 📄 CHECKLIST.md         # Feature checklist
```

---

## 🛠️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | NestJS | 10.3.0 |
| **Language** | TypeScript | 5.3.3 |
| **Database** | PostgreSQL | 14+ |
| **ORM** | TypeORM | 0.3.19 |
| **Real-time** | Socket.io | 4.7.2 |
| **Authentication** | JWT + Passport | Latest |
| **Validation** | class-validator | 0.14.0 |
| **Hashing** | bcrypt | 5.1.1 |

---

## 📡 API Overview

### 20 REST Endpoints
- 2 Authentication endpoints
- 5 User management endpoints
- 7 Chat management endpoints
- 6 Message endpoints

### 18 WebSocket Events
- 9 Client → Server events
- 9 Server → Client events

See [README.md](./README.md) for complete API reference.

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User accounts with status & profile |
| `chats` | Chat metadata (private/group) |
| `chat_members_users` | Many-to-many user-chat relationship |
| `chat_members` | Member metadata (unread count) |
| `messages` | Message storage with full lifecycle |
| `offline_queue` | Offline message queue |

All tables have optimized indexes for production.

---

## 🔑 Quick API Examples

### Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "username": "johndoe"
  }'
```

### Send Message
```bash
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "chat-id",
    "content": "Hello!",
    "type": "text"
  }'
```

### WebSocket (JavaScript)
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});

// Send message in real-time
socket.emit('message:send', {
  chatId: 'chat-id',
  content: 'Hello from WebSocket!',
  type: 'text'
});

// Listen for incoming messages
socket.on('chat:chat-id:message', (message) => {
  console.log('New message:', message);
});
```

See [README.md](./README.md) for complete API documentation.

---

## 🚀 Deployment Options

### Quick Deployments
- **Heroku** - `git push heroku main` (See [DEPLOYMENT.md](./DEPLOYMENT.md))
- **DigitalOcean App Platform** - Connect GitHub repo
- **Railway** - Point to GitHub, auto-deploy

### Full Deployments
- **AWS EC2 + RDS** - Complete setup guide
- **Docker Compose** - Production-ready compose file
- **Kubernetes** - Ready for K8s deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides.

---

## 🧪 Testing

### Postman Collection
```bash
# Import Postman collection for API testing
# File: Bluewave_Messenger.postman_collection.json
```

### Run Tests
```bash
npm test                # Run all tests
npm run test:cov        # With coverage
npm run test:watch      # Watch mode
```

### Unit Tests Included
- Auth service tests
- Chat service tests
- Ready to extend for all modules

---

## 🔒 Security Features

✅ **JWT Authentication** - Stateless token-based auth
✅ **Bcrypt Hashing** - 10-round password hashing
✅ **Input Validation** - class-validator DTOs
✅ **SQL Injection Prevention** - TypeORM parameterized queries
✅ **CORS Configuration** - Whitelist enabled
✅ **Access Guards** - Protected routes
✅ **Membership Verification** - User ownership checks
✅ **Rate Limiting** - Ready to implement

---

## 📈 Performance Features

- ✅ **Database Indexes** - All frequently queried columns
- ✅ **Connection Pooling** - TypeORM pool size 20
- ✅ **Pagination** - Message list pagination
- ✅ **WebSocket Rooms** - Room-based broadcasting (not global)
- ✅ **Efficient Queries** - Optimized SELECT with relations

---

## 📱 Mobile Integration

WebSocket client SDK included: [websocket-client.ts](./websocket-client.ts)

Example for Kotlin/Android:
```kotlin
// Use the provided TypeScript/JavaScript SDK as reference
// Implement similar logic in Kotlin using:
// - OkHttp for HTTP
// - Socket.io-client-java for WebSocket
// - Room database for local storage
// - WorkManager for offline queue
```

---

## 🎓 What You Get

✅ **Complete Backend** - 2000+ lines of production code
✅ **Full Type Safety** - TypeScript with strict mode
✅ **Comprehensive Docs** - 7 documentation files
✅ **Real-time Ready** - WebSocket with Socket.io
✅ **Offline Support** - Message queue implementation
✅ **Security** - JWT + Bcrypt + Input validation
✅ **Database** - PostgreSQL schema with indexes
✅ **Docker Ready** - Docker Compose for quick setup
✅ **Test Ready** - Jest tests included
✅ **Deploy Ready** - Multiple deployment guides

---

## 🔄 Message Flow Architecture

```
Client                 WebSocket              Database
  │                       │                       │
  ├─ message:send ───────>│ Validate & Create ────>│
  │                       │ (return messageId)     │
  │<─ success ────────────┤                        │
  │                       ├─ Broadcast to room ───>│ (Other users)
  │                       │                        │
  ├─ message:status ─────>│ Update Status ────────>│
  │   (mark as read)      │ (sent→delivered→read)  │
  │<─ statusUpdated ──────┤                        │
```

---

## 🛠️ Common Commands

```bash
# Development
npm run start:dev          # Start with auto-reload
npm run build              # Build TypeScript
npm test                   # Run tests

# Production
npm run start:prod         # Run compiled version
npm run build              # Build for production

# Docker
docker-compose up -d       # Start services
docker-compose down        # Stop services
docker-compose logs -f     # View logs

# Database
npm run typeorm migration:run   # Run migrations
npm run typeorm migration:generate   # Generate migration
```

---

## 📊 File Overview

| File | Lines | Purpose |
|------|-------|---------|
| auth.service.ts | 60 | JWT & password handling |
| chats.service.ts | 150 | Chat management logic |
| messages.service.ts | 120 | Message handling & sync |
| websocket.gateway.ts | 200 | Real-time events |
| schema.sql | 150 | Database structure |
| Total | 2000+ | Production-ready code |

---

## 🚨 Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/))
- **npm** or **yarn**
- **Docker** (optional, for easy PostgreSQL setup)

---

## 📝 Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=bluewave_messenger

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400

# Server
PORT=3000
NODE_ENV=development

# Optional
FIREBASE_PROJECT_ID=your-project-id
AWS_ACCESS_KEY_ID=your-key
```

---

## 🎯 Success Criteria

After setup, verify:
- ✅ Server starts on port 3000
- ✅ POST /auth/register works
- ✅ POST /auth/login returns token
- ✅ Protected endpoints require token
- ✅ WebSocket connects with valid token
- ✅ Messages broadcast to subscribers

See [QUICKSTART.md](./QUICKSTART.md) for verification steps.

---

## 📞 Need Help?

- **Getting Started?** → Read [QUICKSTART.md](./QUICKSTART.md)
- **API Reference?** → Check [README.md](./README.md)
- **System Design?** → See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Ready to Deploy?** → Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick Lookup?** → Use [QUICKREF.md](./QUICKREF.md)
- **Check Progress?** → Review [CHECKLIST.md](./CHECKLIST.md)

---

## 🎉 Ready to Build!

You have a complete, professional-grade backend for your Android messenger.

**Next Step:** Build the Android client in Kotlin! 📱

---

## 📜 License

MIT License - Use freely for your projects

---

## 👨‍💻 Built With ❤️

Created as a complete reference implementation for building scalable messenger backends.

**Start reading:** [QUICKSTART.md](./QUICKSTART.md) or [QUICKREF.md](./QUICKREF.md)

**Ready to code?** `npm run start:dev` 🚀

---

_Last Updated: January 22, 2026_  
_Version: 1.0.0_  
_Status: ✅ Production Ready_
