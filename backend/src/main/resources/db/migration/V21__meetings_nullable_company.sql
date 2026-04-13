-- Make company_id nullable in meetings (allow agency-internal meetings)
ALTER TABLE meetings ALTER COLUMN company_id DROP NOT NULL;
