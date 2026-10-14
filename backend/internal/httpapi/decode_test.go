package httpapi

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const validBody = `{"operation":"add","operands":[1,2]}`

func newTestHandler() http.Handler {
	return NewHandler(slog.New(slog.DiscardHandler), "")
}

func post(h http.Handler, contentType, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/calculations", strings.NewReader(body))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func postJSON(h http.Handler, body string) *httptest.ResponseRecorder {
	return post(h, "application/json", body)
}

// requireProblem asserts rec is a complete RFC 9457 document with the given status and code.
func requireProblem(t *testing.T, rec *httptest.ResponseRecorder, status int, code string) {
	t.Helper()
	if rec.Code != status {
		t.Fatalf("status = %d, want %d; body %s", rec.Code, status, rec.Body)
	}
	if got := rec.Header().Get("Content-Type"); got != "application/problem+json" {
		t.Fatalf("Content-Type = %q, want application/problem+json", got)
	}
	var p map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &p); err != nil {
		t.Fatalf("body is not JSON: %v: %s", err, rec.Body)
	}
	if len(p) != 5 {
		t.Errorf("problem has %d members, want exactly 5: %v", len(p), p)
	}
	if p["type"] != "about:blank" {
		t.Errorf("type = %v, want about:blank", p["type"])
	}
	if p["title"] != http.StatusText(status) {
		t.Errorf("title = %v, want %q", p["title"], http.StatusText(status))
	}
	if p["status"] != float64(status) {
		t.Errorf("status member = %v, want %d", p["status"], status)
	}
	if p["code"] != code {
		t.Errorf("code = %v, want %s", p["code"], code)
	}
	if detail, ok := p["detail"].(string); !ok || detail == "" {
		t.Errorf("detail = %v, want a non-empty string", p["detail"])
	}
}

func TestContentType(t *testing.T) {
	tests := []struct {
		name        string
		contentType string
		accepted    bool
	}{
		{"plain media type", "application/json", true},
		{"utf-8 charset", "application/json; charset=utf-8", true},
		{"upper case type and parameter", "APPLICATION/JSON; Charset=UTF-8", true},
		{"text/plain", "text/plain", false},
		{"missing", "", false},
		{"other charset", "application/json; charset=latin1", false},
		{"unknown parameter", "application/json; foo=bar", false},
		{"charset plus unknown parameter", "application/json; charset=utf-8; foo=bar", false},
		{"problem media type", "application/problem+json", false},
		{"unparsable", "application/json; charset", false},
		{"garbage", ";;;", false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := post(newTestHandler(), tc.contentType, validBody)
			if tc.accepted {
				if rec.Code != http.StatusOK {
					t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
				}
				return
			}
			requireProblem(t, rec, http.StatusUnsupportedMediaType, "UNSUPPORTED_MEDIA_TYPE")
		})
	}
}

func padded(n int) string {
	return validBody + strings.Repeat(" ", n-len(validBody))
}

func TestBodySizeLimit(t *testing.T) {
	t.Run("exactly 4096 bytes is accepted", func(t *testing.T) {
		if rec := postJSON(newTestHandler(), padded(4096)); rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
		}
	})
	t.Run("4097 bytes is too large", func(t *testing.T) {
		requireProblem(t, postJSON(newTestHandler(), padded(4097)), http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE")
	})
	t.Run("size wins over malformed JSON", func(t *testing.T) {
		body := "{" + strings.Repeat("x", 4096)
		requireProblem(t, postJSON(newTestHandler(), body), http.StatusRequestEntityTooLarge, "PAYLOAD_TOO_LARGE")
	})
	t.Run("media type wins over size", func(t *testing.T) {
		rec := post(newTestHandler(), "text/plain", padded(5000))
		requireProblem(t, rec, http.StatusUnsupportedMediaType, "UNSUPPORTED_MEDIA_TYPE")
	})
}

func TestInvalidJSON(t *testing.T) {
	tests := []struct{ name, body string }{
		{"empty body", ``},
		{"truncated", `{"operation":"add","operands":[1,2]`},
		{"null", `null`},
		{"array", `[]`},
		{"number", `1`},
		{"string", `"x"`},
		{"two objects", `{}{}`},
		{"trailing garbage", `{} x`},
		{"unknown key", `{"operation":"add","operands":[1,2],"precision":2}`},
		{"upper case key", `{"OPERATION":"add","operands":[1,2]}`},
		{"upper case operands key", `{"operation":"add","Operands":[1,2]}`},
		{"operation is a number", `{"operation":5,"operands":[1,2]}`},
		{"operation is an object", `{"operation":{},"operands":[1,2]}`},
		{"operands is a string", `{"operation":"add","operands":"x"}`},
		{"operands is an object", `{"operation":"add","operands":{}}`},
		{"operands is a number", `{"operation":"add","operands":5}`},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			requireProblem(t, postJSON(newTestHandler(), tc.body), http.StatusBadRequest, "INVALID_JSON")
		})
	}
}

