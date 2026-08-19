ALTER TABLE students ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin'));
CREATE INDEX IF NOT EXISTS idx_students_role ON students(role);
