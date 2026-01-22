# 🏗️ Architecture Documentation - Bluewave Messenger

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Android    │  │   Web Client │  │    Desktop   │  │
│  │   (Kotlin)   │  │  (TypeScript)│  │   (Electron) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┼──────────────────┘          │
│                           │                             │
│                    REST API + WebSocket                 │
└───────────────────────────┼─────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────┐
│                 NestJS Backend Layer                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Controllers Layer                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │
│  │  │ Auth     │ │ Users    │ │ Chats/Messages   │ │  │
│  │  │ Controller│ │Controller│ │ Controllers      │ │  │
│  │  └──────┬───┘ └──────┬───┘ └──────┬───────────┘ │  │
│  └─────────┼────────────┼─────────────┼──────────────┘  │
│            │            │             │                 │
│  ┌─────────▼────────────▼─────────────▼──────────────┐  │
│  │              Services Layer                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │  │
│  │  │ Auth     │ │ Users    │ │ Chats/Messages   │ │  │
│  │  │ Service  │ │ Service  │ │ Services         │ │  │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │  │
│  └─────────────────────────────────────────────────┘  │
│            │                                           │
│  ┌─────────▼─────────────────────────────────────┐  │
│  │      WebSocket Gateway (Socket.io)           │  │
│  │  ┌──────────────────────────────────────────┐ │  │
│  │  │ Real-time Message Broadcasting           │ │  │
│  │  │ Presence Management (Online/Offline)     │ │  │
│  │  │ Typing Indicators                        │ │  │
│  │  │ Synchronization                          │ │  │
│  │  └──────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────┬──────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────┐
│              Data Layer (TypeORM)                   │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │    PostgreSQL Database                       │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ users    │ │ chats    │ │ messages     │ │ │
│  │  │ table    │ │ table    │ │ table        │ │ │
│  │  └──────────┘ └──────────┘ └──────────────┘ │ │
│  │  ┌──────────┐ ┌──────────────────────────┐ │ │
│  │  │ chat_    │ │ offline_queue           │ │ │
│  │  │ members  │ │ table                   │ │ │
│  │  └──────────┘ └──────────────────────────┘ │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
bluewave-messenger-backend/
├── src/
│   ├── main.ts                          # Entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── config/
│   │   └── database.config.ts           # Database configuration
│   │
│   ├── modules/
│   │   ├── auth/                        # Authentication Module
│   │   │   ├── auth.controller.ts       # Routes
│   │   │   ├── auth.service.ts          # Business logic
│   │   │   ├── auth.module.ts           # Module configuration
│   │   │   ├── dto/
│   │   │   │   └── auth.dto.ts          # Data Transfer Objects
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts      # JWT strategy for Passport
│   │   │   └── guards/
│   │   │       └── jwt-auth.guard.ts    # JWT authentication guard
│   │   │
│   │   ├── users/                       # Users Module
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   ├── dto/
│   │   │   │   └── user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts       # User database entity
│   │   │
│   │   ├── chats/                       # Chats Module
│   │   │   ├── chats.controller.ts
│   │   │   ├── chats.service.ts
│   │   │   ├── chats.module.ts
│   │   │   ├── dto/
│   │   │   │   └── chat.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── chat.entity.ts
│   │   │   │   └── chat-member.entity.ts
│   │   │   └── chats.service.spec.ts   # Tests
│   │   │
│   │   ├── messages/                    # Messages Module
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.service.ts
│   │   │   ├── messages.module.ts
│   │   │   ├── dto/
│   │   │   │   └── message.dto.ts
│   │   │   └── entities/
│   │   │       ├── message.entity.ts
│   │   │       └── offline-queue.entity.ts
│   │   │
│   │   └── websocket/                   # WebSocket Module
│   │       ├── websocket.gateway.ts     # Socket.io gateway
│   │       └── websocket.module.ts
│   │
│   └── common/                          # Shared code
│       ├── decorators/
│       ├── filters/
│       └── middleware/
│
├── schema.sql                           # PostgreSQL schema
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── .env.example                         # Environment variables template
├── docker-compose.yml                   # Docker setup
├── README.md                            # Documentation
├── DEPLOYMENT.md                        # Deployment guide
└── websocket-client.ts                  # Client SDK example
```

## 🔐 Authentication Flow

```
Client Request
    ↓
