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

func (s *Service) handleGetHomeData(ctx context.Context) (any, int) {
	featured, err := s.queryCourseSummaries(ctx, `
		WHERE c.status = 'published' ORDER BY c.student_count DESC NULLS LAST LIMIT 6`)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	cats, err := s.Pool.Query(ctx, `SELECT name FROM categories ORDER BY name`)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer cats.Close()
	var categories []string
	for cats.Next() {
		var n string
		_ = cats.Scan(&n)
		categories = append(categories, n)
	}

	rows, err := s.Pool.Query(ctx, `
		SELECT u.id, u.full_name, u.avatar_url, u.rating, u.bio,
			(SELECT COUNT(*) FROM courses c WHERE c.instructor_id = u.id) AS course_count,
			(SELECT COUNT(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = u.id) AS student_total
		FROM users u WHERE u.role = 'instructor' AND u.status = 'active'
		ORDER BY u.rating DESC NULLS LAST LIMIT 6`)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer rows.Close()
	var instructors []map[string]any
	for rows.Next() {
		var id uuid.UUID
		var name string
		var avatar, bio *string
		var rating *float64
		var cc, st int
		_ = rows.Scan(&id, &name, &avatar, &rating, &bio, &cc, &st)
		m := map[string]any{
			"id": id.String(), "full_name": name, "course_count": cc, "student_total": st,
		}
		if avatar != nil {
			m["avatar_url"] = *avatar
		}
		if rating != nil {
			m["rating"] = *rating
		}
		if bio != nil {
			m["bio"] = *bio
		}
		instructors = append(instructors, m)
	}

	return map[string]any{
		"featured_courses": featured,
		"categories":     categories,
		"top_instructors": instructors,
	}, http.StatusOK
}

func (s *Service) queryCourseSummaries(ctx context.Context, whereClause string) ([]map[string]any, error) {
	q := fmt.Sprintf(`
		SELECT c.id, c.title, c.cover_image, c.category, c.difficulty, c.rating_avg, c.duration_hours, c.language,
			(SELECT COUNT(*) FROM modules m JOIN lessons l ON l.module_id = m.id WHERE m.course_id = c.id) AS lesson_count
		FROM courses c %s`, whereClause)
	rows, err := s.Pool.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []map[string]any
	for rows.Next() {
		var id uuid.UUID
		var title, category, difficulty, language *string
		var cover *string
		var rating *float64
		var dur *int
		var lc int
		_ = rows.Scan(&id, &title, &cover, &category, &difficulty, &rating, &dur, &language, &lc)
		m := map[string]any{"id": id.String(), "lesson_count": lc}
		if title != nil {
			m["title"] = *title
		}
		if cover != nil {
			m["cover_image"] = *cover
		}
		if category != nil {
			m["category"] = *category
		}
		if difficulty != nil {
			m["difficulty"] = *difficulty
		}
		if rating != nil {
			m["rating"] = *rating
		}
		if dur != nil {
			m["duration_hours"] = *dur
		}
		if language != nil {
			m["language"] = *language
		}
		out = append(out, m)
	}
	return out, nil
}

