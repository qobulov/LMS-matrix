package lms

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Service) handleGetMyCertificates(ctx context.Context, c *AccessClaims) (any, int) {
	rows, err := s.Pool.Query(ctx, `
		SELECT cert.certificate_uid, cert.issued_at, co.id, co.title, ins.full_name AS instructor_name, st.full_name AS student_name
		FROM certificates cert
		JOIN enrollments e ON e.id = cert.enrollment_id
		JOIN courses co ON co.id = e.course_id
		JOIN users ins ON ins.id = co.instructor_id
		JOIN users st ON st.id = e.student_id
		WHERE e.student_id = $1
		ORDER BY cert.issued_at DESC`, c.UserID)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer rows.Close()
	var list []map[string]any
	for rows.Next() {
		var uid string
		var issued interface{}
		var cid uuid.UUID
		var title, inst, stud string
		_ = rows.Scan(&uid, &issued, &cid, &title, &inst, &stud)
		list = append(list, map[string]any{
			"certificate_uid": uid,
			"issued_at":       issued,
			"course":          map[string]any{"id": cid.String(), "title": title},
			"instructor":      map[string]any{"full_name": inst},
			"student_name":    stud,
		})
	}
	return map[string]any{"certificates": list}, http.StatusOK
}

func (s *Service) handleVerifyCertificate(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	cidStr, ok := rawString(data, "certificate_id")
	if !ok || cidStr == "" {
		return map[string]string{"message": "certificate_id required"}, http.StatusBadRequest
	}
	var stud, course, inst string
	var issued interface{}
	err := s.Pool.QueryRow(ctx, `
		SELECT st.full_name, co.title, ins.full_name, cert.issued_at
		FROM certificates cert
		JOIN enrollments e ON e.id = cert.enrollment_id
		JOIN courses co ON co.id = e.course_id
		JOIN users st ON st.id = e.student_id
		JOIN users ins ON ins.id = co.instructor_id
		WHERE cert.certificate_uid = $1`, cidStr,
	).Scan(&stud, &course, &inst, &issued)
	if err != nil {
		return map[string]any{"valid": false}, http.StatusOK
	}
	return map[string]any{
		"valid": true, "student_name": stud, "course_title": course, "instructor_name": inst, "issued_at": issued,
	}, http.StatusOK
}

func (s *Service) handleGetUserProfile(ctx context.Context, c *AccessClaims) (any, int) {
	var fn, em, role string
	var av, bio *string
	err := s.Pool.QueryRow(ctx, `SELECT full_name, email, role, avatar_url, bio FROM users WHERE id = $1`, c.UserID).Scan(&fn, &em, &role, &av, &bio)
	if err != nil {
		return map[string]string{"message": "not found"}, http.StatusNotFound
	}
	stats := map[string]any{}
	switch role {
	case "student":
		var en, act, comp int
		_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM enrollments WHERE student_id = $1`, c.UserID).Scan(&en)
		_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM enrollments WHERE student_id = $1 AND status = 'active'`, c.UserID).Scan(&act)
		_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM enrollments WHERE student_id = $1 AND status = 'completed'`, c.UserID).Scan(&comp)
		stats["enrolled"] = en
		stats["active"] = act
		stats["completed"] = comp
	case "instructor":
		var cc, st int
		_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM courses WHERE instructor_id = $1`, c.UserID).Scan(&cc)
		_ = s.Pool.QueryRow(ctx, `
			SELECT COUNT(*) FROM enrollments e JOIN courses co ON co.id = e.course_id WHERE co.instructor_id = $1`, c.UserID).Scan(&st)
		stats["courses"] = cc
		stats["students"] = st
		if st > 0 {
			var done int
			_ = s.Pool.QueryRow(ctx, `
				SELECT COUNT(*) FROM enrollments e JOIN courses co ON co.id = e.course_id
				WHERE co.instructor_id = $1 AND e.status = 'completed'`, c.UserID).Scan(&done)
			stats["completion_rate"] = int(float64(done) / float64(st) * 100)
		} else {
			stats["completion_rate"] = 0
		}
	case "superadmin":
		var tu, stc, ins int
		_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&tu)
		_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'student'`).Scan(&stc)
		_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'instructor'`).Scan(&ins)
		stats["total_users"] = tu
		stats["students"] = stc
		stats["instructors"] = ins
	}
	u := map[string]any{
		"id": c.UserID.String(), "full_name": fn, "email": em, "role": role, "stats": stats,
	}
	if av != nil {
		u["avatar_url"] = *av
	}
	if bio != nil {
		u["bio"] = *bio
	}
	return u, http.StatusOK
}

