# LMS (Learning Management System) — Technical Requirements

---

## From: Client
## To: Development Team

---

## What I Want

I need an online learning platform. Instructors create courses with lessons and quizzes. Students enroll, go through lessons, take tests, and earn certificates. As the platform owner, I see the finances and manage the entire process.

Not a simple list of videos — a full-fledged system with progress tracking, assessments, certificates, and analytics.

---

## Roles & Access

**SuperAdmin** — that's me. Full access to everything: users, courses, finances. Can assign roles, block users, see platform profit/loss.

**Instructor** — creates and manages their own courses. Adds modules, lessons, quizzes. Sees the list of enrolled students and their progress. Cannot see platform finances.

**Student** — enrolls in courses, goes through lessons, takes quizzes, earns certificates, leaves reviews.

Authentication — JWT tokens (access + refresh). Passwords — bcrypt. Refresh token renews access without re-login.

---

## Courses

An instructor creates a course. Here's what a course must have:
- Title
- Description (rich text)
- Cover image
- Category (programming, design, marketing, languages, etc.)
- Difficulty level: beginner / intermediate / advanced
- Price (can be free)
- Total duration (in hours)
- Course language
- Status: draft / published

Course catalog supports:
- Filtering by: category, difficulty level, rating, price (free/paid), language
- Sorting by: popularity, rating, newest, price
- Search by title
- Pagination

---

## Course Detail Page

When a student clicks on a course, they land here. Here's what I want to see:

- **Cover image, title, category, difficulty badge**
- **Instructor info** — photo, name, short bio, instructor rating
- **Course description** — rich text, detailed
- **"What You'll Learn"** — bullet point list of what the student will gain
- **Requirements / Prerequisites** — what the student needs to know beforehand
- **Syllabus** — list of modules and lessons within them. The first few lessons are marked as "Preview" — viewable without enrollment
- **Total duration, lesson count, language**
- **Price and "Enroll" button**
- **Student reviews and rating** — average score, review count, list of reviews

---

## Modules & Lessons

A course is divided into **modules** (sections), and each module contains **lessons**. Order matters — modules and lessons are ordered.

Lesson types:
- **Video** — video link (URL)
- **Text** — rich text content
- **File** — attached file (PDF, presentation, etc.)

Lesson data: title, content, duration, order number, `is_preview` flag (accessible without enrollment).

The student clicks "Complete Lesson" — the lesson is marked as completed. Progress is tracked: "4 out of 10 lessons completed" — with a progress bar.

---

## Enrollment

- Student clicks "Enroll" — if the course is paid, payment is emulated
- Enrollment statuses: `active` → `completed` → `dropped`
- Student sees their courses with progress
- Instructor sees the list of enrolled students

---

## Assessments (Quizzes)

Instructors create quizzes — tied to a course or a specific module.

Quiz data:
- Title, description
- Time limit (e.g. 30 minutes)
- Pass threshold (e.g. 70%)
- Maximum number of attempts

Question types:
- Multiple choice (single correct answer)
- Multiple choice (multiple correct answers)
- True / False

Student takes the quiz — answers are scored automatically, results are shown. Attempt history is stored: score, date, time spent, answers.

---

## Certificates

When a student completes all lessons + passes the final quiz — a certificate is automatically generated.
Interactive Card Preview
Certificate contains:
- Student name
- Course name
- Instructor name
- Completion date
- Unique ID
- QR code for verification

Anyone can verify the certificate's authenticity by unique ID — public endpoint, no auth required.

---

## Reviews & Ratings

- Student can only leave a review after completing the course
- Rating 1–5, text comment
- Average rating displayed on the course card and detail page

---

## Profit / Loss

SuperAdmin only. I need to understand the platform's financial health.

- Revenue: course price × number of enrollments
- Expenses: instructor payouts (percentage or fixed amount)
- Net profit / loss
- Filter by period: day, week, month, custom date range
- Clearly show: are we **in profit** or **at a loss**

---

## Reports

SuperAdmin / Instructor access. All reports filterable by date range and exportable (CSV).

- **Enrollments Report** — total enrollments over time, enrollments per course, new vs returning students, dropout rate by course
- **Revenue Report** — total revenue by period, revenue per course, free vs paid course breakdown, average enrollment value
- **Students Report** — total registered students, active vs inactive, top students by courses completed, student growth over time
- **Progress Report** — average lesson completion rate per course, students stuck (no activity > 7 days), completion funnel
- **Quiz Report** — average score per quiz, pass/fail rate, most failed questions, average number of attempts
- **Certificates Report** — certificates issued per period, per course, total issued count
- **Instructors Report** — courses per instructor, students per instructor, revenue per instructor, average rating
- **Reviews Report** — average rating per course, courses with no reviews, recent low-rated reviews

