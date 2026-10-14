package main

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"
)

func env(vars map[string]string) func(string) string {
	return func(key string) string { return vars[key] }
}

func TestLoadConfig(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "index.html")
	if err := os.WriteFile(file, []byte("<!doctype html>"), 0o600); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		name    string
		vars    map[string]string
		want    config
		wantErr bool
	}{
		{name: "defaults to port 8080 without static files", vars: nil, want: config{addr: ":8080"}},
		{name: "uses PORT", vars: map[string]string{"PORT": "9090"}, want: config{addr: ":9090"}},
		{name: "accepts port 0 for an ephemeral port", vars: map[string]string{"PORT": "0"}, want: config{addr: ":0"}},
		{name: "uses an existing STATIC_DIR", vars: map[string]string{"STATIC_DIR": dir}, want: config{addr: ":8080", staticDir: dir}},
		{name: "rejects a non-numeric PORT", vars: map[string]string{"PORT": "http"}, wantErr: true},
		{name: "rejects a PORT above 65535", vars: map[string]string{"PORT": "65536"}, wantErr: true},
		{name: "rejects a negative PORT", vars: map[string]string{"PORT": "-1"}, wantErr: true},
		{name: "rejects a missing STATIC_DIR", vars: map[string]string{"STATIC_DIR": filepath.Join(dir, "missing")}, wantErr: true},
		{name: "rejects a STATIC_DIR that is a file", vars: map[string]string{"STATIC_DIR": file}, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := loadConfig(env(tt.vars))
			if tt.wantErr {
				if err == nil {
					t.Fatalf("loadConfig() = %+v, want an error", got)
				}
				return
			}
			if err != nil {
				t.Fatalf("loadConfig() error = %v", err)
			}
			if got != tt.want {
				t.Fatalf("loadConfig() = %+v, want %+v", got, tt.want)
			}
		})
	}
}

func TestRunRejectsInvalidConfig(t *testing.T) {
	err := run(context.Background(), env(map[string]string{"PORT": "http"}), io.Discard)
	if err == nil {
		t.Fatal("run() = nil, want a configuration error")
	}
}

func TestRunFailsWhenThePortIsTaken(t *testing.T) {
	ln, err := net.Listen("tcp", ":0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	port := strconv.Itoa(ln.Addr().(*net.TCPAddr).Port)

	err = run(context.Background(), env(map[string]string{"PORT": port}), io.Discard)
	if err == nil {
		t.Fatalf("run() on busy port %s = nil, want an error", port)
	}
}

func TestRunServesUntilTheContextIsCanceled(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	logs, logWriter := io.Pipe()
	done := make(chan error, 1)
	go func() {
		err := run(ctx, env(map[string]string{"PORT": "0"}), logWriter)
		logWriter.Close() // unblocks the scanner if run fails before logging
		done <- err
	}()

	// The first log line is a JSON record announcing the listening address.
	lines := bufio.NewScanner(logs)
	if !lines.Scan() {
		t.Fatalf("no startup log line: %v", lines.Err())
	}
	var startup struct {
		Msg  string `json:"msg"`
		Addr string `json:"addr"`
	}
	if err := json.Unmarshal(lines.Bytes(), &startup); err != nil {
		t.Fatalf("startup log is not JSON: %q", lines.Text())
	}
	go func() { _, _ = io.Copy(io.Discard, logs) }()

	_, port, err := net.SplitHostPort(startup.Addr)
	if err != nil {
		t.Fatalf("startup log addr %q: %v", startup.Addr, err)
	}
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/healthz")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("GET /healthz status = %d, want 200", resp.StatusCode)
	}

	cancel()
	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("run() after cancel = %v, want nil", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("run() did not return after the context was canceled")
	}
}
