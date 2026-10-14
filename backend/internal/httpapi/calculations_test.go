package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/BillyJoe121/sezzle-calculator/backend/internal/calculator"
)

func parseJSON(t *testing.T, raw []byte) any {
	t.Helper()
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		t.Fatalf("invalid JSON %q: %v", raw, err)
	}
	return v
}

func TestCalculateSuccess(t *testing.T) {
	tests := []struct {
		name, body, want string
	}{
		{"add", `{"operation":"add","operands":[0.1,0.2]}`, `{"operation":"add","operands":[0.1,0.2],"result":0.30000000000000004}`},
		{"subtract", `{"operation":"subtract","operands":[10,4.5]}`, `{"operation":"subtract","operands":[10,4.5],"result":5.5}`},
		{"multiply", `{"operation":"multiply","operands":[-3,4]}`, `{"operation":"multiply","operands":[-3,4],"result":-12}`},
		{"divide", `{"operation":"divide","operands":[10,4]}`, `{"operation":"divide","operands":[10,4],"result":2.5}`},
		{"power", `{"operation":"power","operands":[2,10]}`, `{"operation":"power","operands":[2,10],"result":1024}`},
		{"sqrt", `{"operation":"sqrt","operands":[16]}`, `{"operation":"sqrt","operands":[16],"result":4}`},
		{"percentage", `{"operation":"percentage","operands":[15,200]}`, `{"operation":"percentage","operands":[15,200],"result":30}`},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := postJSON(newTestHandler(), tc.body)
			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
			}
			if got := rec.Header().Get("Content-Type"); got != "application/json" {
				t.Errorf("Content-Type = %q, want application/json", got)
			}
			if !reflect.DeepEqual(parseJSON(t, rec.Body.Bytes()), parseJSON(t, []byte(tc.want))) {
				t.Errorf("body = %s, want %s", rec.Body, tc.want)
			}
		})
	}
}

func TestCalculateNormalizesNegativeZero(t *testing.T) {
	tests := []struct{ name, body, want string }{
		{"operand is echoed as 0", `{"operation":"add","operands":[-0,5]}`, `"operands":[0,5]`},
		{"result is 0", `{"operation":"multiply","operands":[-0,1]}`, `"result":0}`},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := postJSON(newTestHandler(), tc.body)
			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want 200; body %s", rec.Code, rec.Body)
			}
			if strings.Contains(rec.Body.String(), "-0") {
				t.Errorf("body contains negative zero: %s", rec.Body)
			}
			if !strings.Contains(rec.Body.String(), tc.want) {
				t.Errorf("body = %s, want it to contain %s", rec.Body, tc.want)
			}
		})
	}
}

func TestCalculateDomainErrors(t *testing.T) {
	tests := []struct {
		name, body, code string
	}{
		{"divide by zero", `{"operation":"divide","operands":[1,0]}`, "DIVISION_BY_ZERO"},
		{"divide by negative zero", `{"operation":"divide","operands":[1,-0]}`, "DIVISION_BY_ZERO"},
		{"sqrt of a negative number", `{"operation":"sqrt","operands":[-1]}`, "DOMAIN_ERROR"},
		{"negative base with fractional exponent", `{"operation":"power","operands":[-8,0.5]}`, "DOMAIN_ERROR"},
		{"zero base with negative exponent", `{"operation":"power","operands":[0,-1]}`, "DOMAIN_ERROR"},
		{"overflow", `{"operation":"power","operands":[10,400]}`, "RESULT_OUT_OF_RANGE"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			requireProblem(t, postJSON(newTestHandler(), tc.body), http.StatusUnprocessableEntity, tc.code)
		})
	}
}

func TestWriteError(t *testing.T) {
	tests := []struct {
		name   string
		err    error
		status int
		code   string
	}{
		{"unsupported operation", calculator.ErrUnsupportedOperation, 400, "UNSUPPORTED_OPERATION"},
		{"wrapped unsupported operation", fmt.Errorf("lookup: %w", calculator.ErrUnsupportedOperation), 400, "UNSUPPORTED_OPERATION"},
		{"operand count", calculator.ErrInvalidOperandCount, 400, "INVALID_OPERANDS"},
		{"division by zero", calculator.ErrDivisionByZero, 422, "DIVISION_BY_ZERO"},
		{"domain", calculator.ErrDomain, 422, "DOMAIN_ERROR"},
		{"out of range", calculator.ErrOutOfRange, 422, "RESULT_OUT_OF_RANGE"},
		{"unknown", errors.New("unexpected"), 500, "INTERNAL_ERROR"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			writeError(rec, slog.New(slog.DiscardHandler), tc.err)
			requireProblem(t, rec, tc.status, tc.code)
		})
	}
}

func TestWriteErrorHidesAndLogsTheCause(t *testing.T) {
	var logs bytes.Buffer
	rec := httptest.NewRecorder()
	writeError(rec, slog.New(slog.NewJSONHandler(&logs, nil)), errors.New("database password leaked"))

	requireProblem(t, rec, http.StatusInternalServerError, "INTERNAL_ERROR")
	if strings.Contains(rec.Body.String(), "leaked") {
		t.Errorf("response exposes the cause: %s", rec.Body)
	}
	if !strings.Contains(logs.String(), "database password leaked") {
		t.Errorf("cause was not logged: %s", logs.String())
	}
}
