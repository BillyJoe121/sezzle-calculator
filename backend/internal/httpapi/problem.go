package httpapi

import (
	"encoding/json"
	"net/http"
)

// problem is an RFC 9457 document and also the error type the decoder returns for request faults.
type problem struct {
	Type   string `json:"type"`
	Title  string `json:"title"`
	Status int    `json:"status"`
	Detail string `json:"detail"`
	Code   string `json:"code"`
}

func newProblem(status int, code, detail string) *problem {
	return &problem{Type: "about:blank", Title: http.StatusText(status), Status: status, Detail: detail, Code: code}
}

func (p *problem) Error() string { return p.Code + ": " + p.Detail }

func writeProblem(w http.ResponseWriter, p *problem) {
	writeJSON(w, p.Status, "application/problem+json", p)
}

// writeJSON writes v with an exact media type (no parameters).
func writeJSON(w http.ResponseWriter, status int, contentType string, v any) {
	body, err := json.Marshal(v)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(status)
	_, _ = w.Write(body)
}

func internalError() *problem {
	return newProblem(http.StatusInternalServerError, "INTERNAL_ERROR", "An unexpected error occurred.")
}
