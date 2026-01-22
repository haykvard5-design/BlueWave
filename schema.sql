-- Create ENUM types
CREATE TYPE chat_type AS ENUM ('private', 'group');
CREATE TYPE user_status AS ENUM ('online', 'offline', 'away');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    bio TEXT,
    status user_status DEFAULT 'offline',
    last_seen TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Chats table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    type chat_type NOT NULL,
    avatar VARCHAR(500),
    is_archived BOOLEAN DEFAULT false,
    creator_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chats_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes on chats
CREATE INDEX idx_chats_type ON chats(type);
CREATE INDEX idx_chats_is_archived ON chats(is_archived);
CREATE INDEX idx_chats_creator_id ON chats(creator_id);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);

-- Chat members junction table
CREATE TABLE chat_members_users (
    chat_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (chat_id, user_id),
    CONSTRAINT fk_chat_members_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes on chat_members_users
CREATE INDEX idx_chat_members_user_id ON chat_members_users(user_id);
CREATE INDEX idx_chat_members_chat_id ON chat_members_users(chat_id);

-- Chat members metadata table
CREATE TABLE chat_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL,
    user_id UUID NOT NULL,
    unread_count INT DEFAULT 0,
    last_read_message_id UUID,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_member_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_chat_member UNIQUE (chat_id, user_id)
);

-- Create indexes on chat_members
CREATE INDEX idx_chat_member_chat_id ON chat_members(chat_id);
CREATE INDEX idx_chat_member_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_member_unread ON chat_members(unread_count) WHERE unread_count > 0;

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    type message_type NOT NULL DEFAULT 'text',
    media_url VARCHAR(500),
    file_name VARCHAR(255),
    status message_status DEFAULT 'sent',
    reply_to_id UUID,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes on messages
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC) WHERE is_deleted = false;

-- Offline queue table
CREATE TABLE offline_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    chat_id UUID NOT NULL,
    content TEXT NOT NULL,
    type message_type NOT NULL,
    media_url VARCHAR(500),
    file_name VARCHAR(255),
    temp_id VARCHAR(255),
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_offline_queue_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_offline_queue_chat FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- Create indexes on offline_queue
CREATE INDEX idx_offline_queue_user_id ON offline_queue(user_id);
CREATE INDEX idx_offline_queue_chat_id ON offline_queue(chat_id);
CREATE INDEX idx_offline_queue_created_at ON offline_queue(created_at ASC);

-- Add trigger for updating updated_at on users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
