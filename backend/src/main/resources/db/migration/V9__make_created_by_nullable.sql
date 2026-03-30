-- Allow created_by to be null so staff/user deletion doesn't fail
ALTER TABLE tasks ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE meetings ALTER COLUMN created_by DROP NOT NULL;
