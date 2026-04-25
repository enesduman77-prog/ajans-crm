-- V29: Approval requests table — unified request tracking for content, shoots, tasks, meetings
CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(30) NOT NULL,
    reference_id UUID,
    company_id UUID NOT NULL REFERENCES companies(id),
    requested_by UUID NOT NULL REFERENCES user_profiles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    title VARCHAR(500) NOT NULL,
    description TEXT,
    metadata TEXT,
    reviewed_by UUID REFERENCES user_profiles(id),
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_company ON approval_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_type ON approval_requests(type);