[JWT Guard] - Verify token from Authorization header
    ↓
JWT Strategy Verification
    ↓
Extract user ID & email from JWT payload
    ↓
[AuthGuard('jwt')] - Passed to controller
    ↓
Controller Method Execution
    ↓
Response
```

## 💬 Message Flow

### Sending Message
```
Client                          WebSocket Gateway              Database
   │                                 │                              │
   ├──── message:send event ────────>│                              │
   │     {chatId, content, ...}      │                              │
   │                                 ├─────── Create Message ──────>│
   │                                 │        (TypeORM)             │
   │                                 │<────── Message Object ───────┤
   │<──── message response ──────────┤                              │
   │     {messageId, tempId}         │                              │
   │                                 ├─ Broadcast to chat members ─>│ (All other clients)
   │                                 │ via room "chat:chatId"       │
```

### Message Status Updates
```
Client                      WebSocket Gateway           Database
   │                             │                         │
   ├── message:status event ────>│                         │
   │   {messageId, status}       │                         │
   │                             ├─ Update Status ───────>│
   │                             │  (sent→delivered→read)  │
   │                             │                         │
   │<──── statusUpdated event ───┤                         │
   │      (all chat members)     │                         │
```

## 📊 Data Models

### User Entity
```
- id: UUID (PK)
- email: String (Unique)
- phone: String (Unique, Optional)
- username: String
- passwordHash: String (bcrypt)
- avatar: String (URL)
- bio: String
- status: Enum (online | offline | away)
- lastSeen: DateTime
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

### Chat Entity
```
- id: UUID (PK)
- name: String (Optional, for groups)
- type: Enum (private | group)
- avatar: String (Optional)
- isArchived: Boolean
- creatorId: UUID (FK to User)
- createdAt: DateTime
- updatedAt: DateTime
- members: User[] (Many-to-Many)
- messages: Message[]
```

