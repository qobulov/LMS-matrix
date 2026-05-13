package lms

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// AccessClaims is extracted from JWT after parse.
type AccessClaims struct {
	UserID uuid.UUID
	Role   string
}

// ParseAccess validates Bearer JWT and returns claims (nil if invalid).
func (s *Service) ParseAccess(token string) (*AccessClaims, error) {
	if token == "" {
		return nil, jwt.ErrTokenMalformed
	}
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		return s.JWTSecret, nil
	})
	if err != nil || !parsed.Valid {
		return nil, err
	}
	mc, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return nil, jwt.ErrTokenInvalidClaims
	}
	sub, _ := mc["sub"].(string)
	role, _ := mc["role"].(string)
	uid, err := uuid.Parse(sub)
	if err != nil {
		return nil, jwt.ErrTokenInvalidClaims
	}
	return &AccessClaims{UserID: uid, Role: role}, nil
}

func (s *Service) signAccess(userID uuid.UUID, role string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID.String(),
		"role": role,
		"exp": time.Now().Add(15 * time.Minute).Unix(),
		"iat": time.Now().Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.JWTSecret)
}

func newRefreshPair() (plain string, hashHex string, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return "", "", err
	}
	plain = hex.EncodeToString(b)
	sum := sha256.Sum256([]byte(plain))
	hashHex = hex.EncodeToString(sum[:])
	return plain, hashHex, nil
}

func hashRefreshToken(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}
