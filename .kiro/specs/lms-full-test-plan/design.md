# Design Document

## Overview

This document describes the architecture and design of the LMS E2E test suite. The suite uses Vitest to make real HTTP requests against the live backend gateway (`invoke_function`), validating all 26 API methods across 3 roles (superadmin, instructor, student). Each test file is self-contained — it registers its own users, creates its own data, and cleans up nothing (append-only test data strategy).

## Architecture

```
tests/
├── vitest.config.ts          # Vitest configuration (30s timeout, sequential)
├── helpers/
│   ├── api-client.ts         # Low-level gateway POST wrapper
│   ├── auth.ts               # Register/login helpers, token management
│   ├── factories.ts          # Test data factories (courses, modules, lessons, quizzes)
│   └── constants.ts          # Environment config, shared values
├── auth.test.ts              # Requirement 2: Authentication flows
├── courses.test.ts           # Requirement 3: Course management
├── enrollment.test.ts        # Requirement 4: Enrollment & progress
├── quiz.test.ts              # Requirement 5: Quiz system
├── certificates.test.ts     # Requirement 6: Certificate generation & verification
├── profile.test.ts           # Requirement 7: Profile management
├── rewards.test.ts           # Requirement 8: Rewards system
├── instructor.test.ts        # Requirement 9: Instructor dashboard
├── admin.test.ts             # Requirement 10: Admin dashboard & finance
├── payments.test.ts          # Requirement 11: Payment calculations
├── rbac.test.ts              # Requirement 12: RBAC enforcement
├── reviews.test.ts           # Requirement 13: Course reviews
├── home.test.ts              # Requirement 14: Home page data
└── lifecycle.test.ts         # Requirement 15: Full E2E lifecycle
```

## Components and Interfaces

### 1. API Client Module (`helpers/api-client.ts`)

The core HTTP wrapper that mirrors the frontend's `callGateway` function but runs in Node.js (no browser APIs).

```typescript
interface GatewayOptions {
  token?: string;
  headers?: Record<string, string>;
}

interface GatewayResponse<T = unknown> {
  data: T;
}

/**
 * Sends a POST request to the invoke_function gateway.
 * Constructs the body as { data: { method, object_data } }.
 * Attaches Content-Type, environment-id, and optional Authorization headers.
 * Unwraps the u-code response envelope to return the inner data payload.
 * Throws on HTTP errors or status: "error" responses.
 */
export async function callGateway<T = unknown>(
  method: string,
  objectData: Record<string, unknown> = {},
  options: GatewayOptions = {}
): Promise<T>;

/**
 * Same as callGateway but returns the raw response without throwing on errors.
 * Used for testing error cases (403, 401, duplicate conflicts).
 */
export async function callGatewayRaw(
  method: string,
  objectData: Record<string, unknown> = {},
  options: GatewayOptions = {}
): Promise<{ ok: boolean; status: number; data: unknown }>;
```

**Implementation details:**
- Uses native `fetch` (Node 18+ built-in)
- Reads `GATEWAY_URL`, `ENVIRONMENT_ID`, `PROJECT_ID` from environment or constants
- Unwraps the u-code double-envelope pattern (`response.data.data` → inner payload)
- Provides both throwing (`callGateway`) and non-throwing (`callGatewayRaw`) variants

### 2. Authentication Helper (`helpers/auth.ts`)

Manages user registration, login, and token storage for test contexts.

```typescript
interface TestUser {
  id: string;
  fullName: string;
  email: string;
  role: 'superadmin' | 'instructor' | 'student';
  accessToken: string;
  refreshToken: string;
}

/**
 * Generates a unique email using timestamp + random suffix.
 * Format: `test-{role}-{timestamp}-{random4}@lms-test.local`
 */
export function generateUniqueEmail(role: string): string;

/**
 * Registers a new user with the given role and returns TestUser with tokens.
 * Uses generateUniqueEmail for conflict-free registration.
 */
export async function registerUser(role: 'student' | 'instructor'): Promise<TestUser>;

/**
 * Logs in with existing credentials and returns TestUser with fresh tokens.
 */
export async function loginUser(email: string, password: string): Promise<TestUser>;

/**
 * Logs in as the pre-seeded superadmin account.
 * Superadmin cannot be registered via API — uses known credentials from env.
 */
export async function loginAsSuperadmin(): Promise<TestUser>;

/**
 * Creates a full test context: registers an instructor, a student, and logs in superadmin.
 * Returns all three TestUser objects for use in test files.
 */
export async function createTestContext(): Promise<{
  superadmin: TestUser;
  instructor: TestUser;
  student: TestUser;
}>;
```

