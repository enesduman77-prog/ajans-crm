-- Task system upgrade: optional company, required assignee, start/end datetime, TOPLANTI category

-- 1. Make company_id nullable
ALTER TABLE tasks ALTER COLUMN company_id DROP NOT NULL;

-- 2. Make assigned_to NOT NULL (first set any NULLs to created_by)
UPDATE tasks SET assigned_to = created_by WHERE assigned_to IS NULL;
ALTER TABLE tasks ALTER COLUMN assigned_to SET NOT NULL;

-- 3. Add start_date column
ALTER TABLE tasks ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;

-- 4. Rename due_date to end_date for clarity
ALTER TABLE tasks RENAME COLUMN due_date TO end_date;
ALTER TABLE tasks RENAME COLUMN due_time TO end_time;

-- 5. Add start_time column
ALTER TABLE tasks ADD COLUMN start_time TIME;

-- 6. Update category check constraint to include TOPLANTI
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_category_check
    CHECK (category IN ('REELS', 'BLOG', 'PAYLASIM', 'SEO', 'TASARIM', 'TOPLANTI', 'OTHER'));

-- 7. Update indexes
CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks(end_date);
