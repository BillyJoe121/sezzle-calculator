package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func jsonLogger(buf *bytes.Buffer) *slog.Logger {
	return slog.New(slog.NewJSONHandler(buf, nil))
}

// logRecords parses the JSON log lines written to buf.
func logRecords(t *testing.T, buf *bytes.Buffer) []map[string]any {
	t.Helper()
	var records []map[string]any
	for _, line := range strings.Split(strings.TrimSpace(buf.String()), "\n") {
		if line == "" {
			continue
		}
		var rec map[string]any
		if err := json.Unmarshal([]byte(line), &rec); err != nil {
			t.Fatalf("log line is not JSON: %q", line)
		}
		records = append(records, rec)
	}
	return records
}

func TestRecoverer(t *testing.T) {
	var logs bytes.Buffer
	panicker := http.HandlerFunc(func(http.ResponseWriter, *http.Request) { panic("kaboom secret") })
	h := accessLog(jsonLogger(&logs), recoverer(jsonLogger(&logs), panicker))

	rec := serve(h, http.MethodGet, "/boom")

	requireProblem(t, rec, http.StatusInternalServerError, "INTERNAL_ERROR")
	if strings.Contains(rec.Body.String(), "kaboom") {
		t.Errorf("response exposes the panic value: %s", rec.Body)
	}
	if !strings.Contains(logs.String(), "kaboom secret") {
		t.Errorf("panic value was not logged: %s", logs.String())
	}
	if !strings.Contains(logs.String(), "stack") {
		t.Errorf("stack trace was not logged: %s", logs.String())
	}
	var access map[string]any
	for _, r := range logRecords(t, &logs) {
		if r["msg"] == "request" {
			access = r
		}
	}
	if access == nil || access["status"] != float64(500) {
		t.Errorf("access log should record the recovered 500, got %v", access)
	}
}

func TestRecovererRepanicsAbortHandler(t *testing.T) {
	h := recoverer(slog.New(slog.DiscardHandler), http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		panic(http.ErrAbortHandler)
	}))
	defer func() {
		got := recover()
		if err, _ := got.(error); !errors.Is(err, http.ErrAbortHandler) {
			t.Errorf("recovered %v, want http.ErrAbortHandler", got)
		}
	}()
	serve(h, http.MethodGet, "/")
	t.Fatal("expected a panic")
}

func TestAccessLog(t *testing.T) {
	tests := []struct {
		name       string
		handler    http.HandlerFunc
		wantStatus float64
	}{
		{"explicit status", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusTeapot) }, 418},
		{"implicit 200 on write", func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte("x")) }, 200},
		{"implicit 200 without write", func(http.ResponseWriter, *http.Request) {}, 200},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var logs bytes.Buffer
			serve(accessLog(jsonLogger(&logs), tc.handler), http.MethodPost, "/some/path")

			records := logRecords(t, &logs)
			if len(records) != 1 {
				t.Fatalf("got %d log records, want 1: %s", len(records), logs.String())
			}
			r := records[0]
			if r["level"] != "INFO" || r["method"] != "POST" || r["path"] != "/some/path" || r["status"] != tc.wantStatus {
				t.Errorf("unexpected record: %v", r)
			}
			if _, ok := r["duration"]; !ok {
				t.Errorf("record has no duration: %v", r)
			}
		})
	}
}

func TestStatusRecorderUnwrap(t *testing.T) {
	rec := httptest.NewRecorder()
	if got := (&statusRecorder{ResponseWriter: rec}).Unwrap(); got != rec {
		t.Error("Unwrap must return the underlying ResponseWriter")
	}
}

func TestNosniff(t *testing.T) {
	rec := serve(nosniff(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {})), http.MethodGet, "/")
	if got := rec.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Errorf("X-Content-Type-Options = %q, want nosniff", got)
	}
}
