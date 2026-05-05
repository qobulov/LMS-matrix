# LMS ERD (Backend uchun)

Quyidagi ERD `lms.md` talablari asosida tuzilgan. React frontend shu struktura bilan ishlashga moslab yozildi.

```mermaid
erDiagram
  USERS {
    uuid id PK
    varchar full_name
    varchar email UK
    varchar password_hash
    enum role "superadmin|instructor|student"
    enum status "active|blocked"
    timestamp created_at
  }

  INSTRUCTOR_PROFILES {
    uuid id PK
    uuid user_id FK
    text bio
    numeric rating_avg
    int rating_count
    varchar avatar_url
  }

  COURSES {
    uuid id PK
    uuid instructor_id FK
    varchar title
    text description
    varchar cover_image
    varchar category
    enum difficulty "beginner|intermediate|advanced"
    varchar language
    numeric price
    int duration_hours
    enum status "draft|published"
    timestamp created_at
  }

  COURSE_OBJECTIVES {
    uuid id PK
    uuid course_id FK
    text objective
    int order_no
  }

  COURSE_REQUIREMENTS {
    uuid id PK
    uuid course_id FK
    text requirement
    int order_no
  }

  MODULES {
    uuid id PK
    uuid course_id FK
    varchar title
    int order_no
  }

  LESSONS {
    uuid id PK
    uuid module_id FK
    varchar title
    enum type "video|text|file"
    text content
    int duration_min
    bool is_preview
    int order_no
  }

  ENROLLMENTS {
    uuid id PK
    uuid course_id FK
    uuid student_id FK
    enum status "active|completed|dropped"
    int progress_percent
    timestamp enrolled_at
    timestamp completed_at
  }

  LESSON_PROGRESS {
    uuid id PK
    uuid enrollment_id FK
    uuid lesson_id FK
    timestamp completed_at
  }

  QUIZZES {
    uuid id PK
    uuid course_id FK
    uuid module_id FK "nullable"
    varchar title
    text description
    int time_limit_min
    int pass_threshold
    int max_attempts
  }

  QUIZ_QUESTIONS {
    uuid id PK
    uuid quiz_id FK
    text prompt
    enum question_type "single|multiple|true_false"
    int order_no
  }

  QUIZ_OPTIONS {
    uuid id PK
    uuid question_id FK
    text option_text
    bool is_correct
  }

  QUIZ_ATTEMPTS {
    uuid id PK
    uuid quiz_id FK
    uuid student_id FK
    numeric score
    int time_spent_sec
    timestamp submitted_at
  }

  QUIZ_ANSWERS {
    uuid id PK
    uuid attempt_id FK
    uuid question_id FK
    jsonb selected_option_ids
    bool is_correct
  }

  CERTIFICATES {
    uuid id PK
    uuid enrollment_id FK
    varchar certificate_uid UK
    timestamp issued_at
    varchar qr_code_url
  }

  REVIEWS {
    uuid id PK
    uuid course_id FK
    uuid student_id FK
    int rating
    text comment
    timestamp created_at
  }

  PAYMENTS {
    uuid id PK
    uuid enrollment_id FK
    numeric amount
    enum status "pending|paid|failed|refunded"
    timestamp paid_at
  }

  INSTRUCTOR_PAYOUTS {
    uuid id PK
    uuid course_id FK
    uuid instructor_id FK
    numeric amount
    enum model "percentage|fixed"
    timestamp created_at
  }

  USERS ||--o| INSTRUCTOR_PROFILES : has
  USERS ||--o{ COURSES : creates
  COURSES ||--o{ COURSE_OBJECTIVES : contains
  COURSES ||--o{ COURSE_REQUIREMENTS : contains
  COURSES ||--o{ MODULES : has
  MODULES ||--o{ LESSONS : has

  USERS ||--o{ ENROLLMENTS : joins
  COURSES ||--o{ ENROLLMENTS : has
  ENROLLMENTS ||--o{ LESSON_PROGRESS : tracks
  LESSONS ||--o{ LESSON_PROGRESS : completed

  COURSES ||--o{ QUIZZES : has
  MODULES o|--o{ QUIZZES : optional_scope
  QUIZZES ||--o{ QUIZ_QUESTIONS : has
  QUIZ_QUESTIONS ||--o{ QUIZ_OPTIONS : has

  QUIZZES ||--o{ QUIZ_ATTEMPTS : receives
  USERS ||--o{ QUIZ_ATTEMPTS : submits
  QUIZ_ATTEMPTS ||--o{ QUIZ_ANSWERS : contains
  QUIZ_QUESTIONS ||--o{ QUIZ_ANSWERS : answered

  ENROLLMENTS ||--o| CERTIFICATES : grants
  COURSES ||--o{ REVIEWS : gets
  USERS ||--o{ REVIEWS : writes

  ENROLLMENTS ||--o{ PAYMENTS : billed
  COURSES ||--o{ INSTRUCTOR_PAYOUTS : costs
  USERS ||--o{ INSTRUCTOR_PAYOUTS : receives
```

## Frontend bilan mos endpointlar

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`
- `GET /courses`
- `GET /courses/:courseId`
- `POST /courses`
- `PATCH /courses/:courseId`
- `POST /enrollments`
- `GET /enrollments/me`
- `POST /progress/lesson-complete`
- `POST /quizzes/attempts`
- `GET /admin/finance/summary`
- `GET /certificates/verify/:certificateUid`
