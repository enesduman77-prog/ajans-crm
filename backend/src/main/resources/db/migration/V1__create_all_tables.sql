-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('AGENCY', 'CLIENT')),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(255),
    tax_id VARCHAR(50),
    founded_year INTEGER,
    vision TEXT,
    mission TEXT,
    employee_count INTEGER,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(500),
    social_instagram VARCHAR(500),
    social_facebook VARCHAR(500),
    social_twitter VARCHAR(500),
    social_linkedin VARCHAR(500),
    social_youtube VARCHAR(500),
    social_tiktok VARCHAR(500),
    logo_url VARCHAR(500),
    notes TEXT,
    contract_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (contract_status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Persons table (CRM contacts)
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    position_title VARCHAR(255),
    department VARCHAR(255),
    address TEXT,
    birth_date DATE,
    likes TEXT,
    dislikes TEXT,
    notes TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (login users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID UNIQUE REFERENCES persons(id) ON DELETE SET NULL,
    global_role VARCHAR(20) NOT NULL CHECK (global_role IN ('ADMIN', 'AGENCY_STAFF', 'COMPANY_USER')),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company memberships (user <-> company link)
CREATE TABLE company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    membership_role VARCHAR(20) NOT NULL CHECK (membership_role IN ('OWNER', 'EMPLOYEE', 'AGENCY_STAFF')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, company_id)
);

-- Permission definitions (seed/reference data)
CREATE TABLE permission_definitions (
    key VARCHAR(100) PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL
);

-- Company permissions (per-user, per-company)
CREATE TABLE company_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL REFERENCES permission_definitions(key),
    level VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (level IN ('NONE', 'RESTRICTED', 'FULL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, company_id, permission_key)
);

-- Message threads
CREATE TABLE messages_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_type VARCHAR(20) NOT NULL CHECK (thread_type IN ('COMPANY_GROUP', 'DIRECT_MESSAGE')),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    subject VARCHAR(500),
    is_official_channel BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread participants
CREATE TABLE thread_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES messages_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (thread_id, user_id)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES messages_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    is_approval_pending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message read receipts
CREATE TABLE message_read_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (message_id, user_id)
);

-- Approval requests
CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES user_profiles(id),
    approver_id UUID REFERENCES user_profiles(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    permission_key VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_data JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    decided_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES user_profiles(id),
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(20) DEFAULT 'OTHER' CHECK (category IN ('REELS', 'BLOG', 'PAYLASIM', 'SEO', 'TASARIM', 'OTHER')),
    priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(20) DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'OVERDUE')),
    due_date TIMESTAMP WITH TIME ZONE,
    due_time TIME,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task reviews
CREATE TABLE task_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES user_profiles(id),
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    location VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'COMPLETED', 'CANCELLED')),
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    UNIQUE (meeting_id, user_id)
);

-- Shoots
CREATE TABLE shoots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    shoot_date TIMESTAMP WITH TIME ZONE,
    shoot_time TIME,
    location VARCHAR(500),
    status VARCHAR(20) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'COMPLETED', 'CANCELLED')),
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shoot_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shoot_id UUID NOT NULL REFERENCES shoots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_in_shoot VARCHAR(255),
    UNIQUE (shoot_id, user_id)
);

-- PR Projects
CREATE TABLE pr_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    purpose TEXT,
    total_phases INTEGER DEFAULT 1,
    current_phase INTEGER DEFAULT 1,
    progress_percent DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED')),
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pr_project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pr_projects(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE pr_project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pr_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    UNIQUE (project_id, user_id)
);

-- Notes
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    company_id UUID REFERENCES companies(id),
    content TEXT NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    note_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Satisfaction surveys
CREATE TABLE satisfaction_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
    survey_month DATE NOT NULL,
    submitted_by UUID NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_persons_company ON persons(company_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_memberships_user ON company_memberships(user_id);
CREATE INDEX idx_memberships_company ON company_memberships(company_id);
CREATE INDEX idx_permissions_user_company ON company_permissions(user_id, company_id);
CREATE INDEX idx_threads_company ON messages_threads(company_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_tasks_company ON tasks(company_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
