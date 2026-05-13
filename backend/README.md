# LMS backend (Go)

Reference SQL: [`schema.sql`](schema.sql). API contract and method catalogue: [`BACKEND.md`](BACKEND.md).

## Run locally

```bash
export DATABASE_URL="postgres://user:pass@localhost:5432/lms?sslmode=disable"
export JWT_SECRET="change-me"
cd backend
go run ./cmd/server
```

POST `http://localhost:8080/` with body:

```json
{
  "data": {
    "method": "login",
    "object_data": { "email": "...", "password": "..." }
  }
}
```

Success: `{ "data": { ... } }`. Error: `{ "status": "error", "data": { "message": "..." } }`.

Protected routes: header `Authorization: Bearer <access_token>`.

## Module layout

- `internal/lms/` — dispatch + handlers (auth, courses, enrollment, quiz, profile, instructor, admin)
- `cmd/server` — HTTP entry matching Ucode-style JSON envelope

## Frontend alignment

The LMS-matrix app [`src/api/client.js`](../src/api/client.js) sends extra fields inside `data`. Either strip the client to only `method` + `object_data`, or extend the server decoder to ignore unknown keys.
