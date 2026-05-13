# LMS Backend API specification

This document describes SQL tables, `invoke_function` methods, and behaviour. Implementation lives in `internal/lms/`.

## Yaratilishi kerak bo'lgan fayl

`lms-qobulov` repoda `schema.sql` — bitta fayl, barcha tablolar.

---

## 1. SQL (schema.sql tarkibi)

Quyidagi tartibda yaratiladi (FK bog'liqlik tartibida):

```sql
-- 1. USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('superadmin','instructor','student')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  avatar_url    TEXT,
  bio           TEXT,
  rating        NUMERIC(3,2),          -- instructor uchun
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. REFRESH_TOKENS (JWT rotation)
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TABLE categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  VARCHAR(100) NOT NULL UNIQUE  -- 'Programming','Design','Marketing','Language'
);

-- 4. COURSES
CREATE TABLE courses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id  UUID NOT NULL REFERENCES users(id),
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  cover_image    TEXT,
  category       VARCHAR(100),
  difficulty     VARCHAR(20) CHECK (difficulty IN ('beginner','intermediate','advanced')),
  language       VARCHAR(50),
  price          NUMERIC(12,2) NOT NULL DEFAULT 0,
  duration_hours INT,
  status         VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  rating_avg     NUMERIC(3,2) DEFAULT 0,
  review_count   INT          DEFAULT 0,
  student_count  INT          DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 5. COURSE_OBJECTIVES  ("What you'll learn")
CREATE TABLE course_objectives (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  objective  TEXT NOT NULL,
  order_no   INT  NOT NULL DEFAULT 0
);

-- 6. COURSE_REQUIREMENTS
CREATE TABLE course_requirements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  order_no    INT  NOT NULL DEFAULT 0
);

-- 7. MODULES
CREATE TABLE modules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  order_no   INT  NOT NULL DEFAULT 0
);

-- 8. LESSONS  (faqat video)
CREATE TABLE lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id    UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  video_url    TEXT NOT NULL,   -- YouTube / Vimeo / CDN havolasi
  duration_min INT  NOT NULL DEFAULT 0,
  is_preview   BOOLEAN NOT NULL DEFAULT FALSE,
  order_no     INT  NOT NULL DEFAULT 0
);

-- 9. ENROLLMENTS
CREATE TABLE enrollments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES courses(id),
  student_id       UUID NOT NULL REFERENCES users(id),
  status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  progress_percent INT NOT NULL DEFAULT 0,
  enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  UNIQUE (course_id, student_id)
);

-- 10. LESSON_PROGRESS
CREATE TABLE lesson_progress (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id  UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id      UUID NOT NULL REFERENCES lessons(id),
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (enrollment_id, lesson_id)
);

-- 11. QUIZZES  (course bilan bog'liq, module ixtiyoriy)
CREATE TABLE quizzes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  module_id        UUID REFERENCES modules(id),
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  time_limit_min   INT  NOT NULL DEFAULT 30,
  pass_threshold   INT  NOT NULL DEFAULT 70,  -- foiz
  max_attempts     INT  NOT NULL DEFAULT 3
);

-- 12. QUIZ_QUESTIONS
CREATE TABLE quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id        UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt         TEXT NOT NULL,
  question_type  VARCHAR(20) NOT NULL DEFAULT 'single'
                   CHECK (question_type IN ('single','multiple','true_false')),
  order_no       INT NOT NULL DEFAULT 0
);

-- 13. QUIZ_OPTIONS
CREATE TABLE quiz_options (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text  TEXT NOT NULL,
  is_correct   BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14. QUIZ_ATTEMPTS
CREATE TABLE quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID NOT NULL REFERENCES quizzes(id),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id),
  student_id      UUID NOT NULL REFERENCES users(id),
  score           NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_spent_sec  INT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. QUIZ_ANSWERS
CREATE TABLE quiz_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id          UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES quiz_questions(id),
  selected_option_ids JSONB NOT NULL DEFAULT '[]',
  is_correct          BOOLEAN NOT NULL DEFAULT FALSE
);

-- 16. CERTIFICATES
CREATE TABLE certificates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id    UUID NOT NULL UNIQUE REFERENCES enrollments(id),
  certificate_uid  VARCHAR(100) NOT NULL UNIQUE,  -- public verify key
  issued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_payload       TEXT  -- verify URL yoki uid matni
);

-- 17. REVIEWS
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (course_id, student_id)
);

-- 18. PAYMENTS
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id  UUID NOT NULL REFERENCES enrollments(id),
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'paid'
                   CHECK (status IN ('pending','paid','failed','refunded')),
  paid_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. INSTRUCTOR_PAYOUTS
CREATE TABLE instructor_payouts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id      UUID NOT NULL REFERENCES courses(id),
  instructor_id  UUID NOT NULL REFERENCES users(id),
  amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  model          VARCHAR(20) NOT NULL DEFAULT 'percentage'
                   CHECK (model IN ('percentage','fixed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 2. invoke_function method ro'yxati (sahifa bo'yicha)

Har bir method uchun: `data.method` qiymati + `data.object_data` kalitlari + backend qaytaradigan javob shakli.

---

### LoginPage — `login`

```json
// object_data
{ "email": "...", "password": "..." }

// response
{
  "access_token": "...",
  "refresh_token": "...",
  "user": { "id", "full_name", "email", "role", "avatar_url", "bio" }
}
```

---

### RegisterPage — `register`

```json
// object_data
{ "full_name": "...", "email": "...", "password": "...", "role": "student" }

// response — login kabi
{ "access_token": "...", "refresh_token": "...", "user": { ... } }
```

---

### Auth utils (token yangilash / chiqish)

| method | object_data | response |
|--------|-------------|----------|
| `refresh_token` | `{ "refresh_token": "..." }` | `{ "access_token": "..." }` |
| `logout` | `{ "refresh_token": "..." }` | `{ "ok": true }` |

---

### HomePage

| method | object_data | response |
|--------|-------------|----------|
| `get_home_data` | `{}` | `{ "featured_courses": [...], "categories": [...], "top_instructors": [...] }` |

`top_instructors` elementida: `id`, `full_name`, `avatar_url`, `rating`, `bio`, `course_count`, `student_total`.

`featured_courses` elementida: `id`, `title`, `cover_image`, `category`, `difficulty`, `rating`, `duration_hours`, `lesson_count`.

Bitta method bilan birdaniga bo'ladi; alternativ — 3 ta alohida method ham ishlaydi.

---

### CatalogPage — `get_courses`

```json
// object_data (hammasi ixtiyoriy)
{
  "category": "Programming",
  "difficulty": "beginner",
  "language": "Uzbek",
  "search": "React",
  "sort": "rating",       // "rating"|"newest"|"title"
  "page": 1,
  "page_size": 8
}

// response
{
  "courses": [
    {
      "id", "title", "cover_image", "category", "difficulty",
      "rating", "duration_hours", "lesson_count", "price", "language"
    }
  ],
  "total": 24,
  "page": 1,
  "page_size": 8
}
```

---

### CourseDetailPage — `get_course_details`

```json
// object_data
{ "course_id": "..." }

// response
{
  "id", "title", "cover_image", "category", "difficulty", "language",
  "price", "duration_hours", "rating_avg", "review_count", "student_count",
  "description", "what_you_will_learn": [...], "requirements": [...],
  "status",
  "instructor": { "id", "full_name", "avatar_url", "rating", "bio" },
  "modules": [
    {
      "id", "title", "order_no",
      "lessons": [
        { "id", "title", "duration_min", "is_preview", "video_url" }
      ]
    }
  ],
  "final_quiz": { "id", "title", "time_limit_min", "pass_threshold", "max_attempts" },
  "reviews": [ { "id", "author", "rating", "date", "comment" } ]
}
```

---

### CourseDetailPage (Enroll tugmasi) — `enroll_course`

```json
// object_data
{ "course_id": "..." }

// response
{ "enrollment_id": "...", "status": "active" }
```

---

### CourseDetailPage (Sharh yozish) — `create_course_review`

```json
// object_data
{ "course_id": "...", "rating": 5, "comment": "..." }

// response
{ "ok": true, "new_rating_avg": 4.8, "review_count": 215 }
```

---

### LessonViewerPage — `get_lesson_viewer`

```json
// object_data
{ "course_id": "...", "lesson_id": "..." }

// response
{
  "course": { "id", "title", "cover_image" },
  "modules": [ { "id", "title", "lessons": [ { "id", "title", "is_preview" } ] } ],
  "lesson": { "id", "title", "video_url", "duration_min" },
  "completed_lesson_ids": ["l-1", "l-2"]
}
```

---

### LessonViewerPage (dars tamom) — `log_lesson_progress`

```json
// object_data
{ "course_id": "...", "lesson_id": "..." }

// response
{ "progress_percent": 65, "status": "active", "completed_lesson_ids": [...] }
```

---

### QuizPage — `get_quiz`

```json
// object_data
{ "course_id": "..." }

// response
{
  "quiz": {
    "id", "title", "time_limit_min", "pass_threshold", "max_attempts",
    "questions": [
      {
        "id", "prompt", "question_type",
        "options": [ { "id", "option_text" } ]   // is_correct BACKEND DA saqlanadi, frontga KELMAYDI
      }
    ]
  },
  "attempts": [ { "score", "submitted_at" } ]
}
```

---

### QuizPage (yuborish) — `submit_quiz_attempt`

```json
// object_data
{
  "course_id": "...",
  "quiz_id": "...",
  "answers": [
    { "question_id": "...", "selected_option_ids": ["opt-id-1"] }
  ],
  "time_spent_sec": 840
}

// response
{
  "score": 85,
  "passed": true,
  "certificate": { "id": "CERT-...", "issued_at": "..." }  // faqat passed && progress==100 bo'lsa
}
```

---

### StudentDashboardPage — `get_my_courses`

```json
// object_data
{}

// response
{
  "enrollments": [
    {
      "id", "status", "progress_percent",
      "completed_lesson_ids": [...],
      "attempts": [ { "score", "submitted_at" } ],
      "certificate": { "id", "issued_at" } | null,
      "course": {
        "id", "title", "cover_image",
        "modules": [ { "id", "title", "lessons": [ { "id", "title" } ] } ]
      }
    }
  ]
}
```

---

### CertificatesPage — `get_my_certificates`

```json
// object_data
{}

// response
{
  "certificates": [
    {
      "certificate_uid",
      "issued_at",
      "course": { "id", "title" },
      "instructor": { "full_name" },
      "student_name": "..."
    }
  ]
}
```

---

### PublicVerifyPage — `verify_certificate`

```json
// object_data
{ "certificate_id": "CERT-..." }   // certificate_uid

// response (auth shart emas — public method)
{
  "valid": true,
  "student_name": "...",
  "course_title": "...",
  "instructor_name": "...",
  "issued_at": "..."
}
// topilmasa: { "valid": false }
```

---

### ProfilePage — `get_user_profile`

```json
// object_data
{}

// response
{
  "id", "full_name", "email", "role", "avatar_url", "bio",
  "stats": {
    // student
    "enrolled": 4, "active": 2, "completed": 2,
    // instructor
    "courses": 3, "students": 120, "completion_rate": 78,
    // superadmin
    "total_users": 5, "students": 2, "instructors": 2
  }
}
```

---

### ProfilePage (saqlash) — `update_profile`

```json
// object_data
{ "full_name": "...", "bio": "...", "avatar_url": "..." }

// response
{ "ok": true }
```

---

### RewardsPage — `get_my_rewards`

```json
// object_data
{}

// response
{
  "certificates": [
    {
      "certificate_uid", "issued_at",
      "course": { "id", "title", "cover_image" },
      "student_name": "..."
    }
  ],
  "rewards": [
    { "id", "title", "description", "points", "unlocked": true }
  ]
}
```

Superadmin/instructor uchun: barcha foydalanuvchilar sertifikatlarini ko'rishi uchun alohida `get_all_certificates` method (quyida admin blokida).

---

### InstructorDashboardPage — `get_instructor_dashboard`

```json
// object_data
{}

// response
{
  "courses": [
    {
      "id", "title", "status", "description", "student_count",
      "modules": [ { "id", "title" } ]
    }
  ],
  "total_students": 320
}
```

---

### InstructorDashboardPage — `create_module`

```json
// object_data
{ "course_id": "...", "title": "Module nomi" }

// response
{ "module": { "id", "title", "order_no" } }
```

---

### InstructorDashboardPage — `create_lesson`

```json
// object_data
{
  "course_id": "...",
  "module_id": "...",
  "title": "...",
  "video_url": "https://youtube.com/...",
  "duration_min": 15,
  "is_preview": false
}

// response
{ "lesson": { "id", "title", "video_url", "duration_min", "order_no" } }
```

---

### CreateCoursePage — `create_course`

```json
// object_data
{
  "title": "...",
  "description": "...",
  "cover_image": "...",
  "category": "Programming",
  "difficulty": "beginner",
  "language": "Uzbek",
  "price": 490000,
  "duration_hours": 28,
  "status": "draft",
  "what_you_will_learn": ["..."],
  "requirements": ["..."]
}

// response
{ "course": { "id", "title", "status" } }
```

---

### AdminDashboardPage — `get_finance_summary`

```json
// object_data
{ "preset": "month" }   // "day"|"week"|"month" yoki "period_start"+"period_end"

// response
{
  "revenue": 4900000,
  "expenses": 1200000,
  "net": 3700000,
  "is_profit": true,
  "published_courses": 3,
  "total_courses": 4,
  "total_users": 5,
  "students": 2,
  "instructors": 2
}
```

---

### AdminReportsPage — `get_reports`

```json
// object_data
{
  "report_type": "enrollments",  // quyidagi 8 ta type
  "period_start": "2026-01-01",
  "period_end": "2026-05-13"
}
```

`report_type` qiymatlari va har biri uchun javob:

| report_type | Javob massivining har bir satri |
|-------------|----------------------------------|
| `enrollments` | `course`, `enrollments`, `completed`, `completion_rate` |
| `revenue` | `course`, `amount`, `payout`, `net`, `date` |
| `students` | `name`, `email`, `enrollments`, `completed` |
| `progress` | `course`, `avg_progress`, `stuck_learners`, `active` |
| `quiz` | `course`, `user`, `score`, `submitted_at` |
| `certificates` | `certificate_uid`, `student`, `course`, `issued_at` |
| `instructors` | `instructor`, `courses`, `students`, `rating` |
| `reviews` | `author`, `course`, `rating`, `comment`, `date` |

---

### AdminUsersPage — `get_users`

```json
// object_data
{ "role": "student", "search": "...", "page": 1, "page_size": 50 }

// response
{
  "users": [ { "id", "full_name", "email", "role", "avatar_url", "status" } ],
  "total": 5
}
```

Keyingi bosqich uchun (tavsiya): `set_user_status` (`blocked`/`active`) va `set_user_role`.

---

## 3. Jami method ro'yxati (19 ta)

```
login
register
refresh_token
logout
get_home_data
get_courses
get_course_details
enroll_course
create_course_review
get_lesson_viewer
log_lesson_progress
get_quiz
submit_quiz_attempt
get_my_courses
get_my_certificates
verify_certificate
get_user_profile
update_profile
get_my_rewards
get_instructor_dashboard
create_module
create_lesson
create_course
get_finance_summary
get_reports
get_users
```

Jami: **26 ta method** (auth 4 + kurs 4 + enrollment/progress 3 + quiz 2 + sertifikat 2 + profil 2 + rewards 1 + instructor 3 + admin 3).

---

## 4. Yaratish tartibi

- `schema.sql` — `lms-qobulov` repo ildiziga
- Har bir method Go faylga ajratiladi: `handlers/auth.go`, `handlers/courses.go`, `handlers/enrollments.go`, `handlers/quiz.go`, `handlers/admin.go` va hokazo
- Asosiy `invoke_function` entry: `data.method` bo'yicha `switch` yoki `map[string]Handler`

---

## 5. Backend AI Prompt (BACKEND.md)

Quyidagi matnni `lms-qobulov` repoga `BACKEND.md` sifatida saqlang va har safar AI ga berib ishlatavering.

```
# LMS Backend — Ucode invoke_function (Go)

## Loyiha haqida
Bu LMS (Learning Management System) backendi.
Barcha so'rovlar bitta endpoint orqali keladi:

  POST https://api.admin.u-code.io/v2/invoke_function/hisobim-core-service/
  Headers:
    Content-Type: application/json
    Authorization: Bearer <ACCESS_TOKEN>
    environment-id: <ENV_ID>

Request body:
  {
    "data": {
      "method": "<method_name>",
      "object_data": { ...params }
    }
  }

Javob har doim:
  { "data": { ...result } }   -- muvaffaqiyatda
  { "status": "error", "data": { "message": "..." } }  -- xatoda

## Autentifikatsiya
- Parollar bcrypt bilan saqlanadi (users.password_hash).
- Login/register muvaffaqiyatdan keyin JWT access_token (15 daqiqa) va refresh_token (7 kun) qaytaradi.
- refresh_tokens jadvalida token_hash (SHA-256), expires_at, revoked_at saqlanadi.
- Barcha himoyalangan methodlar Authorization headerdan JWT ni tekshiradi va user_id + role ni oladi.
- verify_certificate va get_courses methodlari public — token talab qilinmaydi.

## Jadvallar (barchasi yaratilgan)
users, refresh_tokens, categories, courses, course_objectives,
course_requirements, modules, lessons, enrollments, lesson_progress,
quizzes, quiz_questions, quiz_options, quiz_attempts, quiz_answers,
certificates, reviews, payments, instructor_payouts

## Rollar va ruxsatlar (RBAC)
- superadmin : hamma narsaga kirishi mumkin
- instructor  : faqat o'z kurslarini o'zgartira oladi; moliya ko'rolmaydi
- student     : o'z enrollmentlari, progress, quiz, certificate

---

## Method ro'yxati va spetsifikatsiya

### AUTH

#### login
object_data: { email, password }
Logika:
  1. users jadvalidan email bo'yicha foydalanuvchi topiladi
  2. bcrypt.CompareHashAndPassword(user.password_hash, password)
  3. Agar noto'g'ri: error "Email yoki parol noto'g'ri"
  4. JWT access_token (payload: user_id, role, exp: +15min) yaratiladi
  5. refresh_token (random 32 bayt hex) yaratiladi; SHA-256 hashi refresh_tokens ga saqlanadi
Response: { access_token, refresh_token, user: { id, full_name, email, role, avatar_url, bio } }

#### register
object_data: { full_name, email, password, role }
Logika:
  1. email unique tekshiriladi
  2. role faqat "student" yoki "instructor" bo'lishi mumkin (superadmin register orqali yaratilmaydi)
  3. bcrypt.GenerateFromPassword(password, 12)
  4. users ga INSERT; keyin login kabi token qaytariladi
Response: { access_token, refresh_token, user: { id, full_name, email, role, avatar_url, bio } }

#### refresh_token
object_data: { refresh_token }
Logika:
  1. SHA-256 hash hisoblanadi; refresh_tokens da topiladi
  2. expires_at va revoked_at tekshiriladi
  3. Eski token revoke qilinadi (revoked_at = NOW()); yangi juft qaytariladi (rotation)
Response: { access_token, refresh_token }

#### logout
object_data: { refresh_token }
Logika: token_hash topiladi, revoked_at = NOW()
Response: { ok: true }

---

### KURSLAR

#### get_home_data
Public. object_data: {}
Logika:
  - featured_courses: student_count DESC LIMIT 6 (published)
  - categories: categories jadvali
  - top_instructors: instructor role, rating DESC LIMIT 6;
    har instructor uchun course_count va student_total hisoblanadi
Response: { featured_courses: [...], categories: [...], top_instructors: [...] }
Kurs elementi: { id, title, cover_image, category, difficulty, rating_avg, duration_hours, lesson_count }
Instructor elementi: { id, full_name, avatar_url, rating, bio, course_count, student_total }

#### get_courses
Public. object_data: { category?, difficulty?, language?, search?, sort?, page?, page_size? }
Logika:
  - WHERE status='published'
  - ILIKE search (title)
  - Filtr: category, difficulty, language
  - sort: "rating"→rating_avg DESC, "newest"→created_at DESC, "title"→title ASC
  - LIMIT page_size (default 8) OFFSET (page-1)*page_size
Response: { courses: [...], total, page, page_size }
Kurs elementi: { id, title, cover_image, category, difficulty, rating_avg, duration_hours, lesson_count, price, language }

#### get_course_details
Public. object_data: { course_id }
Logika:
  - courses + instructor (users JOIN) + modules + lessons (ORDER BY order_no) +
    final quiz (quizzes WHERE module_id IS NULL LIMIT 1) + reviews (10 ta so'nggi)
Response:
  {
    id, title, cover_image, category, difficulty, language, price, duration_hours,
    rating_avg, review_count, student_count, description, status,
    what_you_will_learn: [string],
    requirements: [string],
    instructor: { id, full_name, avatar_url, rating, bio },
    modules: [{ id, title, order_no, lessons: [{ id, title, duration_min, is_preview, video_url }] }],
    final_quiz: { id, title, time_limit_min, pass_threshold, max_attempts } | null,
    reviews: [{ id, author, rating, date, comment }]
  }

#### create_course
Role: instructor. object_data:
  { title, description, cover_image, category, difficulty, language, price,
    duration_hours, status, what_you_will_learn: [], requirements: [] }
Logika:
  - courses INSERT; instructor_id = token.user_id
  - what_you_will_learn → course_objectives INSERT (order_no = index)
  - requirements → course_requirements INSERT
Response: { course: { id, title, status } }

#### create_module
Role: instructor (o'z kursi). object_data: { course_id, title }
Logika:
  - courses.instructor_id == token.user_id tekshiriladi
  - order_no = MAX(order_no)+1 shu kurs modullari ichida
Response: { module: { id, title, order_no } }

#### create_lesson
Role: instructor (o'z kursi). object_data: { course_id, module_id, title, video_url, duration_min, is_preview }
Logika:
  - module courses.instructor_id orqali ownership tekshiriladi
  - order_no = MAX(order_no)+1 shu modul darslarida
  - lessons INSERT
Response: { lesson: { id, title, video_url, duration_min, order_no } }

---

### ENROLLMENT VA PROGRESS

#### enroll_course
Role: student. object_data: { course_id }
Logika:
  1. Allaqachon enrollment bormi tekshiriladi
  2. enrollments INSERT (status='active', progress_percent=0)
  3. courses.student_count += 1
  4. Agar price > 0: payments INSERT (amount=price, status='paid');
     instructor_payouts INSERT (amount=price*0.7, model='percentage')
Response: { enrollment_id, status: "active" }

#### get_my_courses
Role: student. object_data: {}
Logika:
  - enrollments WHERE student_id = token.user_id
  - Har enrollment uchun: course (modules+lessons), completed_lesson_ids, attempts, certificate
Response:
  { enrollments: [{
      id, status, progress_percent,
      completed_lesson_ids: [uuid],
      attempts: [{ score, submitted_at }],
      certificate: { id: certificate_uid, issued_at } | null,
      course: { id, title, cover_image, modules: [{ id, title, lessons: [{ id, title }] }] }
  }] }

#### get_lesson_viewer
Role: student (yoki is_preview=true bo'lsa public). object_data: { course_id, lesson_id }
Logika:
  - lesson topiladi; is_preview=false bo'lsa enrollment tekshiriladi
  - completed_lesson_ids: lesson_progress WHERE enrollment_id
Response:
  {
    course: { id, title, cover_image },
    modules: [{ id, title, lessons: [{ id, title, is_preview }] }],
    lesson: { id, title, video_url, duration_min },
    completed_lesson_ids: [uuid]
  }

#### log_lesson_progress
Role: student. object_data: { course_id, lesson_id }
Logika:
  1. enrollment topiladi (student + course)
  2. lesson_progress INSERT (ON CONFLICT DO NOTHING)
  3. progress_percent = completed / total_lessons * 100; enrollments UPDATE
  4. Agar progress=100 va shu kurs final quiz pass bo'lgan bo'lsa: status='completed', completed_at=NOW()
Response: { progress_percent, status, completed_lesson_ids: [uuid] }

---

### QUIZ

#### get_quiz
Role: student (enrollment kerak). object_data: { course_id }
Logika:
  - quizzes WHERE course_id AND module_id IS NULL (final quiz)
  - quiz_questions + quiz_options (is_correct frontga KELMAYDI)
  - attempts: quiz_attempts WHERE student_id ORDER BY submitted_at DESC
Response:
  {
    quiz: {
      id, title, time_limit_min, pass_threshold, max_attempts,
      questions: [{ id, prompt, question_type, options: [{ id, option_text }] }]
    },
    attempts: [{ score, submitted_at }]
  }

#### submit_quiz_attempt
Role: student. object_data:
  { course_id, quiz_id, answers: [{ question_id, selected_option_ids: [uuid] }], time_spent_sec }
Logika:
  1. max_attempts tekshiriladi (COUNT existing attempts)
  2. Har savol uchun: quiz_options.is_correct bilan selected_option_ids taqqoslanadi
  3. score = to'g'ri / jami * 100
  4. quiz_attempts INSERT; quiz_answers INSERT
  5. Agar score >= pass_threshold VA enrollments.progress_percent = 100:
       certificates INSERT (certificate_uid = 'CERT-' || upper(substr(md5(random()::text),1,12)))
       enrollments SET status='completed', completed_at=NOW()
Response: { score, passed: bool, certificate: { id: certificate_uid, issued_at } | null }

---

### SERTIFIKAT VA PROFIL

#### get_my_certificates
Role: student. object_data: {}
Logika:
  - certificates JOIN enrollments JOIN courses JOIN users (instructor)
  - WHERE enrollments.student_id = token.user_id
Response:
  { certificates: [{ certificate_uid, issued_at, course: { id, title }, instructor: { full_name }, student_name }] }

#### verify_certificate
PUBLIC (token shart emas). object_data: { certificate_id }
Logika:
  - certificates WHERE certificate_uid = certificate_id
  - JOIN enrollments, users (student), courses, users (instructor)
Response:
  { valid: true, student_name, course_title, instructor_name, issued_at }
  yoki { valid: false }

#### get_user_profile
Role: istalgan. object_data: {}
Logika:
  - users WHERE id = token.user_id
  - role='student': enrolled, active, completed enrollment counts
  - role='instructor': course_count, total_students, completion_rate
  - role='superadmin': total_users, students_count, instructors_count
Response: { id, full_name, email, role, avatar_url, bio, stats: { ... } }

#### update_profile
Role: istalgan. object_data: { full_name?, bio?, avatar_url? }
Logika: users SET ... WHERE id = token.user_id
Response: { ok: true }

#### get_my_rewards
Role: student (yoki instructor/superadmin — barcha sertifikatlar).
object_data: {}
Logika (student):
  - certificates + course cover_image
  - rewards: hardcoded yoki rewards jadvali (keyingi bosqich); hozir statik ro'yxat
Response:
  {
    certificates: [{ certificate_uid, issued_at, course: { id, title, cover_image }, student_name }],
    rewards: [{ id, title, description, points, unlocked: bool }]
  }

---

### INSTRUCTOR

#### get_instructor_dashboard
Role: instructor. object_data: {}
Logika:
  - courses WHERE instructor_id = token.user_id + modules
  - total_students: COUNT(enrollments) for own courses
Response:
  {
    courses: [{ id, title, status, description, student_count, modules: [{ id, title }] }],
    total_students
  }

---

### ADMIN

#### get_finance_summary
Role: superadmin. object_data: { preset? } yoki { period_start?, period_end? }
preset qiymatlari: "day"|"week"|"month" (DEFAULT "month")
Logika:
  - revenue = SUM(payments.amount) WHERE paid_at IN period
  - expenses = SUM(instructor_payouts.amount) WHERE created_at IN period
  - net = revenue - expenses
  - platform snapshot: published_courses, total_courses, total_users, students, instructors
Response: { revenue, expenses, net, is_profit: bool, published_courses, total_courses, total_users, students, instructors }

#### get_reports
Role: superadmin. object_data: { report_type, period_start?, period_end? }
report_type → query:
  "enrollments"  → courses + COUNT(enrollments), completed, completion_rate
  "revenue"      → payments + course title, amount, payout, net, date
  "students"     → users(student) + enrollment count, completed count
  "progress"     → courses + avg(progress_percent), stuck(active AND progress<25), active count
  "quiz"         → quiz_attempts + course title, user name, score, submitted_at
  "certificates" → certificates + student, course, issued_at
  "instructors"  → instructors + course_count, student_total, rating
  "reviews"      → reviews + author, course title, rating, comment, date
Response: { rows: [...], report_type }

#### get_users
Role: superadmin. object_data: { role?, search?, page?, page_size? }
Logika: users WHERE (role filter) AND (full_name ILIKE search OR email ILIKE search)
Response: { users: [{ id, full_name, email, role, avatar_url, status }], total }

---

## Xato formatlari
Barcha xatolar:
  { "status": "error", "data": { "message": "Xato tavsifi" } }

HTTP status kodlari:
  200 — muvaffaqiyat
  400 — noto'g'ri ma'lumot
  401 — token yo'q yoki yaroqsiz
  403 — ruxsat yo'q (rol mos emas)
  404 — resurs topilmadi
  409 — conflict (masalan, allaqachon enrolled)
  500 — server xatosi

## Muhim qoidalar
1. Token user_id dan foydalaning, object_data.user_id ga ishonmang.
2. Instructor faqat o'z kurslarini o'zgartira oladi — ownership tekshiruvi har method da bo'lsin.
3. Student faqat status='completed' bo'lganda review yoza oladi.
4. Quiz attempt limit: COUNT(quiz_attempts) >= quiz.max_attempts bo'lsa 400 qaytaring.
5. Certificate faqat bir marta: enrollment_id UNIQUE constraint ishlatiladi.
6. verify_certificate public — Authorization header bo'lmasa ham ishlaydi.
7. lesson.video_url NOT NULL — bo'sh string ham qabul qilinmasin.
```
