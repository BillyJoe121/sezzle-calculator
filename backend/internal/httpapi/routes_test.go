package httpapi

import (
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func serve(h http.Handler, method, path string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(method, path, nil))
	return rec
}

func staticHandler(t *testing.T) http.Handler {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<h1>calculator</h1>"), 0o600); err != nil {
		t.Fatal(err)
	}
	return NewHandler(slog.New(slog.DiscardHandler), dir)
}

func TestHealthz(t *testing.T) {
	t.Run("GET reports ok", func(t *testing.T) {
		rec := serve(newTestHandler(), http.MethodGet, "/healthz")
		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		if got := rec.Header().Get("Content-Type"); got != "application/json" {
			t.Errorf("Content-Type = %q, want application/json", got)
		}
		if got := strings.TrimSpace(rec.Body.String()); got != `{"status":"ok"}` {
			t.Errorf("body = %s", got)
		}
	})
	t.Run("HEAD answers 200", func(t *testing.T) {
		if rec := serve(newTestHandler(), http.MethodHead, "/healthz"); rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})
}

func TestMethodNotAllowedOutsideAPIIsPlainText(t *testing.T) {
	handlers := map[string]http.Handler{
		"without static dir": newTestHandler(),
		"with static dir":    staticHandler(t),
	}
	for name, h := range handlers {
		t.Run(name, func(t *testing.T) {
			rec := serve(h, http.MethodPost, "/healthz")
			if rec.Code != http.StatusMethodNotAllowed {
				t.Fatalf("status = %d, want 405", rec.Code)
			}
			if got := rec.Header().Get("Content-Type"); !strings.HasPrefix(got, "text/plain") {
				t.Errorf("Content-Type = %q, want text/plain", got)
			}
			if rec.Header().Get("Allow") == "" {
				t.Error("Allow header is missing")
			}
		})
	}
}

func TestCalculationsMethodNotAllowed(t *testing.T) {
	for _, method := range []string{http.MethodGet, http.MethodPut, http.MethodDelete, http.MethodPatch} {
		t.Run(method, func(t *testing.T) {
			rec := serve(newTestHandler(), method, "/api/v1/calculations")
			requireProblem(t, rec, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED")
			if got := rec.Header().Get("Allow"); got != "POST" {
				t.Errorf("Allow = %q, want POST", got)
			}
		})
	}
}

func TestUnknownAPIPathsAreNotFound(t *testing.T) {
	for _, path := range []string{"/api/unknown", "/api/v2/calculations", "/api/v1/calculations/", "/api/"} {
		t.Run(path, func(t *testing.T) {
			requireProblem(t, serve(newTestHandler(), http.MethodGet, path), http.StatusNotFound, "NOT_FOUND")
		})
	}
	t.Run("unknown API path with static dir", func(t *testing.T) {
		requireProblem(t, serve(staticHandler(t), http.MethodGet, "/api/unknown"), http.StatusNotFound, "NOT_FOUND")
	})
}

func TestStaticFiles(t *testing.T) {
	t.Run("GET / serves index.html", func(t *testing.T) {
		rec := serve(staticHandler(t), http.MethodGet, "/")
		if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), "<h1>calculator</h1>") {
			t.Fatalf("status = %d, body %q", rec.Code, rec.Body)
		}
	})
	t.Run("HEAD / is allowed", func(t *testing.T) {
		if rec := serve(staticHandler(t), http.MethodHead, "/"); rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
	})
	t.Run("POST / is not allowed", func(t *testing.T) {
		rec := serve(staticHandler(t), http.MethodPost, "/")
		if rec.Code != http.StatusMethodNotAllowed {
			t.Fatalf("status = %d, want 405", rec.Code)
		}
		if got := rec.Header().Get("Allow"); got != "GET, HEAD" {
			t.Errorf("Allow = %q, want %q", got, "GET, HEAD")
		}
	})
	t.Run("directories without index.html are not listed", func(t *testing.T) {
		dir := t.TempDir()
		if err := os.Mkdir(filepath.Join(dir, "assets"), 0o700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "assets", "app.js"), []byte("app"), 0o600); err != nil {
			t.Fatal(err)
		}
		h := NewHandler(slog.New(slog.DiscardHandler), dir)
		for _, path := range []string{"/", "/assets/"} {
			if rec := serve(h, http.MethodGet, path); rec.Code != http.StatusNotFound {
				t.Errorf("GET %s status = %d, want 404; body %q", path, rec.Code, rec.Body)
			}
		}
		if rec := serve(h, http.MethodGet, "/assets/app.js"); rec.Code != http.StatusOK {
			t.Errorf("GET /assets/app.js status = %d, want 200", rec.Code)
		}
	})
	t.Run("GET / without static dir is not found", func(t *testing.T) {
		if rec := serve(newTestHandler(), http.MethodGet, "/"); rec.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404", rec.Code)
		}
	})
}

func TestNosniffOnEveryResponse(t *testing.T) {
	static := staticHandler(t)
	tests := []struct {
		name    string
		handler http.Handler
		method  string
		path    string
	}{
		{"health", newTestHandler(), http.MethodGet, "/healthz"},
		{"problem", newTestHandler(), http.MethodGet, "/api/unknown"},
		{"calculation", newTestHandler(), http.MethodPost, "/api/v1/calculations"},
		{"default 404", newTestHandler(), http.MethodGet, "/missing"},
		{"default 405", newTestHandler(), http.MethodPost, "/healthz"},
		{"static file", static, http.MethodGet, "/"},
		{"static 405", static, http.MethodPost, "/"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := serve(tc.handler, tc.method, tc.path)
			if got := rec.Header().Get("X-Content-Type-Options"); got != "nosniff" {
				t.Errorf("X-Content-Type-Options = %q, want nosniff", got)
			}
		})
	}
}
