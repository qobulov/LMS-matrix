package lms

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (s *Service) handleEnrollCourse(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}

	var price float64
	var status string
	err := s.Pool.QueryRow(ctx, `SELECT price, status FROM courses WHERE id = $1`, cid).Scan(&price, &status)
	if err != nil {
		return map[string]string{"message": "course not found"}, http.StatusNotFound
	}
	if status != "published" {
		return map[string]string{"message": "course not published"}, http.StatusBadRequest
	}

	var existing int
	_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND student_id = $2`, cid, c.UserID).Scan(&existing)
	if existing > 0 {
		return map[string]string{"message": "already enrolled"}, http.StatusConflict
	}

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer tx.Rollback(ctx)

	var eid uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO enrollments (course_id, student_id, status, progress_percent)
		VALUES ($1,$2,'active',0) RETURNING id`, cid, c.UserID).Scan(&eid)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}

	_, _ = tx.Exec(ctx, `UPDATE courses SET student_count = student_count + 1 WHERE id = $1`, cid)

	_, _ = tx.Exec(ctx, `INSERT INTO payments (enrollment_id, amount, status) VALUES ($1,$2,'paid')`, eid, price)

	if price > 0 {
		var inst uuid.UUID
		_ = tx.QueryRow(ctx, `SELECT instructor_id FROM courses WHERE id = $1`, cid).Scan(&inst)
		payout := price * 0.7
		_, _ = tx.Exec(ctx, `
			INSERT INTO instructor_payouts (course_id, instructor_id, amount, model) VALUES ($1,$2,$3,'percentage')`,
			cid, inst, payout)
	}

	if err := tx.Commit(ctx); err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	return map[string]any{"enrollment_id": eid.String(), "status": "active"}, http.StatusOK
}

func (s *Service) handleGetMyCourses(ctx context.Context, c *AccessClaims) (any, int) {
	rows, err := s.Pool.Query(ctx, `
		SELECT e.id, e.status, e.progress_percent, e.course_id
		FROM enrollments e WHERE e.student_id = $1 ORDER BY e.enrolled_at DESC`, c.UserID)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer rows.Close()

	var out []map[string]any
	for rows.Next() {
		var eid, courseID uuid.UUID
		var st string
		var prog int
		_ = rows.Scan(&eid, &st, &prog, &courseID)

		completed := s.completedLessonIDs(ctx, eid)
		attempts := s.quizAttemptsForEnrollment(ctx, eid)
		cert := s.certificateForEnrollment(ctx, eid)
		course := s.courseWithModulesLessons(ctx, courseID)

		out = append(out, map[string]any{
			"id":                   eid.String(),
			"status":               st,
			"progress_percent":     prog,
			"completed_lesson_ids": completed,
			"attempts":             attempts,
			"certificate":          cert,
			"course":               course,
		})
	}
	return map[string]any{"enrollments": out}, http.StatusOK
}

func (s *Service) completedLessonIDs(ctx context.Context, enrollmentID uuid.UUID) []string {
	r, err := s.Pool.Query(ctx, `SELECT lesson_id::text FROM lesson_progress WHERE enrollment_id = $1`, enrollmentID)
	if err != nil {
		return nil
	}
	defer r.Close()
	var ids []string
	for r.Next() {
		var id string
		_ = r.Scan(&id)
		ids = append(ids, id)
	}
	return ids
}

func (s *Service) quizAttemptsForEnrollment(ctx context.Context, enrollmentID uuid.UUID) []map[string]any {
	r, err := s.Pool.Query(ctx, `
		SELECT qa.score, qa.submitted_at FROM quiz_attempts qa WHERE qa.enrollment_id = $1 ORDER BY qa.submitted_at DESC`,
		enrollmentID)
	if err != nil {
		return nil
	}
	defer r.Close()
	var list []map[string]any
	for r.Next() {
		var sc float64
		var sub time.Time
		_ = r.Scan(&sc, &sub)
		list = append(list, map[string]any{"score": sc, "submitted_at": sub.UTC().Format(time.RFC3339)})
	}
	return list
}

