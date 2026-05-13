package lms

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type invokeRequest struct {
	Data struct {
		Method     string          `json:"method"`
		ObjectData json.RawMessage `json:"object_data"`
	} `json:"data"`
}

// Dispatch routes invoke_function methods.
func (s *Service) Dispatch(ctx context.Context, method string, objectData json.RawMessage, authHeader string) (any, int) {
	var data map[string]json.RawMessage
	if len(objectData) > 0 && string(objectData) != "null" {
		_ = json.Unmarshal(objectData, &data)
	}
	if data == nil {
		data = map[string]json.RawMessage{}
	}

	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer"))
	var claims *AccessClaims
	if token != "" {
		var err error
		claims, err = s.ParseAccess(token)
		if err != nil {
			claims = nil
		}
	}

	switch method {
	case "login":
		return s.handleLogin(ctx, data)
	case "register":
		return s.handleRegister(ctx, data)
	case "refresh_token":
		return s.handleRefresh(ctx, data)
	case "logout":
		return s.handleLogout(ctx, data)
	case "get_home_data":
		return s.handleGetHomeData(ctx)
	case "get_courses":
		return s.handleGetCourses(ctx, data)
	case "get_course_details":
		return s.handleGetCourseDetails(ctx, data)
	case "create_course":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "instructor" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleCreateCourse(ctx, c, data)
		})
	case "update_course":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "instructor" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleUpdateCourse(ctx, c, data)
		})
	case "create_course_review":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "student" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleCreateCourseReview(ctx, c, data)
		})
	case "enroll_course":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "student" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleEnrollCourse(ctx, c, data)
		})
	case "get_my_courses":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "student" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleGetMyCourses(ctx, c)
		})
	case "get_lesson_viewer":
		return s.handleGetLessonViewer(ctx, claims, data)
	case "log_lesson_progress":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "student" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleLogLessonProgress(ctx, c, data)
		})
	case "get_quiz":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "student" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleGetQuiz(ctx, c, data)
		})
	case "submit_quiz_attempt":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "student" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleSubmitQuiz(ctx, c, data)
		})
	case "get_my_certificates":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "student" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleGetMyCertificates(ctx, c)
		})
	case "verify_certificate":
		return s.handleVerifyCertificate(ctx, data)
	case "get_user_profile":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			return s.handleGetUserProfile(ctx, c)
		})
	case "update_profile":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			return s.handleUpdateProfile(ctx, c, data)
		})
	case "get_my_rewards":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			return s.handleGetMyRewards(ctx, c)
		})
	case "get_instructor_dashboard":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "instructor" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleInstructorDashboard(ctx, c)
		})
	case "create_module":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "instructor" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleCreateModule(ctx, c, data)
		})
	case "create_lesson":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "instructor" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleCreateLesson(ctx, c, data)
		})
	case "get_finance_summary":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "superadmin" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleFinanceSummary(ctx, data)
		})
	case "get_reports":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "superadmin" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleGetReports(ctx, data)
		})
	case "get_users":
		return s.requireAuth(claims, func(c *AccessClaims) (any, int) {
			if c.Role != "superadmin" {
				return map[string]string{"message": "forbidden"}, http.StatusForbidden
			}
			return s.handleGetUsers(ctx, data)
		})
	default:
		return map[string]string{"message": fmt.Sprintf("unknown method: %s", method)}, http.StatusBadRequest
	}
}

func (s *Service) requireAuth(claims *AccessClaims, fn func(*AccessClaims) (any, int)) (any, int) {
	if claims == nil {
		return map[string]string{"message": "authentication required"}, http.StatusUnauthorized
	}
	return fn(claims)
}

// Decode helpers
func rawString(data map[string]json.RawMessage, key string) (string, bool) {
	v, ok := data[key]
	if !ok || len(v) == 0 {
		return "", false
	}
	var str string
	if err := json.Unmarshal(v, &str); err != nil {
		return "", false
	}
	return str, true
}

func rawInt(data map[string]json.RawMessage, key string) (int, bool) {
	v, ok := data[key]
	if !ok {
		return 0, false
	}
	var i int
	if err := json.Unmarshal(v, &i); err != nil {
		var f float64
		if err2 := json.Unmarshal(v, &f); err2 != nil {
			return 0, false
		}
		return int(f), true
	}
	return i, true
}

func rawBool(data map[string]json.RawMessage, key string) (bool, bool) {
	v, ok := data[key]
	if !ok {
		return false, false
	}
	var b bool
	if err := json.Unmarshal(v, &b); err != nil {
		return false, false
	}
	return b, true
}

func parseUUID(data map[string]json.RawMessage, key string) (uuid.UUID, bool) {
	s, ok := rawString(data, key)
	if !ok {
		return uuid.Nil, false
	}
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil, false
	}
	return id, true
}

func periodBoundsFromData(data map[string]json.RawMessage) (time.Time, time.Time) {
	preset, _ := rawString(data, "preset")
	if preset == "" {
		preset = "month"
	}
	var startPtr, endPtr *string
	if s, ok := rawString(data, "period_start"); ok {
		startPtr = &s
	}
	if e, ok := rawString(data, "period_end"); ok {
		endPtr = &e
	}
	return periodBounds(preset, startPtr, endPtr)
}

func periodBounds(preset string, startS, endS *string) (time.Time, time.Time) {
	now := time.Now().UTC()
	if startS != nil && endS != nil && *startS != "" && *endS != "" {
		start, err := time.Parse("2006-01-02", *startS)
		if err != nil {
			start = now.AddDate(0, -1, 0)
		}
		end, err := time.Parse("2006-01-02", *endS)
		if err != nil {
			end = now
		}
		end = end.Add(24*time.Hour - time.Nanosecond)
		return start.UTC(), end.UTC()
	}
	switch preset {
	case "day":
		start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		return start, now
	case "week":
		return now.AddDate(0, 0, -7), now
	default:
		return now.AddDate(0, -1, 0), now
	}
}
