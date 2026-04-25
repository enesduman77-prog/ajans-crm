ALTER TABLE content_plans ADD COLUMN shoot_id UUID REFERENCES shoots(id) ON DELETE SET NULL;
CREATE INDEX idx_content_plans_shoot ON content_plans(shoot_id);
