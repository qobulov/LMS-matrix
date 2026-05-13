package lms

import (
	"context"
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Service) handleGetQuiz(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	var eid uuid.UUID
	err := s.Pool.QueryRow(ctx, `SELECT id FROM enrollments WHERE course_id = $1 AND student_id = $2`, cid, c.UserID).Scan(&eid)
	if err != nil {
		return map[string]string{"message": "not enrolled"}, http.StatusForbidden
	}

	var qid uuid.UUID
	var title string
	var desc *string
	var tlim, thr, maxa int
	err = s.Pool.QueryRow(ctx, `
		SELECT id, title, description, time_limit_min, pass_threshold, max_attempts FROM quizzes
		WHERE course_id = $1 AND module_id IS NULL LIMIT 1`, cid,
	).Scan(&qid, &title, &desc, &tlim, &thr, &maxa)
	if err != nil {
		return map[string]string{"message": "quiz not found"}, http.StatusNotFound
	}

	qr, err := s.Pool.Query(ctx, `
		SELECT id, prompt, question_type FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_no`, qid)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer qr.Close()
	var questions []map[string]any
	for qr.Next() {
		var qnid uuid.UUID
		var prompt, qtype string
		_ = qr.Scan(&qnid, &prompt, &qtype)
		or, _ := s.Pool.Query(ctx, `SELECT id, option_text FROM quiz_options WHERE question_id = $1 ORDER BY id`, qnid)
		var opts []map[string]any
		for or.Next() {
			var oid uuid.UUID
			var ot string
			_ = or.Scan(&oid, &ot)
			opts = append(opts, map[string]any{"id": oid.String(), "option_text": ot})
		}
		or.Close()
		questions = append(questions, map[string]any{
			"id": qnid.String(), "prompt": prompt, "question_type": qtype, "options": opts,
		})
	}

	ar, _ := s.Pool.Query(ctx, `
		SELECT score, submitted_at FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 ORDER BY submitted_at DESC`,
		qid, c.UserID)
	var attempts []map[string]any
	for ar.Next() {
		var sc float64
		var sub time.Time
		_ = ar.Scan(&sc, &sub)
		attempts = append(attempts, map[string]any{"score": sc, "submitted_at": sub.UTC().Format(time.RFC3339)})
	}
	ar.Close()

	quiz := map[string]any{
		"id": qid.String(), "title": title, "time_limit_min": tlim, "pass_threshold": thr, "max_attempts": maxa,
		"questions": questions,
	}
	if desc != nil {
		quiz["description"] = *desc
	}
	return map[string]any{"quiz": quiz, "attempts": attempts}, http.StatusOK
}

type answerIn struct {
	QuestionID        string   `json:"question_id"`
	SelectedOptionIDs []string `json:"selected_option_ids"`
}

