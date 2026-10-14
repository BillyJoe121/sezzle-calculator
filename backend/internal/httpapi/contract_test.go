package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http/httptest"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
)

const examplesGlob = "../../../docs/api/examples/*.json"

type fixture struct {
	Name    string `json:"name"`
	Request struct {
		Method  string            `json:"method"`
		Path    string            `json:"path"`
		Headers map[string]string `json:"headers"`
		Body    json.RawMessage   `json:"body"`
	} `json:"request"`
	Response struct {
		Status      int             `json:"status"`
		ContentType string          `json:"contentType"`
		Body        json.RawMessage `json:"body"`
	} `json:"response"`
}

// requestBody follows docs/api/README.md: null is no body, a string is sent as raw bytes and anything
// else is serialized with a standard JSON encoder.
func (f fixture) requestBody(t *testing.T) string {
	t.Helper()
	raw := strings.TrimSpace(string(f.Request.Body))
	switch {
	case raw == "" || raw == "null":
		return ""
	case strings.HasPrefix(raw, `"`):
		var s string
		if err := json.Unmarshal(f.Request.Body, &s); err != nil {
			t.Fatalf("request body string: %v", err)
		}
		return s
	default:
		var v any
		if err := json.Unmarshal(f.Request.Body, &v); err != nil {
			t.Fatalf("request body: %v", err)
		}
		out, err := json.Marshal(v)
		if err != nil {
			t.Fatalf("request body: %v", err)
		}
		return string(out)
	}
}

func TestContractExamples(t *testing.T) {
	files, err := filepath.Glob(examplesGlob)
	if err != nil {
		t.Fatal(err)
	}
	if len(files) == 0 {
		t.Fatalf("no fixtures found with %s", examplesGlob)
	}
	handler := NewHandler(slog.New(slog.DiscardHandler), "")

	for _, file := range files {
		t.Run(strings.TrimSuffix(filepath.Base(file), ".json"), func(t *testing.T) {
			raw, err := os.ReadFile(file)
			if err != nil {
				t.Fatal(err)
			}
			var fx fixture
			if err := json.Unmarshal(raw, &fx); err != nil {
				t.Fatalf("fixture %s: %v", file, err)
			}

			req := httptest.NewRequest(fx.Request.Method, fx.Request.Path, strings.NewReader(fx.requestBody(t)))
			for name, value := range fx.Request.Headers {
				req.Header.Set(name, value)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != fx.Response.Status {
				t.Errorf("status = %d, want %d; body %s", rec.Code, fx.Response.Status, rec.Body)
			}
			if got := rec.Header().Get("Content-Type"); got != fx.Response.ContentType {
				t.Errorf("Content-Type = %q, want %q", got, fx.Response.ContentType)
			}
			assertBody(t, fx, rec.Body.Bytes())
		})
	}
}

// assertBody compares problem documents member by member (detail only has to be non-empty) and
// every other body as parsed JSON, so numbers are compared by value.
func assertBody(t *testing.T, fx fixture, got []byte) {
	t.Helper()
	var gotValue, wantValue any
	if err := json.Unmarshal(got, &gotValue); err != nil {
		t.Fatalf("response body is not JSON: %v: %s", err, got)
	}
	if err := json.Unmarshal(fx.Response.Body, &wantValue); err != nil {
		t.Fatalf("fixture body is not JSON: %v", err)
	}
	if fx.Response.ContentType != "application/problem+json" {
		if !reflect.DeepEqual(gotValue, wantValue) {
			t.Errorf("body = %s, want %s", got, fx.Response.Body)
		}
		return
	}

	gotMap, _ := gotValue.(map[string]any)
	wantMap, _ := wantValue.(map[string]any)
	for _, key := range []string{"type", "title", "status", "code"} {
		if gotMap[key] != wantMap[key] {
			t.Errorf("%s = %v, want %v", key, gotMap[key], wantMap[key])
		}
	}
	if detail, ok := gotMap["detail"].(string); !ok || detail == "" {
		t.Errorf("detail = %v, want a non-empty string", gotMap["detail"])
	}
	if len(gotMap) != len(wantMap) {
		t.Errorf("problem members = %v, want exactly %v", keys(gotMap), keys(wantMap))
	}
}

func keys(m map[string]any) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