func (s *Service) certificateForEnrollment(ctx context.Context, enrollmentID uuid.UUID) any {
	var uid string
	var issued *time.Time
	err := s.Pool.QueryRow(ctx, `SELECT certificate_uid, issued_at FROM certificates WHERE enrollment_id = $1`, enrollmentID).Scan(&uid, &issued)
	if err != nil {
		return nil
	}
	t := ""
	if issued != nil {
		t = issued.UTC().Format(time.RFC3339)
	}
	return map[string]any{"id": uid, "issued_at": t}
}

func (s *Service) courseWithModulesLessons(ctx context.Context, courseID uuid.UUID) map[string]any {
	var title *string
	var cover *string
	_ = s.Pool.QueryRow(ctx, `SELECT title, cover_image FROM courses WHERE id = $1`, courseID).Scan(&title, &cover)
	m := map[string]any{"id": courseID.String()}
	if title != nil {
		m["title"] = *title
	}
	if cover != nil {
		m["cover_image"] = *cover
	}
	mr, _ := s.Pool.Query(ctx, `SELECT id, title FROM modules WHERE course_id = $1 ORDER BY order_no`, courseID)
	var mods []map[string]any
	for mr.Next() {
		var mid uuid.UUID
		var mt string
		_ = mr.Scan(&mid, &mt)
		lr, _ := s.Pool.Query(ctx, `SELECT id, title FROM lessons WHERE module_id = $1 ORDER BY order_no`, mid)
		var les []map[string]any
		for lr.Next() {
			var lid uuid.UUID
			var lt string
			_ = lr.Scan(&lid, &lt)
			les = append(les, map[string]any{"id": lid.String(), "title": lt})
		}
		lr.Close()
		mods = append(mods, map[string]any{"id": mid.String(), "title": mt, "lessons": les})
	}
	mr.Close()
	m["modules"] = mods
	return m
}