func (s *Service) handleGetCourses(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	category, _ := rawString(data, "category")
	difficulty, _ := rawString(data, "difficulty")
	language, _ := rawString(data, "language")
	search, _ := rawString(data, "search")
	sort, _ := rawString(data, "sort")
	if sort == "" {
		sort = "rating"
	}
	page, ok := rawInt(data, "page")
	if !ok || page < 1 {
		page = 1
	}
	pageSize, ok := rawInt(data, "page_size")
	if !ok || pageSize < 1 {
		pageSize = 8
	}
	offset := (page - 1) * pageSize

	var conds []string
	var args []any
	args = append(args, "published")
	conds = append(conds, "c.status = $1")
	argPos := 2
	if category != "" {
		conds = append(conds, fmt.Sprintf("c.category = $%d", argPos))
		args = append(args, category)
		argPos++
	}
	if difficulty != "" {
		conds = append(conds, fmt.Sprintf("c.difficulty = $%d", argPos))
		args = append(args, difficulty)
		argPos++
	}
	if language != "" {
		conds = append(conds, fmt.Sprintf("c.language = $%d", argPos))
		args = append(args, language)
		argPos++
	}
	if search != "" {
		conds = append(conds, fmt.Sprintf("c.title ILIKE $%d", argPos))
		args = append(args, "%"+search+"%")
		argPos++
	}
	where := strings.Join(conds, " AND ")
	order := "c.rating_avg DESC NULLS LAST"
	switch sort {
	case "newest":
		order = "c.created_at DESC"
	case "title":
		order = "c.title ASC"
	}

	countQ := fmt.Sprintf(`SELECT COUNT(*) FROM courses c WHERE %s`, where)
	var total int
	_ = s.Pool.QueryRow(ctx, countQ, args...).Scan(&total)

	q := fmt.Sprintf(`
		SELECT c.id, c.title, c.cover_image, c.category, c.difficulty, c.rating_avg, c.duration_hours, c.language, c.price,
			(SELECT COUNT(*) FROM modules m JOIN lessons l ON l.module_id = m.id WHERE m.course_id = c.id) AS lesson_count
		FROM courses c WHERE %s ORDER BY %s LIMIT $%d OFFSET $%d`,
		where, order, argPos, argPos+1)
	args = append(args, pageSize, offset)
	rows, err := s.Pool.Query(ctx, q, args...)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer rows.Close()
	var courses []map[string]any
	for rows.Next() {
		var id uuid.UUID
		var title, cat, diff, lang *string
		var cover *string
		var rating *float64
		var dur *int
		var price float64
		var lc int
		_ = rows.Scan(&id, &title, &cover, &cat, &diff, &rating, &dur, &lang, &price, &lc)
		m := map[string]any{"id": id.String(), "lesson_count": lc, "price": price}
		if title != nil {
			m["title"] = *title
		}
		if cover != nil {
			m["cover_image"] = *cover
		}
		if cat != nil {
			m["category"] = *cat
		}
		if diff != nil {
			m["difficulty"] = *diff
		}
		if rating != nil {
			m["rating"] = *rating
		}
		if dur != nil {
			m["duration_hours"] = *dur
		}
		if lang != nil {
			m["language"] = *lang
		}
		courses = append(courses, m)
	}
	return map[string]any{"courses": courses, "total": total, "page": page, "page_size": pageSize}, http.StatusOK
}

