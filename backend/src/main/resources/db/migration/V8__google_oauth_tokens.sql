-- Google OAuth tokens per company (GA4 bağlantısı için)
CREATE TABLE google_oauth_tokens (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id     UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    access_token   TEXT NOT NULL,
    refresh_token  TEXT NOT NULL,
    token_expiry   TIMESTAMPTZ NOT NULL,
    scope          TEXT,
    ga_property_id VARCHAR(50),
    connected_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_google_oauth_tokens_company ON google_oauth_tokens(company_id);