**Design decisions:**
- Each test file calls `createTestContext()` in `beforeAll` to get isolated users
- The default test password is a constant (`TEST_PASSWORD = 'TestPass123!'`)
- Superadmin credentials come from environment variables (`SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`)
- Email uniqueness uses `Date.now()` + 4-char random hex suffix

### 3. Test Data Factories (`helpers/factories.ts`)

Provides builder functions that create complete test data through the API.

```typescript
interface TestCourse {
  id: string;
  title: string;
  status: string;
  modules: TestModule[];
  lessons: TestLesson[];
  quizId?: string;
  questions?: QuizQuestion[];
}

interface TestModule {
  id: string;
  title: string;
  orderNo: number;
}

interface TestLesson {
  id: string;
  title: string;
  moduleId: string;
  videoUrl: string;
  durationMin: number;
}

interface QuizQuestion {
  id: string;
  prompt: string;
  options: { id: string; optionText: string; isCorrect: boolean }[];
}

/**
 * Creates a published course with modules, lessons, and a final quiz.
 * Returns the full TestCourse object with all IDs populated.
 *
 * Steps:
 * 1. create_course (status: "published")
 * 2. create_module (1 module)
 * 3. create_lesson (N lessons in that module)
 * 4. Quiz is created by the backend as part of course setup
 *    (or via a separate create_quiz method if available)
 */
export async function createFullCourse(
  instructorToken: string,
  options?: {
    title?: string;
    price?: number;
    lessonCount?: number;
    category?: string;
    difficulty?: string;
  }
): Promise<TestCourse>;

/**
 * Creates a minimal course (draft, no lessons) for simple tests.
 */
export async function createMinimalCourse(
  instructorToken: string,
  overrides?: Partial<CoursePayload>
): Promise<{ id: string; title: string; status: string }>;

/**
 * Enrolls a student in a course and returns the enrollment_id.
 */
export async function enrollStudent(
  studentToken: string,
  courseId: string
): Promise<string>;

/**
 * Completes all lessons in a course for a student.
 * Calls log_lesson_progress for each lesson sequentially.
 * Returns the final progress response.
 */
export async function completeAllLessons(
  studentToken: string,
  courseId: string,
  lessonIds: string[]
): Promise<{ progressPercent: number; status: string }>;

/**
 * Submits a quiz attempt with specified answers.
 * If correctAnswers is provided, uses those; otherwise submits all correct.
 */
export async function submitQuiz(
  studentToken: string,
  courseId: string,
  quizId: string,
  answers: { questionId: string; selectedOptionIds: string[] }[],
  timeSpentSec?: number
): Promise<{ score: number; passed: boolean; certificate?: { id: string; issuedAt: string } }>;
```

**Design decisions:**
- Factories make real API calls — no mocking
- `createFullCourse` is the primary factory used by most test files
- Quiz questions/correct answers are retrieved via a helper that the instructor can access (or stored during creation)
- Each factory returns typed objects with all IDs needed for subsequent test steps

### 4. Constants Module (`helpers/constants.ts`)

```typescript
/** Gateway endpoint URL with project-id query param */
export const GATEWAY_URL: string;

/** Environment ID header value */
export const ENVIRONMENT_ID: string;

/** Default password used for all test user registrations */
export const TEST_PASSWORD = 'TestPass123!';

/** Superadmin credentials (from env vars) */
export const SUPERADMIN_EMAIL: string;
export const SUPERADMIN_PASSWORD: string;

/** Payment split ratios */
export const INSTRUCTOR_SHARE = 0.7;
export const PLATFORM_SHARE = 0.3;

/** Quiz defaults */
export const DEFAULT_PASS_THRESHOLD = 70;
export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_TIME_LIMIT_MIN = 30;
```

## Data Flow

### Test Execution Flow

```
beforeAll (per file)
  ├── createTestContext() → register instructor, student; login superadmin
  ├── createFullCourse(instructor.token) → course with modules, lessons, quiz
  └── (optional) enrollStudent(student.token, courseId)

test cases
  ├── Make API calls using tokens from context
  ├── Assert response shapes and values
  └── Chain operations (enroll → progress → quiz → certificate)

afterAll
  └── (nothing — append-only data, no cleanup)
```

### Gateway Request Flow

```
Test Code
  → callGateway(method, objectData, { token })
    → POST {GATEWAY_URL}?project-id={PROJECT_ID}
      Headers: Content-Type, environment-id, Authorization
      Body: { data: { method, object_data } }
    ← Response: { data: { ...result } } or { status: "error", data: { message } }
  → Unwrap envelope → return inner data
```

