-- Remove priority from all tasks and routine tasks
UPDATE tasks SET priority = NULL;
UPDATE routine_tasks SET priority = NULL;
ALTER TABLE tasks ALTER COLUMN priority DROP DEFAULT;
ALTER TABLE routine_tasks ALTER COLUMN priority DROP DEFAULT;