func (s *Service) handleUpdateProfile(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	sets := []string{}
	args := []any{}
	n := 1
	if v, ok := rawString(data, "full_name"); ok {
		sets = append(sets, "full_name = $"+strconv.Itoa(n))
		args = append(args, strings.TrimSpace(v))
		n++
	}
	if v, ok := rawString(data, "bio"); ok {
		sets = append(sets, "bio = $"+strconv.Itoa(n))
		args = append(args, v)
		n++
	}
	if v, ok := rawString(data, "avatar_url"); ok {
		sets = append(sets, "avatar_url = $"+strconv.Itoa(n))
		args = append(args, v)
		n++
	}
	if len(sets) == 0 {
		return map[string]string{"message": "no fields"}, http.StatusBadRequest
	}
	args = append(args, c.UserID)
	q := "UPDATE users SET " + strings.Join(sets, ", ") + " WHERE id = $" + strconv.Itoa(n)
	_, err := s.Pool.Exec(ctx, q, args...)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	return map[string]any{"ok": true}, http.StatusOK
}

func (s *Service) handleGetMyRewards(ctx context.Context, c *AccessClaims) (any, int) {
	var rows pgx.Rows
	var err error
	switch c.Role {
	case "student":
		rows, err = s.Pool.Query(ctx, `
			SELECT cert.certificate_uid, cert.issued_at, co.id, co.title, co.cover_image, st.full_name
			FROM certificates cert
			JOIN enrollments e ON e.id = cert.enrollment_id
			JOIN courses co ON co.id = e.course_id
			JOIN users st ON st.id = e.student_id
			WHERE e.student_id = $1`, c.UserID)
	case "instructor":
		rows, err = s.Pool.Query(ctx, `
			SELECT cert.certificate_uid, cert.issued_at, co.id, co.title, co.cover_image, st.full_name
			FROM certificates cert
			JOIN enrollments e ON e.id = cert.enrollment_id
			JOIN courses co ON co.id = e.course_id
			JOIN users st ON st.id = e.student_id
			WHERE co.instructor_id = $1`, c.UserID)
	default:
		rows, err = s.Pool.Query(ctx, `
			SELECT cert.certificate_uid, cert.issued_at, co.id, co.title, co.cover_image, st.full_name
			FROM certificates cert
			JOIN enrollments e ON e.id = cert.enrollment_id
			JOIN courses co ON co.id = e.course_id
			JOIN users st ON st.id = e.student_id`)
	}
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer rows.Close()
	var certs []map[string]any
	for rows.Next() {
		var uid string
		var issued interface{}
		var cid uuid.UUID
		var title, cover, stud string
		_ = rows.Scan(&uid, &issued, &cid, &title, &cover, &stud)
		certs = append(certs, map[string]any{
			"certificate_uid": uid,
			"issued_at":       issued,
			"course":          map[string]any{"id": cid.String(), "title": title, "cover_image": cover},
			"student_name":    stud,
		})
	}
	rewards := []map[string]any{
		{"id": "r1", "title": "First certificate", "description": "Earn your first certificate", "points": 50, "unlocked": len(certs) > 0},
		{"id": "r2", "title": "Course hero", "description": "Complete 3 courses", "points": 200, "unlocked": false},
	}
	return map[string]any{"certificates": certs, "rewards": rewards}, http.StatusOK
}
