# Implementation Plan: LMS Full Test Plan

## Overview

Implement a comprehensive E2E test suite using Vitest + TypeScript that exercises all 26 LMS API methods across 3 roles (superadmin, instructor, student). The suite makes real HTTP requests against the live backend gateway, with each test file self-contained (own users, own data, no cleanup). Includes both integration tests and property-based tests validating 16 correctness properties.

## Tasks

- [ ] 1. Set up Vitest test infrastructure
  - [ ] 1.1 Install Vitest dependencies and create configuration
    - Add `vitest` and `fast-check` as dev dependencies to package.json
    - Create `vitest.config.ts` with testTimeout: 30000, hookTimeout: 60000, fileParallelism: false, sequential execution, include pattern `tests/**/*.test.ts`
    - _Requirements: 1.1, 1.5_

  - [ ] 1.2 Create the constants module (`tests/helpers/constants.ts`)
    - Export GATEWAY_URL, ENVIRONMENT_ID, PROJECT_ID from environment variables or .env
    - Export TEST_PASSWORD, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD
    - Export INSTRUCTOR_SHARE (0.7), PLATFORM_SHARE (0.3), DEFAULT_PASS_THRESHOLD (70), DEFAULT_MAX_ATTEMPTS (3), DEFAULT_TIME_LIMIT_MIN (30)
    - _Requirements: 1.2, 1.4_

  - [ ] 1.3 Create the API client module (`tests/helpers/api-client.ts`)
    - Implement `callGateway<T>(method, objectData, options)` — sends POST to gateway with correct headers, unwraps response envelope, throws on error
    - Implement `callGatewayRaw(method, objectData, options)` — non-throwing variant returning `{ ok, status, data }` for error-case testing
    - Use native `fetch`, attach Content-Type, environment-id, and optional Authorization Bearer header
    - _Requirements: 1.2_

  - [ ]* 1.4 Write property test for API client header construction
    - **Property 1: API Helper Header Construction**
    - **Validates: Requirements 1.2**

  - [ ] 1.5 Create the auth helper module (`tests/helpers/auth.ts`)
    - Implement `generateUniqueEmail(role)` using timestamp + 4-char random hex
    - Implement `registerUser(role)` returning TestUser with tokens
    - Implement `loginUser(email, password)` returning TestUser
    - Implement `loginAsSuperadmin()` using env credentials
    - Implement `createTestContext()` returning { superadmin, instructor, student }
    - _Requirements: 1.3, 1.4_

  - [ ]* 1.6 Write property test for email uniqueness
    - **Property 2: Email Uniqueness**
    - **Validates: Requirements 1.4**

  - [ ] 1.7 Create the factories module (`tests/helpers/factories.ts`)
    - Implement `createFullCourse(instructorToken, options?)` — creates published course with module, lessons, and quiz; returns TestCourse with all IDs
    - Implement `createMinimalCourse(instructorToken, overrides?)` — draft course for simple tests
    - Implement `enrollStudent(studentToken, courseId)` — returns enrollment_id
    - Implement `completeAllLessons(studentToken, courseId, lessonIds)` — logs progress for each lesson
    - Implement `submitQuiz(studentToken, courseId, quizId, answers, timeSpentSec?)` — submits quiz attempt
    - _Requirements: 1.3_

- [ ] 2. Checkpoint - Verify infrastructure
  - Ensure all helper modules compile without errors, ask the user if questions arise.

- [ ] 3. Implement authentication test file
  - [ ] 3.1 Create `tests/auth.test.ts`
    - Test student registration returns access_token, refresh_token, user with role "student"
    - Test instructor registration returns correct role
    - Test duplicate email registration returns error
    - Test login with correct credentials returns tokens and user
    - Test login with wrong password returns error
    - Test login with non-existent email returns error
    - Test refresh_token returns new access_token
    - Test logout returns ok: true
    - Test refresh after logout (revoked token) returns error
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [ ] 4. Implement course management test file
  - [ ] 4.1 Create `tests/courses.test.ts`
    - Test instructor creates course with all fields, response has id/title/status
    - Test get_courses returns courses array, total, page, page_size
    - Test get_courses with category filter returns only matching courses
    - Test get_courses with search term returns matching titles
    - Test get_course_details returns full course metadata, instructor, modules, reviews
    - Test instructor creates module, response has id/title/order_no
    - Test instructor creates lesson, response has id/title/video_url/duration_min/order_no
    - Test course details includes what_you_will_learn and requirements arrays
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 4.2 Write property test for course category filter correctness
    - **Property 3: Course Category Filter Correctness**
    - **Validates: Requirements 3.3**

  - [ ]* 4.3 Write property test for course search filter correctness
    - **Property 4: Course Search Filter Correctness**
    - **Validates: Requirements 3.4**

