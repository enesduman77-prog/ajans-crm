-- Link phases to auto-created tasks
ALTER TABLE pr_project_phases ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX idx_pr_project_phases_task ON pr_project_phases(task_id);
