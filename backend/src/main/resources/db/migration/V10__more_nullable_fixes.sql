-- Additional nullable fixes for staff/company deletion
ALTER TABLE shoots ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE pr_projects ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE messages_threads ALTER COLUMN created_by DROP NOT NULL;
