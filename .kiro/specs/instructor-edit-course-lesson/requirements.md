# Requirements Document

## Introduction

This feature adds two new backend methods (`update_course` and `update_lesson`) to the LMS platform, enabling instructors to edit their own course details and lesson content. Superadmins can edit any course. The methods follow the existing `invoke_function` pattern and support partial updates — only provided fields are modified.

## Glossary

- **Gateway**: The U-Code invoke_function API endpoint that routes all backend requests
- **Instructor**: A user with role "instructor" who creates and manages courses
- **Superadmin**: A user with role "superadmin" who has full platform access
- **Student**: A user with role "student" who enrolls in and consumes courses
- **Course_Owner**: The instructor whose `users.id` matches `courses.instructor_id` for a given course
- **Partial_Update**: An update operation where only the fields present in `object_data` are modified; absent fields remain unchanged
- **Course_Objectives**: The "What you will learn" items stored in the `course_objectives` table
- **Course_Requirements**: The prerequisite items stored in the `course_requirements` table
- **Token_User**: The authenticated user identified by the JWT access token in the request header

## Requirements

### Requirement 1: Course Ownership Verification

**User Story:** As an instructor, I want the system to verify that I own a course before allowing edits, so that no one else can modify my course content.

#### Acceptance Criteria

1. WHEN an `update_course` or `update_lesson` request is received, THE Gateway SHALL verify that `courses.instructor_id` equals `Token_User.user_id` before performing input validation or processing the update
2. WHILE the Token_User role is "superadmin", THE Gateway SHALL bypass the ownership check and allow the update on any course regardless of `courses.instructor_id`
3. IF the Token_User is not the Course_Owner and is not a superadmin, THEN THE Gateway SHALL reject the request and return an error response indicating the user does not have permission to edit the course, without processing any update
4. IF the Token_User role is "student", THEN THE Gateway SHALL reject the request and return an error response indicating the user does not have permission to edit the course
5. IF the `courses_id` provided in the request does not match any existing course, THEN THE Gateway SHALL return an error response indicating the course was not found, prior to performing the ownership check

### Requirement 2: Update Course Details

**User Story:** As an instructor, I want to edit my course details (title, description, price, etc.), so that I can keep my course information accurate and up to date.

#### Acceptance Criteria

1. WHEN an `update_course` request is received with valid `courses_id` and at least one updatable field, THE Gateway SHALL update only the provided fields in the `courses` table WHERE `id` equals `courses_id`
2. IF an `update_course` request is received with `courses_id` but no updatable fields in `object_data`, THEN THE Gateway SHALL return an error response with message "No updatable fields provided"
3. THE Gateway SHALL support Partial_Update for the following course fields: `title`, `description`, `cover_image`, `category`, `difficulty`, `language`, `price`, `duration_hours`, `status`
4. WHEN the `what_you_will_learn` array is provided in `object_data`, THE Gateway SHALL delete all existing rows in `course_objectives` WHERE `courses_id` matches, then insert the new items with sequential `order_no` values starting from 0, where each item is a non-empty string with a maximum length of 500 characters and the array contains no more than 20 items
5. WHEN the `requirements` array is provided in `object_data`, THE Gateway SHALL delete all existing rows in `course_requirements` WHERE `courses_id` matches, then insert the new items with sequential `order_no` values starting from 0, where each item is a non-empty string with a maximum length of 500 characters and the array contains no more than 20 items
6. WHEN the `what_you_will_learn` or `requirements` array is provided as an empty array, THE Gateway SHALL delete all existing rows in the corresponding table WHERE `courses_id` matches and insert no new rows
7. WHEN the update succeeds, THE Gateway SHALL return `{ "ok": true }`
8. IF the `courses_id` does not match any existing course, THEN THE Gateway SHALL return an error response with message "Course not found"
9. IF the `title` field is provided and exceeds 255 characters, THEN THE Gateway SHALL return an error response with message "Title must not exceed 255 characters"

### Requirement 3: Course Status Transitions

**User Story:** As an instructor, I want to publish or unpublish my course, so that I can control when students can discover and enroll in it.

#### Acceptance Criteria