---

## ERD (Database Diagram)

Before development starts — ERD diagram of the entire database. All tables, relationships, data types. Use dbdiagram.io, drawSQL, or Mermaid. Include in documentation.

---

## Frontend — Pages I Need

- **Home page** — featured courses, categories, top instructors
- **Course catalog** — cards, filters, search, sorting
- **Course detail page** — everything described above
- **Lesson viewer** — video/text/file, "Complete" button, module navigation
- **Quiz page** — take assessment, timer, results
- **Student dashboard** — my courses with progress bars, certificates, quiz history
- **Instructor dashboard** — manage courses, modules, lessons, quizzes, student list
- **Certificate page** — view and public verification
- **Profile** — personal info, reviews, settings
- **Profit / Loss page** (SuperAdmin only) — revenue and expense summary
- **Reports page** (SuperAdmin) — enrollments, revenue, students, quizzes, certificates reports with export

---

## Acceptance Criteria

| What Must Work                                       |
|------------------------------------------------------|
| ERD database diagram                                 |
| JWT auth + roles (RBAC)                              |
| Course CRUD + filtering + search                     |
| Course detail page (syllabus, reviews, etc.)         |
| Modules + lessons + progress tracking                |
| Enrollment management                                |
| Quizzes (scoring, attempts)                          |
| Certificates (auto-generation + public verification) |
| Reviews & ratings                                    |
| Profit / loss                                        |
| Basic reports (enrollments, revenue, quizzes, certs) |
| Frontend — all pages functional                      |

---

## Tech Stack

- **Backend:** Go, `Ucode`
- **Frontend:** React or Next.js (your choice), deployed on **Vercel**
- **Database:** ERD required (dbdiagram.io / drawSQL / Mermaid)
- **Bonus:** Project Documentation, Profit / Loss, Cashflow, Balance (like planfakt.io) on MetaBase

---

## Frontend Gateway Integration (Go function style)

Frontend API chaqiruvlari `single base URL + data.method + data.object_data` formatiga moslangan.

### Env

```bash
VITE_GATEWAY_URL=http://localhost:8080/
VITE_GATEWAY_APP_ID=
VITE_GATEWAY_PROJECT_ID=
VITE_GATEWAY_ENVIRONMENT_ID=
```

### Request shape

```json
{
  "auth": { "type": "", "data": null },
  "data": {
    "app_id": "...",
    "project_id": "...",
    "environment_id": "...",
    "method": "get_courses",
    "object_data": {},
    "user_id": "..."
  }
}
```

### Frontend method map (`src/api/endpoints.js`)

- `authApi.login` -> `login`
- `authApi.register` -> `register`
- `authApi.refresh` -> `refresh_token`
- `courseApi.getCatalog` -> `get_courses`
- `courseApi.getById` -> `get_course_details`
- `courseApi.create` -> `create_course`
- `courseApi.update` -> `update_course`
- `enrollmentApi.enroll` -> `enroll_course`
- `enrollmentApi.myCourses` -> `get_my_courses`
- `enrollmentApi.completeLesson` -> `log_lesson_progress`
- `quizApi.submitAttempt` -> `submit_quiz_attempt`
- `adminApi.getFinanceSummary` -> `get_finance_summary`
- `certificateApi.verifyById` -> `verify_certificate`

Agar backendda method nomlari boshqacha bo'lsa, faqat `src/api/endpoints.js`ni almashtirish kifoya.

---

## Implemented UI Scope (Role Based)

Hozirgi frontend quyidagilarni qamrab oladi:

- `Login/Register` sahifalari (RBAC start)
- `Student` flow: catalog, course detail, lesson viewer, quiz, certificates, profile
- `Instructor` flow: dashboard, create course, module/lesson qo'shish UI, student overview
- `SuperAdmin` flow: alohida admin panel (`/admin`) + overview, reports, users

### Admin panel alohida

`/admin` route alohida sidebar layoutda ishlaydi va faqat `superadmin` rolega ochiladi.

### API ulashga tayyor

Frontend gateway formatda ishlaydi (`single URL + method + object_data`).
Method mappinglar `src/api/endpoints.js` da ajratilgan, backend method nomlari o'zgarsa shu faylning o'zini update qilish kifoya.

### Go backend (reference)

`backend/` papkasida PostgreSQL `schema.sql`, `BACKEND.md` spetsifikatsiyasi va `go run ./cmd/server` bilan ishga tushadigan invoke_function server bor. `src/api/client.js` endi faqat `{ data: { method, object_data } }` yuboradi (`VITE_GATEWAY_URL` default `http://localhost:8080/`).
