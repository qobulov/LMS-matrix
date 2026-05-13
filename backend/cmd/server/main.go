package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"lmsmatrix/backend/internal/lms"
)

func main() {
	ctx := context.Background()
	svc, err := lms.NewService(ctx)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer svc.Close()

	h := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "error", "data": map[string]string{"message": "POST only"}})
			return
		}
		var body struct {
			Data struct {
				Method     string          `json:"method"`
				ObjectData json.RawMessage `json:"object_data"`
			} `json:"data"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "error", "data": map[string]string{"message": "invalid json"}})
			return
		}
		auth := r.Header.Get("Authorization")
		res, code := svc.Dispatch(r.Context(), body.Data.Method, body.Data.ObjectData, auth)
		w.WriteHeader(code)
		if code >= 400 {
			msg := "error"
			if m, ok := res.(map[string]string); ok {
				if v, ok2 := m["message"]; ok2 {
					msg = v
				}
			}
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "error", "data": map[string]string{"message": msg}})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"data": res})
	}

	srv := &http.Server{Addr: ":8080", Handler: http.HandlerFunc(h)}

	go func() {
		log.Printf("LMS invoke_function listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	ch := make(chan os.Signal, 1)
	signal.Notify(ch, syscall.SIGINT, syscall.SIGTERM)
	<-ch
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
}
