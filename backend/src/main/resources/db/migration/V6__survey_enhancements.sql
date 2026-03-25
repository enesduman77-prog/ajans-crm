-- V4: Add comment column to satisfaction_surveys and add unique constraint
ALTER TABLE satisfaction_surveys ADD COLUMN IF NOT EXISTS comment TEXT;

-- Prevent duplicate surveys per company per month per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_unique_month
ON satisfaction_surveys(company_id, submitted_by, survey_month);
