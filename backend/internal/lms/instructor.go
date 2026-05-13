package lms

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

func (s *Service) handleInstructorDashboard(ctx context.Context, c *AccessClaims) (any, int) {
	rows, err := s.Pool.Query(ctx, `
		SELECT co.id, co.title, co.status, co.description,
			(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = co.id) AS student_count
		FROM courses co WHERE co.instructor_id = $1 ORDER BY co.created_at DESC`, c.UserID)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer rows.Close()
	var courses []map[string]any
	for rows.Next() {
		var id uuid.UUID
		var title, status, desc string
		var sc int
		_ = rows.Scan(&id, &title, &status, &desc, &sc)
		mr, _ := s.Pool.Query(ctx, `SELECT id, title FROM modules WHERE course_id = $1 ORDER BY order_no`, id)
		var mods []map[string]any
		for mr.Next() {
			var mid uuid.UUID
			var mt string
			_ = mr.Scan(&mid, &mt)
			mods = append(mods, map[string]any{"id": mid.String(), "title": mt})
		}
		mr.Close()
		courses = append(courses, map[string]any{
			"id": id.String(), "title": title, "status": status, "description": desc,
			"student_count": sc, "modules": mods,
		})
	}
	var totalStudents int
	_ = s.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM enrollments e JOIN courses co ON co.id = e.course_id WHERE co.instructor_id = $1`, c.UserID).Scan(&totalStudents)
	return map[string]any{"courses": courses, "total_students": totalStudents}, http.StatusOK
}

func (s *Service) handleCreateModule(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	title, ok := rawString(data, "title")
	if !ok || title == "" {
		return map[string]string{"message": "title required"}, http.StatusBadRequest
	}
	var inst uuid.UUID
	err := s.Pool.QueryRow(ctx, `SELECT instructor_id FROM courses WHERE id = $1`, cid).Scan(&inst)
	if err != nil {
		return map[string]string{"message": "course not found"}, http.StatusNotFound
	}
	if inst != c.UserID {
		return map[string]string{"message": "forbidden"}, http.StatusForbidden
	}
	var maxOrder int
	_ = s.Pool.QueryRow(ctx, `SELECT COALESCE(MAX(order_no), -1) FROM modules WHERE course_id = $1`, cid).Scan(&maxOrder)
	next := maxOrder + 1
	var mid uuid.UUID
	err = s.Pool.QueryRow(ctx, `
		INSERT INTO modules (course_id, title, order_no) VALUES ($1,$2,$3) RETURNING id`, cid, title, next).Scan(&mid)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	return map[string]any{"module": map[string]any{"id": mid.String(), "title": title, "order_no": next}}, http.StatusOK
}

func (s *Service) handleCreateLesson(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	mid, ok := parseUUID(data, "module_id")
	if !ok {
		return map[string]string{"message": "module_id required"}, http.StatusBadRequest
	}
	title, ok := rawString(data, "title")
	if !ok || title == "" {
		return map[string]string{"message": "title required"}, http.StatusBadRequest
	}
	videoURL, ok := rawString(data, "video_url")
	if !ok || videoURL == "" {
		return map[string]string{"message": "video_url required"}, http.StatusBadRequest
	}
	dm, _ := rawInt(data, "duration_min")
	prev, prevOk := rawBool(data, "is_preview")
	if !prevOk {
		prev = false
	}

	var inst uuid.UUID
	var modCourse uuid.UUID
	err := s.Pool.QueryRow(ctx, `
		SELECT c.instructor_id, m.course_id FROM modules m JOIN courses c ON c.id = m.course_id WHERE m.id = $1`, mid,
	).Scan(&inst, &modCourse)
	if err != nil || modCourse != cid {
		return map[string]string{"message": "module not found"}, http.StatusNotFound
	}
	if inst != c.UserID {
		return map[string]string{"message": "forbidden"}, http.StatusForbidden
	}

	var maxOrder int
	_ = s.Pool.QueryRow(ctx, `SELECT COALESCE(MAX(order_no), -1) FROM lessons WHERE module_id = $1`, mid).Scan(&maxOrder)
	next := maxOrder + 1
	var lid uuid.UUID
	err = s.Pool.QueryRow(ctx, `
		INSERT INTO lessons (module_id, title, video_url, duration_min, is_preview, order_no)
		VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, mid, title, videoURL, dm, prev, next).Scan(&lid)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	return map[string]any{
		"lesson": map[string]any{"id": lid.String(), "title": title, "video_url": videoURL, "duration_min": dm, "order_no": next},
	}, http.StatusOK
}
