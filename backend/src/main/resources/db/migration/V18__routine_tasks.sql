-- Routine task definitions (templates created by admin)
CREATE TABLE routine_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    frequency       VARCHAR(20) NOT NULL,  -- DAILY, WEEKLY, MONTHLY
    day_of_week     INTEGER,               -- 1=Monday..7=Sunday (for WEEKLY)
    day_of_month    INTEGER,               -- 1..31 (for MONTHLY, 0=last day)
    execution_time  TIME,                  -- optional target time
    assigned_to_id  UUID REFERENCES user_profiles(id),       -- NULL = all staff
    category        VARCHAR(30) DEFAULT 'OTHER',
    priority        VARCHAR(20) DEFAULT 'MEDIUM',
    is_active       BOOLEAN DEFAULT TRUE,
    created_by_id   UUID NOT NULL REFERENCES user_profiles(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Routine completion log (tracks each period's completion)
CREATE TABLE routine_completions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id      UUID NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES user_profiles(id),
    period_key      VARCHAR(20) NOT NULL,  -- e.g. '2026-04-10', '2026-W15', '2026-04'
    completed_at    TIMESTAMPTZ DEFAULT now(),
    notes           TEXT,
    UNIQUE(routine_id, user_id, period_key)
);

CREATE INDEX idx_routine_tasks_assigned ON routine_tasks(assigned_to_id);
CREATE INDEX idx_routine_tasks_active ON routine_tasks(is_active);
CREATE INDEX idx_routine_completions_routine ON routine_completions(routine_id);
CREATE INDEX idx_routine_completions_user ON routine_completions(user_id);
CREATE INDEX idx_routine_completions_period ON routine_completions(period_key);
