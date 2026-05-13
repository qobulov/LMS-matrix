package lms

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func (s *Service) handleLogin(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	email, ok := rawString(data, "email")
	if !ok {
		return map[string]string{"message": "email required"}, http.StatusBadRequest
	}
	password, ok := rawString(data, "password")
	if !ok {
		return map[string]string{"message": "password required"}, http.StatusBadRequest
	}

	var id uuid.UUID
	var fullName, dbEmail, role string
	var hash []byte
	var avatarURL, bio *string
	err := s.Pool.QueryRow(ctx, `
		SELECT id, full_name, email, password_hash, role, avatar_url, bio
		FROM users WHERE lower(email) = lower($1) AND status = 'active'`,
		strings.TrimSpace(email),
	).Scan(&id, &fullName, &dbEmail, &hash, &role, &avatarURL, &bio)
	if err != nil {
		return map[string]string{"message": "Email yoki parol noto'g'ri"}, http.StatusUnauthorized
	}
	if err := bcrypt.CompareHashAndPassword(hash, []byte(password)); err != nil {
		return map[string]string{"message": "Email yoki parol noto'g'ri"}, http.StatusUnauthorized
	}

	access, err := s.signAccess(id, role)
	if err != nil {
		return map[string]string{"message": "token error"}, http.StatusInternalServerError
	}
	plain, hashHex, err := newRefreshPair()
	if err != nil {
		return map[string]string{"message": "token error"}, http.StatusInternalServerError
	}
	exp := time.Now().UTC().Add(7 * 24 * time.Hour)
	_, err = s.Pool.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
		id, hashHex, exp)
	if err != nil {
		return map[string]string{"message": "db error"}, http.StatusInternalServerError
	}

	return map[string]any{
		"access_token":  access,
		"refresh_token": plain,
		"user":          userPayload(id, fullName, dbEmail, role, avatarURL, bio),
	}, http.StatusOK
}

func (s *Service) handleRegister(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	fullName, ok := rawString(data, "full_name")
	if !ok || strings.TrimSpace(fullName) == "" {
		return map[string]string{"message": "full_name required"}, http.StatusBadRequest
	}
	email, ok := rawString(data, "email")
	if !ok {
		return map[string]string{"message": "email required"}, http.StatusBadRequest
	}
	password, ok := rawString(data, "password")
	if !ok || len(password) < 8 {
		return map[string]string{"message": "password must be at least 8 characters"}, http.StatusBadRequest
	}
	role, ok := rawString(data, "role")
	if !ok {
		role = "student"
	}
	if role != "student" && role != "instructor" {
		return map[string]string{"message": "invalid role"}, http.StatusBadRequest
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return map[string]string{"message": "hash error"}, http.StatusInternalServerError
	}

	var id uuid.UUID
	err = s.Pool.QueryRow(ctx, `
		INSERT INTO users (full_name, email, password_hash, role, status)
		VALUES ($1, lower(trim($2)), $3, $4, 'active')
		RETURNING id`,
		strings.TrimSpace(fullName), email, hash, role,
	).Scan(&id)
	if err != nil {
		return map[string]string{"message": "email already exists"}, http.StatusConflict
	}

	access, err := s.signAccess(id, role)
	if err != nil {
		return map[string]string{"message": "token error"}, http.StatusInternalServerError
	}
	plain, hashHex, err := newRefreshPair()
	if err != nil {
		return map[string]string{"message": "token error"}, http.StatusInternalServerError
	}
	exp := time.Now().UTC().Add(7 * 24 * time.Hour)
	_, _ = s.Pool.Exec(ctx, `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`, id, hashHex, exp)

	return map[string]any{
		"access_token":  access,
		"refresh_token": plain,
		"user":          userPayload(id, fullName, email, role, nil, nil),
	}, http.StatusOK
}

func (s *Service) handleRefresh(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	plain, ok := rawString(data, "refresh_token")
	if !ok || plain == "" {
		return map[string]string{"message": "refresh_token required"}, http.StatusBadRequest
	}
	h := hashRefreshToken(plain)

	var id uuid.UUID
	var expiresAt time.Time
	var revoked *time.Time
	err := s.Pool.QueryRow(ctx, `
		SELECT user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`, h,
	).Scan(&id, &expiresAt, &revoked)
	if err != nil || revoked != nil || time.Now().UTC().After(expiresAt) {
		return map[string]string{"message": "invalid refresh token"}, http.StatusUnauthorized
	}

	var role string
	err = s.Pool.QueryRow(ctx, `SELECT role FROM users WHERE id = $1 AND status = 'active'`, id).Scan(&role)
	if err != nil {
		return map[string]string{"message": "user not found"}, http.StatusUnauthorized
	}

	_, _ = s.Pool.Exec(ctx, `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, h)

	access, err := s.signAccess(id, role)
	if err != nil {
		return map[string]string{"message": "token error"}, http.StatusInternalServerError
	}
	newPlain, newHash, err := newRefreshPair()
	if err != nil {
		return map[string]string{"message": "token error"}, http.StatusInternalServerError
	}
	exp := time.Now().UTC().Add(7 * 24 * time.Hour)
	_, err = s.Pool.Exec(ctx, `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`, id, newHash, exp)
	if err != nil {
		return map[string]string{"message": "db error"}, http.StatusInternalServerError
	}

	return map[string]any{
		"access_token":  access,
		"refresh_token": newPlain,
	}, http.StatusOK
}

func (s *Service) handleLogout(ctx context.Context, data map[string]json.RawMessage) (any, int) {
	plain, ok := rawString(data, "refresh_token")
	if !ok || plain == "" {
		return map[string]string{"message": "refresh_token required"}, http.StatusBadRequest
	}
	h := hashRefreshToken(plain)
	_, _ = s.Pool.Exec(ctx, `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, h)
	return map[string]any{"ok": true}, http.StatusOK
}

func userPayload(id uuid.UUID, fullName, email, role string, avatar, bio *string) map[string]any {
	u := map[string]any{
		"id":         id.String(),
		"full_name":  fullName,
		"email":      email,
		"role":       role,
		"avatar_url": nil,
		"bio":        nil,
	}
	if avatar != nil {
		u["avatar_url"] = *avatar
	}
	if bio != nil {
		u["bio"] = *bio
	}
	return u
}