### Message Entity
```
- id: UUID (PK)
- chatId: UUID (FK)
- senderId: UUID (FK to User)
- content: String
- type: Enum (text | image | file)
- mediaUrl: String (Optional)
- fileName: String (Optional)
- status: Enum (sent | delivered | read)
- replyToId: UUID (Optional)
- isEdited: Boolean
- isDeleted: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

### ChatMember Entity
```
- id: UUID (PK)
- chatId: UUID (FK)
- userId: UUID (FK)
- unreadCount: Integer
- lastReadMessageId: UUID
- joinedAt: DateTime
```

### OfflineQueue Entity
```
- id: UUID (PK)
- userId: UUID (FK)
- chatId: UUID (FK)
- content: String
- type: Enum (text | image | file)
- mediaUrl: String (Optional)
- fileName: String (Optional)
- tempId: String (For client tracking)
- retryCount: Integer
- createdAt: DateTime
```

## 🔌 API Endpoints

### Auth Endpoints
```
POST   /auth/register          - Register new user
POST   /auth/login             - Login user
```

### User Endpoints
```
GET    /users/me               - Get current user profile
GET    /users/:id              - Get user by ID
GET    /users/search?q=query   - Search users
PUT    /users/me               - Update profile
PUT    /users/:id/status       - Update user status
```

### Chat Endpoints
```
POST   /chats/private          - Create private chat
POST   /chats/group            - Create group chat
GET    /chats                  - Get user's chats
GET    /chats/:id              - Get chat by ID
PUT    /chats/:id              - Update chat
POST   /chats/:id/members      - Add member
DELETE /chats/:id/members/:id  - Remove member
PUT    /chats/:id/archive      - Archive chat
```

### Message Endpoints
```
POST   /messages               - Send message
GET    /messages/chat/:id      - Get chat messages
GET    /messages/:id           - Get message by ID
PUT    /messages/:id/status    - Update message status
PUT    /messages/:id/read      - Mark as read
DELETE /messages/:id           - Delete message
GET    /messages/sync/data     - Sync messages
```

## 🔌 WebSocket Events

### Client → Server
```
message:send           - Send new message
message:status         - Update message status
chat:subscribe         - Subscribe to chat updates
chat:unsubscribe       - Unsubscribe from chat
typing:start          - Start typing indicator
typing:stop           - Stop typing indicator
user:status           - Change user status
sync:request          - Request data sync
offline-queue:sync    - Sync offline messages
```

### Server → Client
```
chat:[chatId]:message    - New message in chat
message:statusUpdated    - Message status changed
typing:start             - User started typing
typing:stop              - User stopped typing
user-online              - User came online
user-offline             - User went offline
sync:response            - Sync data response
offline-queue:items      - Offline queue items
```

## 🔄 Synchronization Logic

### Message Sync
1. Client sends `sync:request` with `lastSyncTime`
2. Server queries all messages created after `lastSyncTime`
3. Server returns up to 100 messages
4. Client merges with local database
5. Client updates `lastSyncTime`

### Offline Queue
1. Message fails to send (network error)
2. Message saved to local offline queue
3. When connection restored, client sends `offline-queue:sync`
4. Server returns pending queue items
5. Client retries sending in order
6. Server confirms each message

## 🛡️ Security Layers

### Input Validation
- class-validator for DTO validation
- Whitelist and sanitization
- Max length enforced

### Authentication
- JWT tokens with 24h expiration
- Bcrypt password hashing (10 rounds)
- Token refresh mechanism (optional)

### Authorization
- Route guards for protected endpoints
- Chat membership verification
- User ownership verification for data

### Database
- Parameterized queries (TypeORM)
- Foreign key constraints
- Index optimization
- Transaction support

## 🎯 Performance Optimizations

### Database
```sql
-- Indexes on frequently queried columns
CREATE INDEX idx_messages_chat_created 
  ON messages(chat_id, created_at DESC);

-- Pagination with LIMIT/OFFSET
SELECT * FROM messages WHERE chat_id = ? 
  ORDER BY created_at DESC LIMIT 50 OFFSET 0;
```

### Caching
- Redis for user presence (optional)
- In-memory cache for user lookups
- Socket.io room optimization

### WebSocket
- Room-based broadcasting (not global)
- Acknowledgment messages for reliability
- Connection pooling

## 📈 Scalability Considerations

### Horizontal Scaling
```
Load Balancer
    ↓
┌───┬───┬───┐
│API│API│API│  (Multiple instances)
└───┴───┴───┘
    ↓
Shared Database (RDS)
    ↓
    Redis (Session store, optional)
```

### WebSocket Clustering
- Use Socket.io adapter (Redis/RabbitMQ)
- Sticky sessions for load balancer
- Pub/sub for inter-server communication

### Database Optimization
- Connection pooling
- Read replicas for heavy read workloads
- Partitioning by chat/user ID (future)
- Archive old messages

## 🔧 Development Guidelines

### Code Organization
- One entity per file
- Services handle business logic
- Controllers handle HTTP/WebSocket
- DTOs for data validation

### Testing Strategy
- Unit tests for services
- Integration tests for API
- Mock database for testing
- WebSocket testing with mock Socket.io

### Error Handling
```typescript
try {
  // Business logic
} catch (error) {
  if (error instanceof NotFoundException) {
    throw new NotFoundException('Resource not found');
  }
  throw new InternalServerErrorException('Internal server error');
}
```

## 📝 Summary

**Bluewave** - это масштабируемая архитектура мессенджера, построенная на:
- ✅ NestJS (production-ready framework)
- ✅ TypeORM (type-safe database)
- ✅ WebSocket (real-time communication)
- ✅ JWT (stateless authentication)
- ✅ PostgreSQL (ACID compliance)

Готово к deployment на Heroku, AWS, DigitalOcean, или любом Linux сервере! 🚀
