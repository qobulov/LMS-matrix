# Requirements Document

## Introduction

This document specifies the requirements for a comprehensive End-to-End (E2E) automated test suite for the LMS platform. The test suite uses Vitest to make real API requests against the live backend via the `invoke_function` gateway. Tests cover all 26 API methods across all 3 roles (superadmin, instructor, student) and validate authentication flows, RBAC enforcement, course lifecycle, enrollment/progress tracking, quiz scoring, certificate generation/verification, payment calculations, and admin dashboards.

## Glossary

- **Test_Suite**: The complete Vitest-based automated test collection that exercises the LMS backend API
- **Gateway**: The single POST endpoint (`invoke_function`) through which all API requests are routed, accepting `data.method` and `data.object_data`
- **E2E_Test**: An automated test that makes real HTTP requests to the live backend and validates responses
- **Test_Context**: A self-contained test data environment where each test file registers its own users, creates courses, enrolls students, and validates outcomes without depending on external seed data
- **Superadmin**: A user with role `superadmin` having full platform access including finance and user management
- **Instructor**: A user with role `instructor` who can create and manage their own courses
- **Student**: A user with role `student` who can enroll in courses, complete lessons, take quizzes, and earn certificates
- **Access_Token**: A JWT token valid for 15 minutes used to authenticate API requests via the Authorization header
- **Refresh_Token**: A token valid for 7 days used to obtain new access tokens via rotation
- **RBAC**: Role-Based Access Control that restricts API method access based on user role
- **Payment_Split**: The revenue distribution model where the Instructor receives 70% and the platform retains 30%
- **Certificate_UID**: A unique public identifier for a certificate used in public verification
- **Quiz_Score**: The percentage of correctly answered questions calculated as (correct / total) * 100
- **Progress_Percent**: The percentage of completed lessons calculated as (completed_lessons / total_lessons) * 100

## Requirements

### Requirement 1: Test Infrastructure Setup

**User Story:** As a developer, I want a properly configured Vitest test environment with API helper utilities, so that I can run E2E tests against the live backend.

#### Acceptance Criteria

1. THE Test_Suite SHALL include Vitest as a dev dependency with a configuration file that sets a test timeout of at least 30 seconds per test.
2. THE Test_Suite SHALL provide a reusable API helper module that sends POST requests to the Gateway with the correct headers (Content-Type, environment-id, Authorization).
3. THE Test_Suite SHALL provide helper functions for registering users, logging in, and obtaining Access_Token values for each role.
4. THE Test_Suite SHALL use unique email addresses per test run (using timestamps or random suffixes) to avoid conflicts with existing data.
5. THE Test_Suite SHALL organize test files by domain area (auth, courses, enrollment, quiz, certificates, profile, rewards, instructor, admin, rbac, payments).

### Requirement 2: Authentication Flow Tests

**User Story:** As a developer, I want tests that validate the complete authentication lifecycle, so that I can verify login, registration, token refresh, and logout work correctly.

#### Acceptance Criteria

1. WHEN a valid registration request is submitted with full_name, email, password, and role "student", THE Test_Suite SHALL verify the response contains access_token, refresh_token, and a user object with the correct role.
2. WHEN a valid registration request is submitted with role "instructor", THE Test_Suite SHALL verify the response contains access_token, refresh_token, and a user object with role "instructor".
3. WHEN a registration request is submitted with an already-used email, THE Test_Suite SHALL verify the Gateway returns an error response.
4. WHEN a valid login request is submitted with correct email and password, THE Test_Suite SHALL verify the response contains access_token, refresh_token, and the matching user object.
5. WHEN a login request is submitted with an incorrect password, THE Test_Suite SHALL verify the Gateway returns an error response.
6. WHEN a login request is submitted with a non-existent email, THE Test_Suite SHALL verify the Gateway returns an error response.
7. WHEN a valid refresh_token request is submitted, THE Test_Suite SHALL verify a new access_token is returned.
8. WHEN a logout request is submitted with a valid refresh_token, THE Test_Suite SHALL verify the response contains `ok: true`.
9. WHEN a refresh_token request is submitted after logout (revoked token), THE Test_Suite SHALL verify the Gateway returns an error response.

### Requirement 3: Course Management Tests

**User Story:** As a developer, I want tests that validate course creation, listing, and detail retrieval, so that I can verify the course lifecycle works correctly for instructors and public users.

#### Acceptance Criteria