1. WHEN the `status` field is provided as "published" and the current course status is "draft", THE Gateway SHALL update the course status to "published" and return `{ "ok": true }`
2. WHEN the `status` field is provided as "draft" and the current course status is "published", THE Gateway SHALL update the course status to "draft" and return `{ "ok": true }`
3. IF the `status` field value is not "draft" or "published", THEN THE Gateway SHALL return an error response with message "Invalid status value. Allowed values: draft, published"
4. WHEN the `status` field is provided and the value equals the current course status, THE Gateway SHALL return `{ "ok": true }` without modifying the record
5. WHEN the `status` field is provided as "published" and the course has zero lessons across all modules, THE Gateway SHALL return an error response with message "Cannot publish a course with no lessons"

### Requirement 4: Update Lesson Details

**User Story:** As an instructor, I want to edit lesson details in my course, so that I can fix errors or update video content without recreating the lesson.

#### Acceptance Criteria

1. WHEN an `update_lesson` request is received with valid `courses_id` and `lesson_id`, THE Gateway SHALL verify course ownership by joining `lessons` through `modules` (WHERE `modules.courses_id` equals `courses_id`) and then update only the provided fields in the `lessons` table WHERE `id` equals `lesson_id`
2. THE Gateway SHALL support Partial_Update for the following lesson fields: `title` (maximum 255 characters), `video_url`, `duration_min`, `is_preview`
3. WHEN the update succeeds, THE Gateway SHALL return `{ "ok": true }`
4. IF the `lesson_id` does not match any existing lesson within the specified course (via the `modules` relationship), THEN THE Gateway SHALL return an error response with message "Lesson not found"
5. IF the `courses_id` does not match any existing course, THEN THE Gateway SHALL return an error response with message "Course not found"
6. IF the `video_url` field is provided and is an empty string, THEN THE Gateway SHALL return an error response with message "video_url cannot be empty"
7. IF no updatable fields (`title`, `video_url`, `duration_min`, `is_preview`) are provided in `object_data`, THEN THE Gateway SHALL return an error response with message "No updatable fields provided"

### Requirement 5: Input Validation

**User Story:** As a platform operator, I want the system to validate input data before processing updates, so that invalid data does not corrupt the database.

#### Acceptance Criteria

1. WHEN the `difficulty` field is provided in `update_course`, THE Gateway SHALL validate that the value is one of: "beginner", "intermediate", "advanced"
2. IF the `difficulty` value is not one of "beginner", "intermediate", or "advanced", THEN THE Gateway SHALL return an error response with message "Invalid difficulty value. Allowed values: beginner, intermediate, advanced" and SHALL NOT modify the database
3. WHEN the `price` field is provided in `update_course`, THE Gateway SHALL validate that the value is a numeric type with at most 2 decimal places, greater than or equal to 0 and not exceeding 9,999,999,999.99
4. IF the `price` value is not a valid non-negative number, or exceeds 9,999,999,999.99, or has more than 2 decimal places, THEN THE Gateway SHALL return an error response with message "Price must be a non-negative number" and SHALL NOT modify the database
5. WHEN the `duration_min` field is provided in `update_lesson`, THE Gateway SHALL validate that the value is an integer greater than or equal to 0
6. IF the `duration_min` value is not a valid non-negative integer, THEN THE Gateway SHALL return an error response with message "Duration must be a non-negative number" and SHALL NOT modify the database
7. WHEN any field fails validation in `update_course` or `update_lesson`, THE Gateway SHALL perform validation after authentication and ownership checks but before any database write operation
8. IF the `price` field is provided but its value is not of numeric type, or the `duration_min` field is provided but its value is not of integer type, THEN THE Gateway SHALL return an error response indicating the value has an invalid type

### Requirement 6: Authentication Requirement

**User Story:** As a platform operator, I want both update methods to require authentication, so that anonymous users cannot modify course content.

#### Acceptance Criteria

1. THE Gateway SHALL require a valid JWT access token in the Authorization header (format: `Bearer <token>`) for both `update_course` and `update_lesson` methods, where a valid token is one that is correctly signed, not expired, and contains `user_id` and `role` claims
2. IF the Authorization header is missing or the token is malformed, THEN THE Gateway SHALL return an error response with message "Unauthorized"
3. IF the JWT access token signature verification fails or the token has expired, THEN THE Gateway SHALL return an error response with message "Unauthorized"
