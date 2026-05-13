-- LMS PostgreSQL schema (video lessons only).
-- Requires PostgreSQL 13+ (gen_random_uuid built-in).
-- Safe to run on empty DB. If tables exist, drop or migrate separately.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(120) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20)  NOT NULL CHECK (role IN ('superadmin','instructor','student')),
  status          VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  avatar_url      TEXT,
  bio             TEXT,
  rating          NUMERIC(3,2),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id   UUID NOT NULL REFERENCES users(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  cover_image     TEXT,
  category        VARCHAR(100),
  difficulty      VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced')),
  language        VARCHAR(50),
  price           NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_hours  INT,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  rating_avg      NUMERIC(3,2) DEFAULT 0,
  review_count    INT          DEFAULT 0,
  student_count   INT          DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_objectives (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  objective   TEXT NOT NULL,
  order_no    INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS course_requirements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  requirement  TEXT NOT NULL,
  order_no     INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS modules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  order_no   INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  video_url    TEXT NOT NULL,
  duration_min INT  NOT NULL DEFAULT 0,
  is_preview   BOOLEAN NOT NULL DEFAULT FALSE,
  order_no     INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id          UUID NOT NULL REFERENCES courses(id),
  student_id         UUID NOT NULL REFERENCES users(id),
  status             VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  progress_percent   INT NOT NULL DEFAULT 0,
  enrolled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ,
  UNIQUE (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES lessons(id),
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id       UUID REFERENCES modules(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  time_limit_min  INT  NOT NULL DEFAULT 30,
  pass_threshold  INT  NOT NULL DEFAULT 70,
  max_attempts    INT  NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt          TEXT NOT NULL,
  question_type   VARCHAR(20) NOT NULL DEFAULT 'single'
                    CHECK (question_type IN ('single','multiple','true_false')),
  order_no        INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id),
  student_id      UUID NOT NULL REFERENCES users(id),
  score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_spent_sec  INT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id           UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id          UUID NOT NULL REFERENCES quiz_questions(id),
  selected_option_ids  JSONB NOT NULL DEFAULT '[]',
  is_correct           BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS certificates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id     UUID NOT NULL UNIQUE REFERENCES enrollments(id),
  certificate_uid   VARCHAR(100) NOT NULL UNIQUE,
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_payload        TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          VARCHAR(20) NOT NULL DEFAULT 'paid'
                    CHECK (status IN ('pending','paid','failed','refunded')),
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructor_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id),
  instructor_id   UUID NOT NULL REFERENCES users(id),
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  model           VARCHAR(20) NOT NULL DEFAULT 'percentage'
                    CHECK (model IN ('percentage','fixed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment ON payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_course ON instructor_payouts(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_uid ON certificates(certificate_uid);

COMMIT;