1. WHEN an Instructor creates a course with all required fields (title, description, category, difficulty, language, price, duration_hours, status, what_you_will_learn, requirements), THE Test_Suite SHALL verify the response contains a course object with id, title, and status.
2. WHEN the get_courses method is called without filters, THE Test_Suite SHALL verify the response contains a courses array, total count, page, and page_size fields.
3. WHEN the get_courses method is called with a category filter, THE Test_Suite SHALL verify all returned courses match the specified category.
4. WHEN the get_courses method is called with a search term, THE Test_Suite SHALL verify returned courses have titles matching the search term.
5. WHEN the get_course_details method is called with a valid courses_id, THE Test_Suite SHALL verify the response contains course metadata, instructor info, modules array, and reviews array.
6. WHEN an Instructor creates a module for their own course, THE Test_Suite SHALL verify the response contains a module object with id, title, and order_no.
7. WHEN an Instructor creates a lesson within a module of their own course, THE Test_Suite SHALL verify the response contains a lesson object with id, title, video_url, duration_min, and order_no.
8. WHEN a published course is retrieved via get_course_details, THE Test_Suite SHALL verify the what_you_will_learn and requirements arrays are populated correctly.

### Requirement 4: Enrollment and Progress Tracking Tests

**User Story:** As a developer, I want tests that validate enrollment, lesson progress logging, and progress percentage calculation, so that I can verify the student learning flow works correctly.

#### Acceptance Criteria

1. WHEN a Student enrolls in a course via enroll_course, THE Test_Suite SHALL verify the response contains enrollment_id and status "active".
2. WHEN a Student attempts to enroll in the same course twice, THE Test_Suite SHALL verify the Gateway returns a conflict error.
3. WHEN a Student calls get_my_courses after enrolling, THE Test_Suite SHALL verify the enrollments array contains the enrolled course with progress_percent of 0.
4. WHEN a Student logs lesson progress via log_lesson_progress, THE Test_Suite SHALL verify the response contains an updated progress_percent calculated as (completed_lessons / total_lessons) * 100.
5. WHEN a Student completes all lessons in a course, THE Test_Suite SHALL verify the progress_percent equals 100.
6. WHEN a Student calls get_lesson_viewer with a valid courses_id and lesson_id, THE Test_Suite SHALL verify the response contains course info, modules with lessons, the current lesson details, and completed_lesson_ids.
7. WHEN a Student completes all lessons and has passed the final quiz, THE Test_Suite SHALL verify the enrollment status changes to "completed".

### Requirement 5: Quiz System Tests

**User Story:** As a developer, I want tests that validate quiz retrieval, attempt submission, scoring calculation, and attempt limits, so that I can verify the assessment system works correctly.

#### Acceptance Criteria

1. WHEN a Student calls get_quiz with a valid courses_id, THE Test_Suite SHALL verify the response contains quiz metadata (id, title, time_limit_min, pass_threshold, max_attempts) and questions with options (without is_correct field).
2. WHEN a Student submits a quiz attempt with all correct answers, THE Test_Suite SHALL verify the score equals 100 and passed equals true.
3. WHEN a Student submits a quiz attempt with all incorrect answers, THE Test_Suite SHALL verify the score equals 0 and passed equals false.
4. WHEN a Student submits a quiz attempt with a mix of correct and incorrect answers, THE Test_Suite SHALL verify the score equals (correct_count / total_questions) * 100.
5. WHEN a Student has reached the max_attempts limit for a quiz, THE Test_Suite SHALL verify the Gateway returns an error on the next submission attempt.
6. WHEN a Student passes the quiz and progress_percent equals 100, THE Test_Suite SHALL verify the response contains a certificate object with certificate_uid and issued_at.
7. WHEN a Student passes the quiz but progress_percent is less than 100, THE Test_Suite SHALL verify no certificate is issued in the response.

### Requirement 6: Certificate Generation and Verification Tests

**User Story:** As a developer, I want tests that validate certificate issuance, retrieval, and public verification, so that I can verify the certification system works correctly.

#### Acceptance Criteria

1. WHEN a Student has completed a course (all lessons done and quiz passed), THE Test_Suite SHALL verify a certificate is generated with a unique certificate_uid.
2. WHEN a Student calls get_my_certificates, THE Test_Suite SHALL verify the response contains the certificate with certificate_uid, issued_at, course info, instructor name, and student_name.
3. WHEN verify_certificate is called with a valid certificate_uid (without authentication), THE Test_Suite SHALL verify the response contains valid: true, student_name, course_title, instructor_name, and issued_at.
4. WHEN verify_certificate is called with an invalid certificate_uid, THE Test_Suite SHALL verify the response contains valid: false.
5. THE Test_Suite SHALL verify that certificate_uid is unique per enrollment (no duplicate certificates for the same enrollment).