func TestUnsupportedOperation(t *testing.T) {
	tests := []struct{ name, body string }{
		{"missing", `{"operands":[1,2]}`},
		{"null", `{"operation":null,"operands":[1,2]}`},
		{"empty", `{"operation":"","operands":[1,2]}`},
		{"unknown", `{"operation":"modulo","operands":[1,2]}`},
		{"wrong case", `{"operation":"ADD","operands":[1,2]}`},
		{"empty object", `{}`},
		{"operation is checked before operands", `{"operation":"modulo","operands":[null,"x"]}`},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := postJSON(newTestHandler(), tc.body)
			requireProblem(t, rec, http.StatusBadRequest, "UNSUPPORTED_OPERATION")
			const want = "Supported operations: add, subtract, multiply, divide, power, sqrt, percentage."
			if !strings.Contains(rec.Body.String(), want) {
				t.Errorf("detail does not list the operations: %s", rec.Body)
			}
		})
	}
}

func TestInvalidOperands(t *testing.T) {
	const twoOperands = `Operation "add" requires exactly 2 operands.`
	const notNumbers = `Operands must be finite JSON numbers.`
	tests := []struct {
		name, body, detail string
	}{
		{"missing", `{"operation":"add"}`, twoOperands},
		{"null", `{"operation":"add","operands":null}`, twoOperands},
		{"empty", `{"operation":"add","operands":[]}`, twoOperands},
		{"too few", `{"operation":"add","operands":[1]}`, twoOperands},
		{"too many", `{"operation":"add","operands":[1,2,3]}`, twoOperands},
		{"unary with two", `{"operation":"sqrt","operands":[1,2]}`, `Operation "sqrt" requires exactly 1 operand.`},
		{"null element", `{"operation":"add","operands":[1,null]}`, notNumbers},
		{"string element", `{"operation":"add","operands":[1,"2"]}`, notNumbers},
		{"boolean element", `{"operation":"add","operands":[1,true]}`, notNumbers},
		{"array element", `{"operation":"add","operands":[1,[2]]}`, notNumbers},
		{"object element", `{"operation":"add","operands":[1,{}]}`, notNumbers},
		{"positive overflow", `{"operation":"add","operands":[1e400,1]}`, notNumbers},
		{"negative overflow", `{"operation":"add","operands":[-1e400,1]}`, notNumbers},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := postJSON(newTestHandler(), tc.body)
			requireProblem(t, rec, http.StatusBadRequest, "INVALID_OPERANDS")
			var p struct{ Detail string }
			_ = json.Unmarshal(rec.Body.Bytes(), &p)
			if p.Detail != tc.detail {
				t.Errorf("detail = %q, want %q", p.Detail, tc.detail)
			}
		})
	}
}

// failingReader proves the body is never read when an earlier check already failed.
type failingReader struct{ t *testing.T }

func (r failingReader) Read([]byte) (int, error) {
	r.t.Error("the request body was read")
	return 0, io.ErrUnexpectedEOF
}

func TestValidationOrder(t *testing.T) {
	tests := []struct {
		name, method, path, contentType, body string
		status                                int
		code                                  string
	}{
		{"unknown route beats media type", http.MethodPost, "/api/unknown", "text/plain", `x`, 404, "NOT_FOUND"},
		{"wrong method beats media type", http.MethodGet, "/api/v1/calculations", "text/plain", `x`, 405, "METHOD_NOT_ALLOWED"},
		{"shape beats unknown operation", http.MethodPost, "/api/v1/calculations", "application/json",
			`{"operation":"modulo","operands":"x"}`, 400, "INVALID_JSON"},
		{"unknown key beats unknown operation", http.MethodPost, "/api/v1/calculations", "application/json",
			`{"operation":"modulo","operands":[1,2],"extra":1}`, 400, "INVALID_JSON"},
		{"bad operand beats evaluation", http.MethodPost, "/api/v1/calculations", "application/json",
			`{"operation":"divide","operands":[null,0]}`, 400, "INVALID_OPERANDS"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			req.Header.Set("Content-Type", tc.contentType)
			rec := httptest.NewRecorder()
			newTestHandler().ServeHTTP(rec, req)
			requireProblem(t, rec, tc.status, tc.code)
		})
	}
	t.Run("media type is checked before the body is read", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/calculations", failingReader{t})
		req.Header.Set("Content-Type", "text/plain")
		rec := httptest.NewRecorder()
		newTestHandler().ServeHTTP(rec, req)
		requireProblem(t, rec, http.StatusUnsupportedMediaType, "UNSUPPORTED_MEDIA_TYPE")
	})
}
