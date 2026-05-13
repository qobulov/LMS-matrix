package lms

import (
	"context"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Service holds DB pool and JWT signing key.
type Service struct {
	Pool      *pgxpool.Pool
	JWTSecret []byte
}

func NewService(ctx context.Context) (*Service, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://postgres:postgres@localhost:5432/lms?sslmode=disable"
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-me"
	}
	return &Service{Pool: pool, JWTSecret: []byte(secret)}, nil
}

func (s *Service) Close() {
	s.Pool.Close()
}
