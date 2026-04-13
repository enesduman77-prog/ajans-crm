CREATE TABLE instagram_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE,
    ig_user_id VARCHAR(50),
    ig_username VARCHAR(100),
    page_id VARCHAR(50),
    connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
