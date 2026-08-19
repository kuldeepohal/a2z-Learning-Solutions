CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  grade INT NOT NULL DEFAULT 6 CHECK (grade BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id BIGSERIAL PRIMARY KEY,
  grade INT NOT NULL CHECK (grade BETWEEN 1 AND 12),
  subject TEXT NOT NULL,
  chapter_no INT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  content_url TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (grade, subject, chapter_no),
  UNIQUE (grade, subject, slug)
);

CREATE TABLE IF NOT EXISTS progress (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  chapter_id BIGINT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('not_started','started','attempted','completed')),
  best_score INT NOT NULL DEFAULT 0 CHECK (best_score BETWEEN 0 AND 100),
  time_spent_seconds INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  chapter_id BIGINT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0),
  total INT NOT NULL CHECK (total > 0),
  percentage INT NOT NULL CHECK (percentage BETWEEN 0 AND 100),
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT UNIQUE,
  provider_payment_id TEXT UNIQUE,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  grade INT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chapters_grade_subject ON chapters(grade, subject, chapter_no);
CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_chapter ON assessment_attempts(student_id, chapter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_student_status ON subscriptions(student_id, status);

INSERT INTO chapters (grade,subject,chapter_no,title,slug,published)
VALUES
(6,'science',1,'The Wonderful World of Science','the-wonderful-world-of-science',true),
(6,'science',2,'Diversity in the Living World','diversity-in-the-living-world',true),
(6,'science',3,'Mindful Eating: A Path to a Healthy Body','mindful-eating-a-path-to-a-healthy-body',true),
(6,'science',4,'Exploring Magnets','exploring-magnets',true),
(6,'science',5,'Measurement of Length and Motion','measurement-of-length-and-motion',true),
(6,'science',6,'A Journey through States of Water','a-journey-through-states-of-water',true),
(6,'science',7,'Temperature and its Measurement','temperature-and-its-measurement',true),
(6,'science',8,'A Journey through Water','a-journey-through-water',true),
(6,'science',9,'Methods of Separation in Everyday Life','methods-of-separation-in-everyday-life',true),
(6,'science',10,'Living Creatures: Exploring their Characteristics','living-creatures-exploring-their-characteristics',true),
(6,'science',11,'Nature’s Treasures','natures-treasures',true),
(6,'science',12,'Beyond Earth','beyond-earth',true),
(6,'science',13,'Chapter 13','chapter-13',false),
(6,'science',14,'Chapter 14','chapter-14',false),
(6,'science',15,'Chapter 15','chapter-15',false)
ON CONFLICT (grade,subject,chapter_no) DO NOTHING;