func (s *Service) handleSubmitQuiz(ctx context.Context, c *AccessClaims, data map[string]json.RawMessage) (any, int) {
	cid, ok := parseUUID(data, "course_id")
	if !ok {
		return map[string]string{"message": "course_id required"}, http.StatusBadRequest
	}
	qid, ok := parseUUID(data, "quiz_id")
	if !ok {
		return map[string]string{"message": "quiz_id required"}, http.StatusBadRequest
	}
	rawAns, ok := data["answers"]
	if !ok {
		return map[string]string{"message": "answers required"}, http.StatusBadRequest
	}
	var answers []answerIn
	if err := json.Unmarshal(rawAns, &answers); err != nil {
		return map[string]string{"message": "invalid answers"}, http.StatusBadRequest
	}
	timeSpent, _ := rawInt(data, "time_spent_sec")

	var eid uuid.UUID
	var prog int
	err := s.Pool.QueryRow(ctx, `SELECT id, progress_percent FROM enrollments WHERE course_id = $1 AND student_id = $2`, cid, c.UserID).Scan(&eid, &prog)
	if err != nil {
		return map[string]string{"message": "not enrolled"}, http.StatusForbidden
	}

	var maxA int
	err = s.Pool.QueryRow(ctx, `SELECT max_attempts FROM quizzes WHERE id = $1 AND course_id = $2`, qid, cid).Scan(&maxA)
	if err != nil {
		return map[string]string{"message": "quiz not found"}, http.StatusNotFound
	}

	var attemptCount int
	_ = s.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = $1 AND enrollment_id = $2`, qid, eid).Scan(&attemptCount)
	if attemptCount >= maxA {
		return map[string]string{"message": "max attempts reached"}, http.StatusBadRequest
	}

	qrows, err := s.Pool.Query(ctx, `SELECT id, question_type FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_no`, qid)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	var qlist []struct {
		id   uuid.UUID
		kind string
	}
	for qrows.Next() {
		var id uuid.UUID
		var kt string
		_ = qrows.Scan(&id, &kt)
		qlist = append(qlist, struct {
			id   uuid.UUID
			kind string
		}{id, kt})
	}
	qrows.Close()

	tx, err := s.Pool.Begin(ctx)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}
	defer tx.Rollback(ctx)

	var attID uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO quiz_attempts (quiz_id, enrollment_id, student_id, score, time_spent_sec)
		VALUES ($1,$2,$3,0,$4) RETURNING id`, qid, eid, c.UserID, timeSpent).Scan(&attID)
	if err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}

	correctTotal := 0
	graded := len(qlist)
	for _, qm := range qlist {
		var selected []uuid.UUID
		for _, a := range answers {
			if a.QuestionID == qm.id.String() {
				for _, sid := range a.SelectedOptionIDs {
					if id, err := uuid.Parse(sid); err == nil {
						selected = append(selected, id)
					}
				}
				break
			}
		}
		correctIDs, _ := correctOptionIDsTx(ctx, tx, qm.id)
		okAns := optionSetsEqual(correctIDs, selected)
		if okAns {
			correctTotal++
		}
		selJSON, _ := json.Marshal(uuidStrings(selected))
		_, _ = tx.Exec(ctx, `
			INSERT INTO quiz_answers (attempt_id, question_id, selected_option_ids, is_correct)
			VALUES ($1,$2,$3::jsonb,$4)`, attID, qm.id, string(selJSON), okAns)
	}

	score := 0.0
	if graded > 0 {
		score = float64(correctTotal) / float64(graded) * 100
	}
	_, _ = tx.Exec(ctx, `UPDATE quiz_attempts SET score = $1 WHERE id = $2`, score, attID)

	var passTh int
	_ = tx.QueryRow(ctx, `SELECT pass_threshold FROM quizzes WHERE id = $1`, qid).Scan(&passTh)
	passed := int(score+0.5) >= passTh

	var certOut any
	if passed && prog == 100 {
		uid := newCertificateUID()
		_, _ = tx.Exec(ctx, `
			INSERT INTO certificates (enrollment_id, certificate_uid, qr_payload)
			VALUES ($1,$2,$3) ON CONFLICT (enrollment_id) DO NOTHING`, eid, uid, uid)
		_, _ = tx.Exec(ctx, `UPDATE enrollments SET status = 'completed', completed_at = COALESCE(completed_at, now()) WHERE id = $1`, eid)
	}

	if err := tx.Commit(ctx); err != nil {
		return map[string]string{"message": err.Error()}, http.StatusInternalServerError
	}

	if passed && prog == 100 {
		var uid string
		var issued time.Time
		if err := s.Pool.QueryRow(ctx, `SELECT certificate_uid, issued_at FROM certificates WHERE enrollment_id = $1`, eid).Scan(&uid, &issued); err == nil {
			certOut = map[string]any{"id": uid, "issued_at": issued.UTC().Format(time.RFC3339)}
		}
	}

	return map[string]any{"score": score, "passed": passed, "certificate": certOut}, http.StatusOK
}

func correctOptionIDsTx(ctx context.Context, tx pgx.Tx, qid uuid.UUID) ([]uuid.UUID, error) {
	rows, err := tx.Query(ctx, `SELECT id FROM quiz_options WHERE question_id = $1 AND is_correct = true`, qid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func uuidStrings(ids []uuid.UUID) []string {
	out := make([]string, len(ids))
	for i, id := range ids {
		out[i] = id.String()
	}
	return out
}

func optionSetsEqual(correct, selected []uuid.UUID) bool {
	if len(correct) != len(selected) {
		return false
	}
	a := append([]uuid.UUID(nil), correct...)
	b := append([]uuid.UUID(nil), selected...)
	sort.Slice(a, func(i, j int) bool { return a[i].String() < a[j].String() })
	sort.Slice(b, func(i, j int) bool { return b[i].String() < b[j].String() })
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func newCertificateUID() string {
	return "CERT-" + strings.ToUpper(strings.ReplaceAll(uuid.New().String(), "-", "")[:12])
}