func (s *Service) handleGetCourseDetails(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}

	var title, desc, cat, diff, lang, status *string
	var cover *string
	var price float64
	var dur *int
	var ratingAvg *float64
	var rc, sc int
	var instID uuid.UUID
	var instName string
	var instAvatar, instBio *string
	var instRating *float64

	err := s.Pool.QueryRow(ctx, `
		SELECT c.title, c.description, c.cover_image, c.category, c.difficulty, c.language, c.price, c.duration_hours,
			c.rating_avg, c.review_count, c.student_count, c.status,
			c.instructor_id, u.full_name, u.avatar_url, u.bio, u.rating
		FROM courses c JOIN users u ON u.id = c.instructor_id WHERE c.id = $1`, cid,
	).Scan(&title, &desc, &cover, &cat, &diff, &lang, &price, &dur, &ratingAvg, &rc, &sc, &status,
		&instID, &instName, &instAvatar, &instBio, &instRating)
	if err != nil {
		return map[string]string{"message": "course not found"}, http.StatusNotFound
	}

	objRows, _ := s.Pool.Query(ctx, `SELECT objective FROM course_objectives WHERE course_id = $1 ORDER BY order_no`, cid)
	var objectives []string
	for objRows.Next() {
		var o string
		_ = objRows.Scan(&o)
		objectives = append(objectives, o)
	}
	objRows.Close()

	reqRows, _ := s.Pool.Query(ctx, `SELECT requirement FROM course_requirements WHERE course_id = $1 ORDER BY order_no`, cid)
	var reqs []string
	for reqRows.Next() {
		var r string
		_ = reqRows.Scan(&r)
		reqs = append(reqs, r)
	}
	reqRows.Close()

	modRows, err := s.Pool.Query(ctx, `
		SELECT m.id, m.title, m.order_no FROM modules m WHERE m.course_id = $1 ORDER BY m.order_no, m.title`, cid)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer modRows.Close()
	var modules []map[string]any
	for modRows.Next() {
		var mid uuid.UUID
		var mt string
		var mo int
		_ = modRows.Scan(&mid, &mt, &mo)
		lr, _ := s.Pool.Query(ctx, `
			SELECT id, title, duration_min, is_preview, video_url FROM lessons WHERE module_id = $1 ORDER BY order_no, title`, mid)
		var lessons []map[string]any
		for lr.Next() {
			var lid uuid.UUID
			var lt string
			var dm int
			var prev bool
			var vu string
			_ = lr.Scan(&lid, &lt, &dm, &prev, &vu)
			lessons = append(lessons, map[string]any{
				"id": lid.String(), "title": lt, "duration_min": dm, "is_preview": prev, "video_url": vu,
			})
		}
		lr.Close()
		modules = append(modules, map[string]any{
			"id": mid.String(), "title": mt, "order_no": mo, "lessons": lessons,
		})
	}

	var fqID *uuid.UUID
	var fqTitle *string
	var tlim, thr, maxa *int
	_ = s.Pool.QueryRow(ctx, `
		SELECT id, title, time_limit_min, pass_threshold, max_attempts FROM quizzes
		WHERE course_id = $1 AND module_id IS NULL ORDER BY title LIMIT 1`, cid,
	).Scan(&fqID, &fqTitle, &tlim, &thr, &maxa)
	var finalQuiz any
	if fqID != nil {
		finalQuiz = map[string]any{
			"id": fqID.String(), "title": *fqTitle, "time_limit_min": *tlim, "pass_threshold": *thr, "max_attempts": *maxa,
		}
	} else {
		finalQuiz = nil
	}

	revRows, _ := s.Pool.Query(ctx, `
		SELECT r.id, u.full_name, r.rating, r.comment, r.created_at
		FROM reviews r JOIN users u ON u.id = r.student_id
		WHERE r.course_id = $1 ORDER BY r.created_at DESC LIMIT 10`, cid)
	var reviews []map[string]any
	for revRows.Next() {
		var rid uuid.UUID
		var author string
		var rating int
		var comment *string
		var created time.Time
		_ = revRows.Scan(&rid, &author, &rating, &comment, &created)
		rm := map[string]any{"id": rid.String(), "author": author, "rating": rating, "date": created.Format("2006-01-02")}
		if comment != nil {
			rm["comment"] = *comment
		}
		reviews = append(reviews, rm)
	}
	revRows.Close()

	resp := map[string]any{
		"id":                   cid.String(),
		"price":                price,
		"review_count":         rc,
		"student_count":        sc,
		"what_you_will_learn":  objectives,
		"requirements":       reqs,
		"modules":              modules,
		"final_quiz":           finalQuiz,
		"reviews":              reviews,
		"instructor": buildInstructor(instID, instName, instAvatar, instBio, instRating),
	}
	if title != nil {
		resp["title"] = *title
	}
	if desc != nil {
		resp["description"] = *desc
	}
	if cover != nil {
		resp["cover_image"] = *cover
	}
	if cat != nil {
		resp["category"] = *cat
	}
	if diff != nil {
		resp["difficulty"] = *diff
	}
	if lang != nil {
		resp["language"] = *lang
	}
	if dur != nil {
		resp["duration_hours"] = *dur
	}
	if ratingAvg != nil {
		resp["rating_avg"] = *ratingAvg
	}
	if status != nil {
		resp["status"] = *status
	}
	return resp, http.StatusOK
}

func buildInstructor(id uuid.UUID, name string, avatar, bio *string, rating *float64) map[string]any {
	m := map[string]any{"id": id.String(), "full_name": name}
	if avatar != nil {
		m["avatar_url"] = *avatar
	}
	if bio != nil {
		m["bio"] = *bio
	}
	if rating != nil {
		m["rating"] = *rating
	}
	return m
}

func (s *Service) handleCreateCourse(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	title, ok := rawString(data, "title")
	if !ok || strings.TrimSpace(title) == "" {
		return map[string]string{"message": "title required"}, http.StatusBadRequest
	}
	desc, _ := rawString(data, "description")
	cover, _ := rawString(data, "cover_image")
	category, _ := rawString(data, "category")
	difficulty, _ := rawString(data, "difficulty")
	language, _ := rawString(data, "language")
	price := 0.0
	if v, ok := rawInt(data, "price"); ok {
		price = float64(v)
	}
	dur, _ := rawInt(data, "duration_hours")
	status, _ := rawString(data, "status")
	if status == "" {
		status = "draft"
	}
	if status != "draft" && status != "published" {
		return map[string]string{"message": "invalid status"}, http.StatusBadRequest
	}

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer tx.Rollback(ctx)

	var cid uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO courses (instructor_id, title, description, cover_image, category, difficulty, language, price, duration_hours, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
		c.UserID, title, nullIfEmpty(desc), nullIfEmpty(cover), nullIfEmpty(category), nullIfEmpty(difficulty), nullIfEmpty(language), price, nullInt(dur), status,
	).Scan(&cid)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}

	var wyl []string
	if raw, ok := data["what_you_will_learn"]; ok {
		_ = json.Unmarshal(raw, &wyl)
	}
	for i, line := range wyl {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		_, _ = tx.Exec(ctx, `INSERT INTO course_objectives (course_id, objective, order_no) VALUES ($1,$2,$3)`, cid, line, i)
	}
	var reqs []string
	if raw, ok := data["requirements"]; ok {
		_ = json.Unmarshal(raw, &reqs)
	}
	for i, line := range reqs {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		_, _ = tx.Exec(ctx, `INSERT INTO course_requirements (course_id, requirement, order_no) VALUES ($1,$2,$3)`, cid, line, i)
	}
	_ = tx.Commit(ctx)
	return map[string]any{"course": map[string]any{"id": cid.String(), "title": title, "status": status}}, http.StatusOK
}

