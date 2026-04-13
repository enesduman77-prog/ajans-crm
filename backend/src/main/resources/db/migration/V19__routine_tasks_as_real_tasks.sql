-- Link routine-generated tasks back to their routine definition
ALTER TABLE tasks ADD COLUMN routine_id UUID REFERENCES routine_tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN routine_period_key VARCHAR(20);

CREATE INDEX idx_tasks_routine ON tasks(routine_id);
CREATE INDEX idx_tasks_routine_period ON tasks(routine_id, routine_period_key);

-- routine_completions table is no longer needed (tasks themselves track completion)
DROP TABLE IF EXISTS routine_completions;