- [ ] 5. Implement enrollment and progress test file
  - [ ] 5.1 Create `tests/enrollment.test.ts`
    - Test student enrolls in course, response has enrollment_id and status "active"
    - Test duplicate enrollment returns conflict error
    - Test get_my_courses shows enrolled course with progress_percent 0
    - Test log_lesson_progress returns updated progress_percent
    - Test completing all lessons results in progress_percent 100
    - Test get_lesson_viewer returns course, modules, lesson, completed_lesson_ids
    - Test enrollment status changes to "completed" after all lessons + quiz passed
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 5.2 Write property test for progress percentage calculation
    - **Property 5: Progress Percentage Calculation**
    - **Validates: Requirements 4.4, 4.5**

- [ ] 6. Implement quiz system test file
  - [ ] 6.1 Create `tests/quiz.test.ts`
    - Test get_quiz returns quiz metadata and questions without is_correct
    - Test all-correct submission returns score 100, passed true
    - Test all-incorrect submission returns score 0, passed false
    - Test mixed answers returns correct percentage score
    - Test max_attempts exceeded returns error
    - Test passing quiz with progress 100 issues certificate
    - Test passing quiz with progress < 100 does not issue certificate
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 6.2 Write property test for quiz score calculation
    - **Property 6: Quiz Score Calculation**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [ ] 7. Implement certificate test file
  - [ ] 7.1 Create `tests/certificates.test.ts`
    - Test certificate is generated with unique certificate_uid after course completion
    - Test get_my_certificates returns certificate with uid, issued_at, course, instructor, student_name
    - Test verify_certificate with valid uid (no auth) returns valid: true with details
    - Test verify_certificate with invalid uid returns valid: false
    - Test certificate_uid uniqueness across enrollments
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Write property test for certificate UID uniqueness
    - **Property 7: Certificate UID Uniqueness**
    - **Validates: Requirements 6.5**

- [ ] 8. Implement profile management test file
  - [ ] 8.1 Create `tests/profile.test.ts`
    - Test student get_user_profile returns correct role and stats (enrolled, active, completed)
    - Test instructor get_user_profile returns role and stats (courses, students, completion_rate)
    - Test superadmin get_user_profile returns role and stats (total_users, students, instructors)
    - Test update_profile returns ok: true
    - Test get_user_profile after update reflects new values
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.2 Write property test for profile update round-trip
    - **Property 8: Profile Update Round-Trip**
    - **Validates: Requirements 7.4, 7.5**

- [ ] 9. Checkpoint - Verify core domain tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement rewards test file
  - [ ] 10.1 Create `tests/rewards.test.ts`
    - Test student with certificates sees them in get_my_rewards response
    - Test get_my_rewards returns rewards array with id, title, description, points, unlocked
    - Test student with no certificates sees empty certificates array
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 11. Implement instructor dashboard test file
  - [ ] 11.1 Create `tests/instructor.test.ts`
    - Test get_instructor_dashboard returns courses array with id, title, status, student_count, modules
    - Test total_students reflects sum of enrolled students
    - Test student_count increments after new enrollment
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 11.2 Write property test for enrollment increments student count
    - **Property 9: Enrollment Increments Student Count**
    - **Validates: Requirements 9.3**