func (s *Service) handleGetLessonViewer(ctx context.Context, claims *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	lid, ok := parseUUID(data, "lesson_id")
	if !ok {
		return map[string]string{"message": "lesson_id required"}, http.StatusBadRequest
	}

	var prev bool
	var modCourse uuid.UUID
	err := s.Pool.QueryRow(ctx, `
		SELECT l.is_preview, m.course_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.id = $1`, lid,
	).Scan(&prev, &modCourse)
	if err != nil || modCourse != cid {
		return map[string]string{"message": "lesson not found"}, http.StatusNotFound
	}

	if !prev {
		if claims == nil || claims.Role != "student" {
			return map[string]string{"message": "authentication required"}, http.StatusUnauthorized
		}
		var n int
		_ = s.Pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND student_id = $2`, cid, claims.UserID).Scan(&n)
		if n == 0 {
			return map[string]string{"message": "not enrolled"}, http.StatusForbidden
		}
	}

	var title, cover *string
	_ = s.Pool.QueryRow(ctx, `SELECT title, cover_image FROM courses WHERE id = $1`, cid).Scan(&title, &cover)
	course := map[string]any{"id": cid.String()}
	if title != nil {
		course["title"] = *title
	}
	if cover != nil {
		course["cover_image"] = *cover
	}

	mr, _ := s.Pool.Query(ctx, `SELECT id, title FROM modules WHERE course_id = $1 ORDER BY order_no`, cid)
	var modules []map[string]any
	var completed []string
	if claims != nil && claims.Role == "student" {
		var eid uuid.UUID
		if err := s.Pool.QueryRow(ctx, `
			SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2`, cid, claims.UserID).Scan(&eid); err == nil {
			completed = s.completedLessonIDs(ctx, eid)
		}
	}
	for mr.Next() {
		var mid uuid.UUID
		var mt string
		_ = mr.Scan(&mid, &mt)
		lr, _ := s.Pool.Query(ctx, `SELECT id, title, is_preview FROM lessons WHERE module_id = $1 ORDER BY order_no`, mid)
		var les []map[string]any
		for lr.Next() {
			var id uuid.UUID
			var lt string
			var p bool
			_ = lr.Scan(&id, &lt, &p)
			les = append(les, map[string]any{"id": id.String(), "title": lt, "is_preview": p})
		}
		lr.Close()
		modules = append(modules, map[string]any{"id": mid.String(), "title": mt, "lessons": les})
	}
	mr.Close()

	var lt string
	var dm int
	var vu string
	_ = s.Pool.QueryRow(ctx, `SELECT title, duration_min, video_url FROM lessons WHERE id = $1`, lid).Scan(&lt, &dm, &vu)
	if strings.TrimSpace(vu) == "" {
		return map[string]string{"message": "invalid lesson"}, http.StatusBadRequest
	}

	return map[string]any{
		"course":               course,
		"modules":              modules,
		"lesson":               map[string]any{"id": lid.String(), "title": lt, "video_url": vu, "duration_min": dm},
		"completed_lesson_ids": completed,
	}, http.StatusOK
}

func (s *Service) handleLogLessonProgress(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	lid, ok := parseUUID(data, "lesson_id")
	if !ok {
		return map[string]string{"message": "lesson_id required"}, http.StatusBadRequest
	}

	var eid uuid.UUID
	err := s.Pool.QueryRow(ctx, `
		SELECT e.id FROM enrollments e WHERE e.course_id = $1 AND e.student_id = $2`, cid, c.UserID).Scan(&eid)
	if err != nil {
		return map[string]string{"message": "not enrolled"}, http.StatusForbidden
	}

	var belongs int
	_ = s.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.id = $1 AND m.course_id = $2`, lid, cid).Scan(&belongs)
	if belongs == 0 {
		return map[string]string{"message": "lesson not in course"}, http.StatusBadRequest
	}

	_, _ = s.Pool.Exec(ctx, `
		INSERT INTO lesson_progress (enrollment_id, lesson_id) VALUES ($1,$2)
		ON CONFLICT (enrollment_id, lesson_id) DO NOTHING`, eid, lid)

	total, _ := s.lessonCount(ctx, cid)
	done, _ := s.completedCount(ctx, eid)
	prog := 0
	if total > 0 {
		prog = int(float64(done) / float64(total) * 100)
	}
	if prog > 100 {
		prog = 100
	}

	passed := s.finalQuizPassed(ctx, eid, cid)
	if prog == 100 && passed {
		_, _ = s.Pool.Exec(ctx, `
			UPDATE enrollments SET progress_percent = $1, status = 'completed', completed_at = COALESCE(completed_at, now()) WHERE id = $2`,
			prog, eid)
	} else {
		_, _ = s.Pool.Exec(ctx, `UPDATE enrollments SET progress_percent = $1 WHERE id = $2`, prog, eid)
	}

	completedIDs := s.completedLessonIDs(ctx, eid)
	var st string
	_ = s.Pool.QueryRow(ctx, `SELECT status FROM enrollments WHERE id = $1`, eid).Scan(&st)

	return map[string]any{
		"progress_percent":     prog,
		"status":               st,
		"completed_lesson_ids": completedIDs,
	}, http.StatusOK
}

func (s *Service) lessonCount(ctx context.Context, courseID uuid.UUID) (int, error) {
	var n int
	err := s.Pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = $1`, courseID).Scan(&n)
	return n, err
}

func (s *Service) completedCount(ctx context.Context, enrollmentID uuid.UUID) (int, error) {
	var n int
	err := s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM lesson_progress WHERE enrollment_id = $1`, enrollmentID).Scan(&n)
	return n, err
}

func (s *Service) finalQuizPassed(ctx context.Context, enrollmentID, courseID uuid.UUID) bool {
	var ok bool
	_ = s.Pool.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM quiz_attempts qa
			JOIN quizzes q ON q.id = qa.quiz_id
			WHERE qa.enrollment_id = $1 AND q.course_id = $2 AND q.module_id IS NULL
			AND qa.score >= q.pass_threshold
		)`, enrollmentID, courseID).Scan(&ok)
	return ok
}