### 5. Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Run test files sequentially (shared backend state)
    fileParallelism: false,
    // Tests within a file run sequentially (order matters for lifecycle)
    sequence: { concurrent: false },
    include: ['tests/**/*.test.ts'],
  },
});
```

**Key configuration choices:**
- `testTimeout: 30_000` — real API calls may be slow
- `hookTimeout: 60_000` — `beforeAll` creates multiple users and courses
- `fileParallelism: false` — prevents race conditions on shared backend state (e.g., finance totals)
- Sequential test execution within files — many tests depend on prior state (enroll → progress → quiz)

### 6. Test File Structure Pattern

Each test file follows this pattern:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestContext, type TestUser } from './helpers/auth';
import { createFullCourse, type TestCourse } from './helpers/factories';
import { callGateway, callGatewayRaw } from './helpers/api-client';

describe('Domain: Feature Name', () => {
  let instructor: TestUser;
  let student: TestUser;
  let superadmin: TestUser;
  let course: TestCourse;

  beforeAll(async () => {
    const ctx = await createTestContext();
    instructor = ctx.instructor;
    student = ctx.student;
    superadmin = ctx.superadmin;
    course = await createFullCourse(instructor.accessToken);
  });

  it('should do something', async () => {
    const result = await callGateway('method_name', { key: 'value' }, {
      token: student.accessToken,
    });
    expect(result).toHaveProperty('expected_field');
  });
});
```

### 7. Error Response Handling

The test suite distinguishes between:
- **Success responses**: Unwrapped data returned directly
- **Permission errors (403)**: Gateway returns error with forbidden message
- **Auth errors (401)**: Gateway returns error for missing/invalid token
- **Conflict errors**: Duplicate enrollment, duplicate review, duplicate email
- **Validation errors**: Missing required fields, invalid data

```typescript
// Testing error cases
it('should return 403 for unauthorized access', async () => {
  const result = await callGatewayRaw('get_finance_summary', {}, {
    token: student.accessToken,
  });
  expect(result.ok).toBe(false);
  // Check for error indicator in response
  expect(result.data).toHaveProperty('status', 'error');
});
```

## Data Models

### Test User Model

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | User ID from backend |
| fullName | string | Display name |
| email | string | Unique email (generated) |
| role | enum | 'superadmin' \| 'instructor' \| 'student' |
| accessToken | string | JWT for API calls (15min TTL) |
| refreshToken | string | For token rotation (7day TTL) |

### Test Course Model

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Course ID |
| title | string | Course title |
| status | string | 'draft' \| 'published' |
| price | number | Course price (0 for free) |
| modules | TestModule[] | Created modules |
| lessons | TestLesson[] | All lessons across modules |
| quizId | string | Final quiz ID |
| questions | QuizQuestion[] | Quiz questions with correct answers |

### Payment Verification Model

| Field | Type | Description |
|-------|------|-------------|
| coursePrice | number | Original course price (P) |
| paymentAmount | number | Should equal P |
| instructorPayout | number | Should equal P × 0.7 |
| platformShare | number | Should equal P × 0.3 |
| net | number | revenue − expenses |

## Error Handling

### API Client Error Strategy

1. **Throwing variant (`callGateway`)**: Used for happy-path tests. Throws descriptive errors on failure so tests fail fast with clear messages.
2. **Non-throwing variant (`callGatewayRaw`)**: Used for error-case tests (RBAC, duplicates, invalid input). Returns the raw response for assertion.

### Test Resilience

- **Unique emails per run**: Prevents conflicts with prior test data
- **No shared state between files**: Each file creates its own users and courses
- **Sequential execution**: Prevents race conditions on backend state
- **Generous timeouts**: Accounts for network latency and cold starts

### Known Constraints

- **Superadmin cannot be registered via API**: Must use pre-seeded credentials
- **Quiz creation**: May require instructor-level API or be auto-created with course
- **No cleanup**: Tests are append-only; backend accumulates test data over time
- **Backend field naming**: Uses `courses_id` (not `courses_id`) in some methods — the API client normalizes this

## Testing Strategy

### Test Types

The test suite employs two complementary testing approaches:

1. **Integration tests (majority)**: Verify specific API behaviors with concrete examples — registration flows, RBAC enforcement, lifecycle sequences. These make real API calls and validate response shapes and values.

