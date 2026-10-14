// Package httpapi is the HTTP transport of the calculator: routing, strict request decoding, problem
// documents and middleware. Arithmetic lives in internal/calculator.
package httpapi

import (
	"io/fs"
	"log/slog"
	"net/http"
	"path"
)

// NewHandler returns the complete server handler: the API, /healthz and, when staticDir is not empty,
// the files in that directory at /.
func NewHandler(logger *slog.Logger, staticDir string) http.Handler {
	a := &api{logger: logger}
	mux := http.NewServeMux()

	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, "application/json", map[string]string{"status": "ok"})
	})
	mux.HandleFunc("POST /api/v1/calculations", a.calculate)
	mux.HandleFunc("/api/v1/calculations", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Allow", http.MethodPost)
		writeProblem(w, newProblem(http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED",
			"This path only accepts POST."))
	})
	mux.HandleFunc("/api/", func(w http.ResponseWriter, _ *http.Request) {
		writeProblem(w, newProblem(http.StatusNotFound, "NOT_FOUND", "No such API route."))
	})
	if staticDir != "" {
		// No method in the pattern: "GET /" would conflict with the /api/ routes above.
		mux.Handle("/", readOnly(http.FileServer(noListing{http.Dir(staticDir)})))
	}

	return nosniff(accessLog(logger, recoverer(logger, mux)))
}

// noListing hides directories without an index.html, so http.FileServer never renders a directory listing.
type noListing struct{ http.FileSystem }

func (fsys noListing) Open(name string) (http.File, error) {
	f, err := fsys.FileSystem.Open(name)
	if err != nil {
		return nil, err
	}
	info, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, err
	}
	if info.IsDir() {
		index, err := fsys.FileSystem.Open(path.Join(name, "index.html"))
		if err != nil {
			f.Close()
			return nil, fs.ErrNotExist
		}
		index.Close()
	}
	return f, nil
}

// readOnly answers methods other than GET and HEAD with Go's usual plain-text 405.
func readOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
			return
		}
		next.ServeHTTP(w, r)
	})
}
