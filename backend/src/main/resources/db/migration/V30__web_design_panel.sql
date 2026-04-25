-- Web Tasarım hizmeti analitik paneli için tablolar ve sütunlar

-- 1) Şirket altyapı bilgileri
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS hosting_provider VARCHAR(255),
    ADD COLUMN IF NOT EXISTS domain_expiry DATE,
    ADD COLUMN IF NOT EXISTS ssl_expiry DATE,
    ADD COLUMN IF NOT EXISTS cms_type VARCHAR(255),
    ADD COLUMN IF NOT EXISTS cms_version VARCHAR(64),
    ADD COLUMN IF NOT EXISTS theme_name VARCHAR(255);

-- 2) Bakım günlüğü
CREATE TABLE maintenance_log_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(32) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    performed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_log_company_performed
    ON maintenance_log_entries (company_id, performed_at DESC);

-- 3) PageSpeed snapshot (24 saat cache)
CREATE TABLE pagespeed_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    strategy VARCHAR(16) NOT NULL,
    tested_url VARCHAR(512) NOT NULL,
    performance INTEGER,
    accessibility INTEGER,
    best_practices INTEGER,
    seo INTEGER,
    lcp_ms DOUBLE PRECISION,
    fid_ms DOUBLE PRECISION,
    cls_value DOUBLE PRECISION,
    tbt_ms DOUBLE PRECISION,
    fcp_ms DOUBLE PRECISION,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fetch_error TEXT,
    UNIQUE (company_id, strategy)
);
