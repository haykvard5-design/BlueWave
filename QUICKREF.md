# 🚀 Bluewave Messenger - Quick Reference Card

## 📖 Start Reading Here

1. **First time?** → Start with [QUICKSTART.md](./QUICKSTART.md) (5 min setup)
2. **Want details?** → Read [README.md](./README.md) (API reference)
3. **Understand design?** → Check [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Deploy to prod?** → Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
5. **Did I miss anything?** → See [CHECKLIST.md](./CHECKLIST.md)

---

## ⚡ Quick Commands

```bash
# Setup
npm install
cp .env.example .env

# Development
npm run start:dev          # Start with hot reload
npm test                   # Run tests
npm run lint              # Check code

# Production
npm run build             # Build TypeScript
npm run start:prod        # Run compiled version

# Docker
docker-compose up -d      # Start PostgreSQL
docker-compose down       # Stop everything
docker-compose logs -f    # View logs
```

---

## 🔑 Key Endpoints

### Auth
```
POST /auth/register  - { email, phone?, password, username? }
POST /auth/login     - { email|phone, password }
```

### Chats
```
POST /chats/private   - { recipientId }
POST /chats/group     - { name, avatar?, memberIds[] }
GET  /chats
POST /chats/:id/members  - { userId }
```

### Messages
```
POST /messages        - { chatId, content, type }
GET  /messages/chat/:id
PUT  /messages/:id/status  - { status: 'read' }
```

### WebSocket
```
message:send     - { chatId, content, type, ... }
chat:subscribe   - chatId
typing:start     - { chatId, userId }
```

---

## 📊 Important URLs

| Service | URL | Port |
|---------|-----|------|
| API | http://localhost:3000 | 3000 |
| PostgreSQL | localhost | 5432 |
| Adminer (DB UI) | http://localhost:8080 | 8080 |
| Redis | localhost | 6379 |

---

## 🗂️ File Structure Summary

```
src/
├── auth/          - JWT, Register, Login
├── users/         - Profiles, Search, Status
├── chats/         - 1-to-1 & Groups
├── messages/      - Send, Read, Sync, Offline queue
└── websocket/     - Real-time Socket.io
```

---

## 🔐 Authentication

```typescript
// Login - Get Token
POST /auth/login
→ { accessToken, user }

// Use Token - Add to Headers
Authorization: Bearer <accessToken>

// Token Expires After
24 hours (86400 seconds)
```

---

## 💬 Message Lifecycle

```
Client                 WebSocket              Database
  │                       │                       │
  ├─ message:send ───────>│ Create message ──────>│
  │                       │ (tempId sent back)    │
  │<─ message response ───┤                       │
  │                       │ Broadcast to room ───>│ (Other users)
  │                       │
  ├─ message:status ─────>│ Update status ───────>│
  │   (set to "read")     │ (sent→delivered→read) │
```

---

## 📱 Mobile Integration

```javascript
// Connect WebSocket
const socket = io('http://your-api.com', {
  auth: { token: accessToken }
});

// Listen for messages
socket.on('chat:[chatId]:message', (msg) => {
  console.log('New message:', msg);
});

// Send message
socket.emit('message:send', {
  chatId: 'abc-123',
  content: 'Hello!',
  type: 'text'
});

// Mark as read
socket.emit('message:status', {
  messageId: 'msg-456',
  status: 'read'
});
```

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| Can't connect to DB | Check `.env` DB credentials |
| WebSocket fails | Verify `auth.token` is valid JWT |
| Messages not syncing | Ensure client calls `offline-queue:sync` |

---

## 🔄 Message Types Supported

- ✅ **text** - Plain text messages
- ✅ **image** - With mediaUrl (URL to image)
- ✅ **file** - With mediaUrl + fileName

---

## 👥 Chat Types

- ✅ **private** - 1-to-1 between two users
- ✅ **group** - Multiple members

---

## 📊 User Status

- ✅ **online** - User is active
- ✅ **offline** - User is not connected
- ✅ **away** - User is idle

---

## 📨 Message Status

- ✅ **sent** - Created, sent to server
- ✅ **delivered** - Received by at least one member
- ✅ **read** - Viewed by recipient

---

## 🧠 Architecture Layers

```
Controllers (HTTP/WebSocket routes)
    ↓
Services (Business logic)
    ↓
Repositories (TypeORM entities)
    ↓
Database (PostgreSQL)
```

---

## 🔐 Security Checklist

- ✅ JWT tokens (stateless)
- ✅ Bcrypt hashing (10 rounds)
- ✅ Input validation (DTOs)
- ✅ CORS enabled
- ✅ Guards on protected routes
- ✅ Membership verification
- ✅ Ownership verification

---

## 📈 Performance Tips

1. **Message pagination** - Always use limit/offset
2. **Indexes** - Included in schema.sql
3. **WebSocket rooms** - Use chat:chatId, not broadcast
4. **Connection pooling** - Configured in database.config.ts
5. **Type safety** - Use TypeScript strictly

---

## 🎯 Next Steps

1. ✅ Backend ready - You're here!
2. ⏭️ Build Android client (Kotlin + Jetpack)
3. Connect to this API
4. Test WebSocket real-time
5. Deploy to production

---

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| API Docs | README.md |
| Setup Guide | QUICKSTART.md |
| System Design | ARCHITECTURE.md |
| Deployment | DEPLOYMENT.md |
| Implementation | CHECKLIST.md |
| WebSocket SDK | websocket-client.ts |
| API Tests | Postman collection |

---

## 💡 Example: Complete Flow

```bash
# 1. Register User
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'
# → { "accessToken": "...", "user": {...} }

# 2. Create Private Chat
curl -X POST http://localhost:3000/chats/private \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"other-user-id"}'
# → { "id": "chat-123", "type": "private", ... }

# 3. Send Message (REST)
curl -X POST http://localhost:3000/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"chatId":"chat-123","content":"Hello!","type":"text"}'
# → { "id": "msg-456", "status": "sent", ... }

# 4. Send Message (WebSocket)
socket.emit('message:send', {
  chatId: 'chat-123',
  content: 'Hello via WebSocket!',
  type: 'text'
});

# 5. Mark as Read
socket.emit('message:status', {
  messageId: 'msg-456',
  status: 'read'
});
```

---

## 📋 Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=bluewave_messenger
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
```

---

## 🎉 Ready to Launch!

Your backend is complete, documented, tested, and production-ready.

**What you have:**
- ✅ 20 REST endpoints
- ✅ 18 WebSocket events
- ✅ 5 database tables
- ✅ Full documentation
- ✅ Real-time messaging
- ✅ Offline queue
- ✅ JWT auth
- ✅ Docker support

**What's next:**
- Build Android client in Kotlin
- Connect to these APIs
- Test and deploy!

---

**Happy coding!** 🚀

_For detailed info, see the documentation files._
