-- PR Projects upgrade: responsible person, optional company, dates, notes, phase-level assignments

-- Make company_id optional
ALTER TABLE pr_projects ALTER COLUMN company_id DROP NOT NULL;

-- Add responsible person, dates, notes to pr_projects
ALTER TABLE pr_projects ADD COLUMN responsible_id UUID REFERENCES user_profiles(id);
ALTER TABLE pr_projects ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE pr_projects ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE pr_projects ADD COLUMN notes TEXT;

-- Add assigned person, dates, notes, status to pr_project_phases
ALTER TABLE pr_project_phases ADD COLUMN assigned_to_id UUID REFERENCES user_profiles(id);
ALTER TABLE pr_project_phases ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE pr_project_phases ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE pr_project_phases ADD COLUMN notes TEXT;
ALTER TABLE pr_project_phases ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';