- [ ] 12. Implement admin dashboard and payments test files
  - [ ] 12.1 Create `tests/admin.test.ts`
    - Test get_finance_summary returns all required fields (revenue, expenses, net, is_profit, etc.)
    - Test revenue increases by course price after paid enrollment
    - Test expenses increase by 70% of course price after paid enrollment
    - Test net = revenue - expenses and is_profit = net > 0
    - Test get_reports "enrollments" returns correct row fields
    - Test get_reports "revenue" returns correct row fields
    - Test get_reports "students" returns correct row fields
    - Test get_reports "certificates" returns correct row fields
    - Test get_users with role filter returns only matching roles
    - Test get_users with search term matches full_name or email
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10_

  - [ ] 12.2 Create `tests/payments.test.ts`
    - Test paid enrollment creates payment with amount = course price
    - Test paid enrollment creates instructor_payout with amount = price * 0.7
    - Test platform share = price - instructor payout (30%)
    - Test multiple enrollments: finance revenue = sum of payments
    - Test multiple enrollments: finance expenses = sum of payouts
    - Test net profit = total_revenue - total_expenses
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 12.3 Write property test for payment split correctness
    - **Property 10: Payment Split Correctness**
    - **Validates: Requirements 10.2, 10.3, 11.1, 11.2, 11.3**

  - [ ]* 12.4 Write property test for finance summary invariant
    - **Property 11: Finance Summary Invariant**
    - **Validates: Requirements 10.4, 11.6**

  - [ ]* 12.5 Write property test for finance accumulation
    - **Property 12: Finance Accumulation**
    - **Validates: Requirements 11.4, 11.5**

  - [ ]* 12.6 Write property test for user role filter correctness
    - **Property 13: User Role Filter Correctness**
    - **Validates: Requirements 10.9**

  - [ ]* 12.7 Write property test for user search filter correctness
    - **Property 14: User Search Filter Correctness**
    - **Validates: Requirements 10.10**

- [ ] 13. Implement RBAC enforcement test file
  - [ ] 13.1 Create `tests/rbac.test.ts`
    - Test student calling create_course gets 403
    - Test student calling get_finance_summary gets 403
    - Test student calling get_users gets 403
    - Test student calling get_reports gets 403
    - Test instructor calling get_finance_summary gets 403
    - Test instructor calling get_users gets 403
    - Test instructor calling get_reports gets 403
    - Test instructor creating module on another instructor's course gets 403
    - Test unauthenticated request to protected method gets 401
    - Test unauthenticated verify_certificate succeeds (public)
    - Test unauthenticated get_courses succeeds (public)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10, 12.11_

- [ ] 14. Implement reviews test file
  - [ ] 14.1 Create `tests/reviews.test.ts`
    - Test completed student submits review, response has ok, new_rating_avg, review_count
    - Test active (non-completed) student submitting review gets error
    - Test duplicate review for same course gets conflict error
    - Test rating_avg recalculation in get_course_details after review
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 14.2 Write property test for rating average calculation
    - **Property 15: Rating Average Calculation**
    - **Validates: Requirements 13.4**

- [ ] 15. Implement home page test file
  - [ ] 15.1 Create `tests/home.test.ts`
    - Test get_home_data returns featured_courses, categories, top_instructors arrays
    - Test each featured_course has required fields (id, title, cover_image, category, difficulty, rating_avg, duration_hours, lesson_count)
    - Test each top_instructor has required fields (id, full_name, avatar_url, rating, bio, course_count, student_total)
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 15.2 Write property test for home page response element completeness
    - **Property 16: Home Page Response Element Completeness**
    - **Validates: Requirements 14.2, 14.3**

- [ ] 16. Implement full lifecycle test file
  - [ ] 16.1 Create `tests/lifecycle.test.ts`
    - Execute full journey: register instructor → create course → add module → add lessons → publish → register student → enroll → complete all lessons → take quiz → earn certificate → verify certificate
    - Verify progress_percent reaches 100 after all lessons
    - Verify quiz score is calculated correctly
    - Verify certificate is publicly verifiable without auth
    - Verify payment split: instructor 70%, platform 30%
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using `fast-check`
- Unit/integration tests validate specific examples and edge cases
- All test files use TypeScript and follow the pattern: `beforeAll` → `createTestContext()` → `createFullCourse()` → test cases
- Tests run sequentially (`fileParallelism: false`) to avoid backend race conditions
- No test cleanup — append-only data strategy

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.5"] },
    { "id": 2, "tasks": ["1.4", "1.6", "1.7"] },
    { "id": 3, "tasks": ["3.1", "13.1"] },
    { "id": 4, "tasks": ["4.1", "5.1", "6.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "5.2", "6.2", "7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1", "10.1", "11.1", "15.1"] },
    { "id": 7, "tasks": ["8.2", "11.2", "12.1", "12.2", "14.1", "15.2"] },
    { "id": 8, "tasks": ["12.3", "12.4", "12.5", "12.6", "12.7", "14.2"] },
    { "id": 9, "tasks": ["16.1"] }
  ]
}
```
