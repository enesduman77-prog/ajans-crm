CREATE TABLE task_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES user_profiles(id),
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_task_notes_task ON task_notes(task_id);
CREATE INDEX idx_task_notes_author ON task_notes(author_id);
