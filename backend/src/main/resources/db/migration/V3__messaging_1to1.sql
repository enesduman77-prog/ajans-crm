-- Drop old tables
DROP TABLE IF EXISTS thread_participants CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_thread_id;
-- Just in case it has a generic name
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_thread_id_fkey;

DROP TABLE IF EXISTS message_threads CASCADE;

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES user_profiles(id),
    user2_id UUID NOT NULL REFERENCES user_profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_conversations_users UNIQUE (user1_id, user2_id),
    CONSTRAINT chk_conversations_user_order CHECK (user1_id < user2_id)
);

-- Delete old messages since they were associated with threads
DELETE FROM messages;

-- Alter messages table
ALTER TABLE messages DROP COLUMN thread_id;
ALTER TABLE messages ADD COLUMN conversation_id UUID NOT NULL REFERENCES conversations(id);
ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT false;
