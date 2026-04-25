-- V28: Unlink shoots from content plans that are not yet approved
-- Only APPROVED and PUBLISHED content should be linked to shoots
UPDATE content_plans SET shoot_id = NULL WHERE status IN ('DRAFT', 'WAITING_APPROVAL', 'REVISION');
