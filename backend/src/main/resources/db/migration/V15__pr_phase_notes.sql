-- V15: Phase notes system - phase owners can add notes visible to everyone

CREATE TABLE pr_phase_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES pr_project_phases(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pr_phase_notes_phase ON pr_phase_notes(phase_id);
