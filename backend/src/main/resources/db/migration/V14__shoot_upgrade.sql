-- V14: Add photographer and equipment to shoots

-- Photographer (çekecek kişi)
ALTER TABLE shoots ADD COLUMN photographer_id UUID REFERENCES user_profiles(id);

-- Notes field for shoots
ALTER TABLE shoots ADD COLUMN notes TEXT;

-- Equipment table
CREATE TABLE shoot_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shoot_id UUID NOT NULL REFERENCES shoots(id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    quantity INT DEFAULT 1,
    notes VARCHAR(500)
);