### Requirement 7: Profile Management Tests

**User Story:** As a developer, I want tests that validate profile retrieval and update for all roles, so that I can verify user profile management works correctly.

#### Acceptance Criteria

1. WHEN a Student calls get_user_profile, THE Test_Suite SHALL verify the response contains id, full_name, email, role "student", and stats with enrolled, active, and completed counts.
2. WHEN an Instructor calls get_user_profile, THE Test_Suite SHALL verify the response contains role "instructor" and stats with courses, students, and completion_rate.
3. WHEN a Superadmin calls get_user_profile, THE Test_Suite SHALL verify the response contains role "superadmin" and stats with total_users, students, and instructors counts.
4. WHEN a user calls update_profile with new full_name and bio, THE Test_Suite SHALL verify the response contains ok: true.
5. WHEN a user calls get_user_profile after updating, THE Test_Suite SHALL verify the updated fields reflect the new values.

### Requirement 8: Rewards System Tests

**User Story:** As a developer, I want tests that validate the rewards and achievements system, so that I can verify students can view their certificates and reward progress.

#### Acceptance Criteria

1. WHEN a Student with earned certificates calls get_my_rewards, THE Test_Suite SHALL verify the response contains a certificates array with certificate_uid, issued_at, course info (including cover_image), and student_name.
2. WHEN a Student calls get_my_rewards, THE Test_Suite SHALL verify the response contains a rewards array with id, title, description, points, and unlocked status.
3. WHEN a Student has no certificates, THE Test_Suite SHALL verify the certificates array in get_my_rewards is empty.

### Requirement 9: Instructor Dashboard Tests

**User Story:** As a developer, I want tests that validate the instructor dashboard data, so that I can verify instructors can view their courses and student counts.

#### Acceptance Criteria

1. WHEN an Instructor calls get_instructor_dashboard, THE Test_Suite SHALL verify the response contains a courses array with id, title, status, description, student_count, and modules.
2. WHEN an Instructor calls get_instructor_dashboard, THE Test_Suite SHALL verify the response contains total_students reflecting the sum of enrolled students across all their courses.
3. WHEN an Instructor creates a new course and a Student enrolls, THE Test_Suite SHALL verify the student_count for that course increments by 1 in the dashboard.

### Requirement 10: Admin Dashboard and Finance Tests

**User Story:** As a developer, I want tests that validate the admin finance summary, reports, and user management, so that I can verify superadmin oversight capabilities.

#### Acceptance Criteria

1. WHEN a Superadmin calls get_finance_summary with preset "month", THE Test_Suite SHALL verify the response contains revenue, expenses, net, is_profit, published_courses, total_courses, total_users, students, and instructors fields.
2. WHEN a paid course enrollment occurs, THE Test_Suite SHALL verify that revenue in get_finance_summary increases by the course price amount.
3. WHEN a paid course enrollment occurs, THE Test_Suite SHALL verify that expenses in get_finance_summary increases by exactly 70% of the course price (instructor payout).
4. THE Test_Suite SHALL verify that net equals revenue minus expenses and is_profit equals true when net is positive.
5. WHEN a Superadmin calls get_reports with report_type "enrollments", THE Test_Suite SHALL verify the response contains rows with course, enrollments, completed, and completion_rate fields.
6. WHEN a Superadmin calls get_reports with report_type "revenue", THE Test_Suite SHALL verify the response contains rows with course, amount, payout, net, and date fields.
7. WHEN a Superadmin calls get_reports with report_type "students", THE Test_Suite SHALL verify the response contains rows with name, email, enrollments, and completed fields.
8. WHEN a Superadmin calls get_reports with report_type "certificates", THE Test_Suite SHALL verify the response contains rows with certificate_uid, student, course, and issued_at fields.
9. WHEN a Superadmin calls get_users with a role filter, THE Test_Suite SHALL verify all returned users have the specified role.
10. WHEN a Superadmin calls get_users with a search term, THE Test_Suite SHALL verify returned users match the search in full_name or email.

### Requirement 11: Payment Calculation Tests

**User Story:** As a developer, I want tests that validate payment calculations including revenue splits, so that I can verify the financial model is correctly implemented.