func (s *Service) handleUpdateCourse(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	var inst uuid.UUID
	err := s.Pool.QueryRow(ctx, `SELECT instructor_id FROM courses WHERE id = $1`, cid).Scan(&inst)
	if err != nil {
		return map[string]string{"message": "course not found"}, http.StatusNotFound
	}
	if inst != c.UserID {
		return map[string]string{"message": "forbidden"}, http.StatusForbidden
	}

	sets := []string{}
	args := []any{}
	n := 1
	if v, ok := rawString(data, "title"); ok {
		sets = append(sets, fmt.Sprintf("title = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawString(data, "description"); ok {
		sets = append(sets, fmt.Sprintf("description = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawString(data, "cover_image"); ok {
		sets = append(sets, fmt.Sprintf("cover_image = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawString(data, "category"); ok {
		sets = append(sets, fmt.Sprintf("category = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawString(data, "difficulty"); ok {
		sets = append(sets, fmt.Sprintf("difficulty = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawString(data, "language"); ok {
		sets = append(sets, fmt.Sprintf("language = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawInt(data, "price"); ok {
		sets = append(sets, fmt.Sprintf("price = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawInt(data, "duration_hours"); ok {
		sets = append(sets, fmt.Sprintf("duration_hours = $%d", n))
		args = append(args, v)
		n++
	}
	if v, ok := rawString(data, "status"); ok {
		sets = append(sets, fmt.Sprintf("status = $%d", n))
		args = append(args, v)
		n++
	}
	if len(sets) == 0 {
		return map[string]string{"message": "no fields to update"}, http.StatusBadRequest
	}
	args = append(args, cid)
	q := fmt.Sprintf(`UPDATE courses SET %s WHERE id = $%d`, strings.Join(sets, ", "), n)
	_, err = s.Pool.Exec(ctx, q, args...)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	return map[string]any{"ok": true}, http.StatusOK
}

func (s *Service) handleCreateCourseReview(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	rating, ok := rawInt(data, "rating")
	if !ok || rating < 1 || rating > 5 {
		return map[string]string{"message": "rating 1-5 required"}, http.StatusBadRequest
	}
	comment, _ := rawString(data, "comment")

	var st string
	err := s.Pool.QueryRow(ctx, `
		SELECT status FROM enrollments WHERE course_id = $1 AND student_id = $2`, cid, c.UserID).Scan(&st)
	if err != nil {
		return map[string]string{"message": "not enrolled"}, http.StatusForbidden
	}
	if st != "completed" {
		return map[string]string{"message": "complete course before review"}, http.StatusForbidden
	}

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO reviews (course_id, student_id, rating, comment) VALUES ($1,$2,$3,$4)
		ON CONFLICT (course_id, student_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now()`,
		cid, c.UserID, rating, nullIfEmpty(comment))
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}

	var avg float64
	var cnt int
	_ = tx.QueryRow(ctx, `SELECT COALESCE(AVG(rating),0), COUNT(*) FROM reviews WHERE course_id = $1`, cid).Scan(&avg, &cnt)
	_, _ = tx.Exec(ctx, `UPDATE courses SET rating_avg = $1, review_count = $2 WHERE id = $3`, avg, cnt, cid)
	_ = tx.Commit(ctx)

	return map[string]any{"ok": true, "new_rating_avg": avg, "review_count": cnt}, http.StatusOK
}

func nullIfEmpty(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func nullInt(i int) *int {
	if i == 0 {
		return nil
	}
	return &i
}
