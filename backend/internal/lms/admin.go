package lms

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
)

func (s *Service) handleFinanceSummary(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	start, end := periodBoundsFromData(data)

	var revenue, expenses float64
	_ = s.Pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount),0) FROM payments WHERE paid_at >= $1 AND paid_at <= $2`, start, end).Scan(&revenue)
	_ = s.Pool.QueryRow(ctx, `SELECT COALESCE(SUM(amount),0) FROM instructor_payouts WHERE created_at >= $1 AND created_at <= $2`, start, end).Scan(&expenses)
	net := revenue - expenses

	var pub, total, tu, st, ins int
	_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM courses WHERE status = 'published'`).Scan(&pub)
	_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM courses`).Scan(&total)
	_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&tu)
	_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'student'`).Scan(&st)
	_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'instructor'`).Scan(&ins)

	return map[string]any{
		"revenue": revenue, "expenses": expenses, "net": net, "is_profit": net >= 0,
		"published_courses": pub, "total_courses": total, "total_users": tu,
		"students": st, "instructors": ins,
	}, http.StatusOK
}

func (s *Service) handleGetReports(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	rt, ok := rawString(data, "report_type")
	if !ok {
		return map[string]string{"message": "report_type required"}, http.StatusBadRequest
	}
	start, end := periodBoundsFromData(data)

	type row map[string]any
	var out []row

	switch rt {
	case "enrollments":
		r, err := s.Pool.Query(ctx, `
			SELECT co.title,
				COUNT(e.id)::int AS enrollments,
				COUNT(e.id) FILTER (WHERE e.status = 'completed')::int AS completed
			FROM courses co
			LEFT JOIN enrollments e ON e.course_id = co.id AND e.enrolled_at >= $1 AND e.enrolled_at <= $2
			GROUP BY co.id, co.title ORDER BY co.title`, start, end)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var title string
			var en, comp int
			_ = r.Scan(&title, &en, &comp)
			rate := 0
			if en > 0 {
				rate = int(float64(comp) / float64(en) * 100)
			}
			out = append(out, row{"course": title, "enrollments": en, "completed": comp, "completion_rate": rate})
		}
		r.Close()
	case "revenue":
		r, err := s.Pool.Query(ctx, `
			SELECT co.title, p.amount, p.paid_at::date
			FROM payments p
			JOIN enrollments e ON e.id = p.enrollment_id
			JOIN courses co ON co.id = e.course_id
			WHERE p.paid_at >= $1 AND p.paid_at <= $2`, start, end)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var title string
			var amt float64
			var d time.Time
			_ = r.Scan(&title, &amt, &d)
			payout := amt * 0.7
			net := amt - payout
			out = append(out, row{
				"course": title, "amount": amt, "payout": payout, "net": net, "date": d.Format("2006-01-02"),
			})
		}
		r.Close()
	case "students":
		r, err := s.Pool.Query(ctx, `
			SELECT u.full_name, u.email,
				(SELECT COUNT(*) FROM enrollments e WHERE e.student_id = u.id AND e.enrolled_at >= $1 AND e.enrolled_at <= $2),
				(SELECT COUNT(*) FROM enrollments e WHERE e.student_id = u.id AND e.status = 'completed' AND e.enrolled_at >= $1 AND e.enrolled_at <= $2)
			FROM users u WHERE u.role = 'student' ORDER BY u.full_name`, start, end)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var name, email string
			var en, comp int
			_ = r.Scan(&name, &email, &en, &comp)
			out = append(out, row{"name": name, "email": email, "enrollments": en, "completed": comp})
		}
		r.Close()
	case "progress":
		r, err := s.Pool.Query(ctx, `
			SELECT co.title,
				COALESCE(ROUND(AVG(e.progress_percent)),0)::int AS avg_progress,
				COUNT(*) FILTER (WHERE e.status = 'active' AND e.progress_percent < 25)::int AS stuck,
				COUNT(*) FILTER (WHERE e.status = 'active')::int AS active
			FROM courses co
			LEFT JOIN enrollments e ON e.course_id = co.id AND e.enrolled_at >= $1 AND e.enrolled_at <= $2
			GROUP BY co.id, co.title`, start, end)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var title string
			var avg, stuck, active int
			_ = r.Scan(&title, &avg, &stuck, &active)
			out = append(out, row{"course": title, "avg_progress": avg, "stuck_learners": stuck, "active": active})
		}
		r.Close()
	case "quiz":
		r, err := s.Pool.Query(ctx, `
			SELECT co.title, u.full_name, qa.score, qa.submitted_at
			FROM quiz_attempts qa
			JOIN quizzes q ON q.id = qa.quiz_id
			JOIN courses co ON co.id = q.course_id
			JOIN users u ON u.id = qa.student_id
			WHERE qa.submitted_at >= $1 AND qa.submitted_at <= $2
			ORDER BY qa.submitted_at DESC`, start, end)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var ct, un string
			var sc float64
			var sub time.Time
			_ = r.Scan(&ct, &un, &sc, &sub)
			out = append(out, row{"course": ct, "user": un, "score": sc, "submitted_at": sub.UTC().Format(time.RFC3339)})
		}
		r.Close()
	case "certificates":
		r, err := s.Pool.Query(ctx, `
			SELECT cert.certificate_uid, st.full_name, co.title, cert.issued_at
			FROM certificates cert
			JOIN enrollments e ON e.id = cert.enrollment_id
			JOIN users st ON st.id = e.student_id
			JOIN courses co ON co.id = e.course_id
			WHERE cert.issued_at >= $1 AND cert.issued_at <= $2`, start, end)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var uid, stud, ct string
			var iss time.Time
			_ = r.Scan(&uid, &stud, &ct, &iss)
			out = append(out, row{
				"certificate_uid": uid, "student": stud, "course": ct, "issued_at": iss.UTC().Format(time.RFC3339),
			})
		}
		r.Close()
	case "instructors":
		r, err := s.Pool.Query(ctx, `
			SELECT u.full_name,
				(SELECT COUNT(*) FROM courses c WHERE c.instructor_id = u.id),
				(SELECT COUNT(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = u.id),
				COALESCE(u.rating,0)
			FROM users u WHERE u.role = 'instructor' ORDER BY u.full_name`)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var name string
			var cc, st int
			var rat float64
			_ = r.Scan(&name, &cc, &st, &rat)
			out = append(out, row{"instructor": name, "courses": cc, "students": st, "rating": rat})
		}
		r.Close()
	case "reviews":
		r, err := s.Pool.Query(ctx, `
			SELECT u.full_name, co.title, rev.rating, rev.comment, rev.created_at
			FROM reviews rev
			JOIN users u ON u.id = rev.student_id
			JOIN courses co ON co.id = rev.course_id
			WHERE rev.created_at >= $1 AND rev.created_at <= $2`, start, end)
		if err != nil {
			return map[string]string{"message": err.Error()}, http.StatusInternalServerError
		}
		for r.Next() {
			var au, ct string
			var rat int
			var com *string
			var dt time.Time
			_ = r.Scan(&au, &ct, &rat, &com, &dt)
			cmt := ""
			if com != nil {
				cmt = *com
			}
			out = append(out, row{"author": au, "course": ct, "rating": rat, "comment": cmt, "date": dt.Format("2006-01-02")})
		}
		r.Close()
	default:
		return map[string]string{"message": "unknown report_type"}, http.StatusBadRequest
	}

	return map[string]any{"report_type": rt, "rows": out}, http.StatusOK
}

func (s *Service) handleGetUsers(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	roleF, _ := rawString(data, "role")
	search, _ := rawString(data, "search")
	page := 1
	if p, ok := rawInt(data, "page"); ok && p > 0 {
		page = p
	}
	ps := 50
	if p, ok := rawInt(data, "page_size"); ok && p > 0 {
		ps = p
	}
	offset := (page - 1) * ps

	q := `SELECT id, full_name, email, role, avatar_url, status FROM users WHERE 1=1`
	cq := `SELECT COUNT(*) FROM users WHERE 1=1`
	args := []any{}
	idx := 1
	if roleF != "" && roleF != "all" {
		q += fmt.Sprintf(" AND role = $%d", idx)
		cq += fmt.Sprintf(" AND role = $%d", idx)
		args = append(args, roleF)
		idx++
	}
	if search != "" {
		q += fmt.Sprintf(" AND (full_name ILIKE $%d OR email ILIKE $%d)", idx, idx)
		cq += fmt.Sprintf(" AND (full_name ILIKE $%d OR email ILIKE $%d)", idx, idx)
		args = append(args, "%"+search+"%")
		idx++
	}

	var total int
	if err := s.Pool.QueryRow(ctx, cq, args...).Scan(&total); err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}

	q += fmt.Sprintf(" ORDER BY full_name LIMIT $%d OFFSET $%d", idx, idx+1)
	args = append(args, ps, offset)

	rows, err := s.Pool.Query(ctx, q, args...)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer rows.Close()
	var users []map[string]any
	for rows.Next() {
		var id uuid.UUID
		var fn, em, role, status string
		var av *string
		_ = rows.Scan(&id, &fn, &em, &role, &av, &status)
		u := map[string]any{"id": id.String(), "full_name": fn, "email": em, "role": role, "status": status}
		if av != nil {
			u["avatar_url"] = *av
		}
		users = append(users, u)
	}
	return map[string]any{"users": users, "total": total}, http.StatusOK
}