2. **Property-based tests (targeted)**: Verify universal invariants that should hold across all inputs — payment split calculations, progress percentage formulas, filter correctness. These use generated inputs to validate mathematical and logical properties.

### Test Organization

- **One file per domain**: Each test file covers one requirement area
- **Self-contained setup**: Each file registers its own users and creates its own data via `beforeAll`
- **Sequential execution**: Files run sequentially to avoid backend race conditions
- **No cleanup**: Append-only strategy — tests never delete data

### Property Test Configuration

- Minimum 100 iterations per property test
- Each property test references its design document property number
- Tag format: **Feature: lms-full-test-plan, Property {number}: {title}**
- Properties that require real API calls (3, 4, 13, 14) use pre-created test data with varied inputs rather than random generation against the live API

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Helper Header Construction

*For any* method name and optional access token, the API client SHALL construct a request with `Content-Type: application/json`, the correct `environment-id` header, and (when a token is provided) an `Authorization: Bearer <token>` header.

**Validates: Requirements 1.2**

### Property 2: Email Uniqueness

*For any* two invocations of the email generator function (even within the same millisecond), the generated email addresses SHALL be distinct.

**Validates: Requirements 1.4**

### Property 3: Course Category Filter Correctness

*For any* category value passed to `get_courses`, every course in the returned results SHALL have a `category` field matching the filter value.

**Validates: Requirements 3.3**

### Property 4: Course Search Filter Correctness

*For any* search term passed to `get_courses`, every course in the returned results SHALL have a `title` that contains the search term (case-insensitive).

**Validates: Requirements 3.4**

### Property 5: Progress Percentage Calculation

*For any* course with N total lessons and K completed lessons (0 ≤ K ≤ N), the `progress_percent` returned by `log_lesson_progress` SHALL equal `Math.round((K / N) * 100)`.

**Validates: Requirements 4.4, 4.5**

### Property 6: Quiz Score Calculation

*For any* quiz attempt where C questions are answered correctly out of T total questions, the returned `score` SHALL equal `(C / T) * 100`, and `passed` SHALL equal `score >= pass_threshold`.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 7: Certificate UID Uniqueness

*For any* two certificates issued to different enrollments, their `certificate_uid` values SHALL be distinct.

**Validates: Requirements 6.5**

### Property 8: Profile Update Round-Trip

*For any* valid profile update with `full_name` and `bio` values, calling `get_user_profile` after `update_profile` SHALL return the updated values in the corresponding fields.

**Validates: Requirements 7.4, 7.5**

### Property 9: Enrollment Increments Student Count

*For any* course, when a new student enrolls, the `student_count` for that course SHALL increase by exactly 1.

**Validates: Requirements 9.3**

### Property 10: Payment Split Correctness

*For any* paid course enrollment with price P, the system SHALL create a payment record with `amount = P` and an instructor payout record with `amount = P × 0.7`. The platform share SHALL equal `P × 0.3`.

**Validates: Requirements 10.2, 10.3, 11.1, 11.2, 11.3**

### Property 11: Finance Summary Invariant

*For any* finance summary response, `net` SHALL equal `revenue - expenses`, and `is_profit` SHALL equal `net > 0`.

**Validates: Requirements 10.4, 11.6**

### Property 12: Finance Accumulation

*For any* set of paid enrollments within a period, the finance summary `revenue` SHALL equal the sum of all payment amounts, and `expenses` SHALL equal the sum of all instructor payout amounts.

**Validates: Requirements 11.4, 11.5**

### Property 13: User Role Filter Correctness

*For any* role value passed to `get_users`, every user in the returned results SHALL have a `role` field matching the filter value.

**Validates: Requirements 10.9**

### Property 14: User Search Filter Correctness

*For any* search term passed to `get_users`, every user in the returned results SHALL have the search term present in either `full_name` or `email` (case-insensitive).

**Validates: Requirements 10.10**

### Property 15: Rating Average Calculation

*For any* course with N reviews having ratings [r₁, r₂, ..., rₙ], the `rating_avg` SHALL equal the arithmetic mean `(r₁ + r₂ + ... + rₙ) / N`.

**Validates: Requirements 13.4**

### Property 16: Home Page Response Element Completeness

*For any* element in the `featured_courses` array, it SHALL contain `id`, `title`, `cover_image`, `category`, `difficulty`, `rating_avg`, `duration_hours`, and `lesson_count`. *For any* element in the `top_instructors` array, it SHALL contain `id`, `full_name`, `avatar_url`, `rating`, `bio`, `course_count`, and `student_total`.

**Validates: Requirements 14.2, 14.3**
