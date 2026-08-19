CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  grade INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade INTEGER NOT NULL,
  subject TEXT NOT NULL,
  chapter_no INTEGER NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(grade, subject, chapter_no),
  UNIQUE(grade, subject, slug)
);

CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started',
  best_score INTEGER DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON assessment_attempts(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

INSERT INTO chapters(grade,subject,chapter_no,title,slug,published)
VALUES
(6,'Science',1,'The Wonderful World of Science','the-wonderful-world-of-science',true),
(6,'Science',2,'Diversity in the Living World','diversity-in-the-living-world',true),
(6,'Science',3,'Mindful Eating: A Path to a Healthy Body','mindful-eating',true),
(6,'Science',4,'Exploring Magnets','exploring-magnets',true),
(6,'Science',5,'Measurement of Length and Motion','measurement-length-motion',true),
(6,'Science',6,'A Journey through States of Water','states-of-water',true),
(6,'Science',7,'Temperature and its Measurement','temperature-measurement',true),
(6,'Science',8,'A Journey through Water','journey-through-water',true),
(6,'Science',9,'Methods of Separation in Everyday Life','methods-of-separation',true),
(6,'Science',10,'Living Creatures: Exploring their Characteristics','living-creatures',true),
(6,'Science',11,'Nature’s Treasures','natures-treasures',true),
(6,'Science',12,'Beyond Earth','beyond-earth',true)
ON CONFLICT (grade,subject,chapter_no) DO UPDATE SET title=EXCLUDED.title,slug=EXCLUDED.slug,published=EXCLUDED.published;