#### Acceptance Criteria

1. WHEN a Student enrolls in a paid course with price P, THE Test_Suite SHALL verify a payment record is created with amount equal to P.
2. WHEN a Student enrolls in a paid course with price P, THE Test_Suite SHALL verify an instructor_payout record is created with amount equal to P * 0.7 (70% to instructor).
3. THE Test_Suite SHALL verify that platform revenue (30%) equals the course price minus the instructor payout amount.
4. WHEN multiple paid enrollments occur, THE Test_Suite SHALL verify the finance summary revenue equals the sum of all payment amounts.
5. WHEN multiple paid enrollments occur, THE Test_Suite SHALL verify the finance summary expenses equals the sum of all instructor payout amounts (each at 70% of course price).
6. THE Test_Suite SHALL verify net profit calculation: net = total_revenue - total_expenses, where total_expenses = sum(price * 0.7) for all paid enrollments.

### Requirement 12: RBAC Enforcement Tests

**User Story:** As a developer, I want tests that validate role-based access control enforcement, so that I can verify each role can only access authorized methods.

#### Acceptance Criteria

1. WHEN a Student attempts to call create_course, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
2. WHEN a Student attempts to call get_finance_summary, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
3. WHEN a Student attempts to call get_users, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
4. WHEN a Student attempts to call get_reports, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
5. WHEN an Instructor attempts to call get_finance_summary, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
6. WHEN an Instructor attempts to call get_users, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
7. WHEN an Instructor attempts to call get_reports, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
8. WHEN an Instructor attempts to create a module for another instructor's course, THE Test_Suite SHALL verify the Gateway returns a 403 forbidden error.
9. WHEN an unauthenticated request is made to a protected method, THE Test_Suite SHALL verify the Gateway returns a 401 unauthorized error.
10. WHEN an unauthenticated request calls verify_certificate, THE Test_Suite SHALL verify the request succeeds (public method).
11. WHEN an unauthenticated request calls get_courses, THE Test_Suite SHALL verify the request succeeds (public method).

### Requirement 13: Course Review Tests

**User Story:** As a developer, I want tests that validate the course review system, so that I can verify students can only review completed courses and ratings are calculated correctly.

#### Acceptance Criteria

1. WHEN a Student with enrollment status "completed" submits a review with rating and comment, THE Test_Suite SHALL verify the response contains ok: true, new_rating_avg, and review_count.
2. WHEN a Student with enrollment status "active" (not completed) attempts to submit a review, THE Test_Suite SHALL verify the Gateway returns an error.
3. WHEN a Student submits a second review for the same course, THE Test_Suite SHALL verify the Gateway returns a conflict error (one review per student per course).
4. WHEN a review is submitted, THE Test_Suite SHALL verify the course rating_avg is recalculated correctly in get_course_details.

### Requirement 14: Home Page Data Tests

**User Story:** As a developer, I want tests that validate the home page data endpoint, so that I can verify featured courses, categories, and top instructors are returned correctly.

#### Acceptance Criteria

1. WHEN get_home_data is called, THE Test_Suite SHALL verify the response contains featured_courses, categories, and top_instructors arrays.
2. THE Test_Suite SHALL verify each featured_course element contains id, title, cover_image, category, difficulty, rating_avg, duration_hours, and lesson_count.
3. THE Test_Suite SHALL verify each top_instructor element contains id, full_name, avatar_url, rating, bio, course_count, and student_total.

### Requirement 15: Full E2E Lifecycle Test

**User Story:** As a developer, I want a complete end-to-end lifecycle test that exercises the entire student journey from registration to certification, so that I can verify all systems work together correctly.

#### Acceptance Criteria

1. THE Test_Suite SHALL include a full lifecycle test that executes: register instructor → create course → add modules → add lessons → publish course → register student → enroll → complete all lessons → take quiz → earn certificate → verify certificate.
2. WHEN the full lifecycle test completes, THE Test_Suite SHALL verify the Progress_Percent reaches 100 after all lessons are completed.
3. WHEN the full lifecycle test completes, THE Test_Suite SHALL verify the Quiz_Score is calculated correctly based on submitted answers.
4. WHEN the full lifecycle test completes, THE Test_Suite SHALL verify the certificate is publicly verifiable via verify_certificate without authentication.
5. WHEN the full lifecycle test completes, THE Test_Suite SHALL verify the Payment_Split is correct: instructor receives exactly 70% and platform retains 30% of the course price.
