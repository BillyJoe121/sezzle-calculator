// Command server runs the Sezzle Calculator API and, when STATIC_DIR is set, serves the built frontend.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/BillyJoe121/sezzle-calculator/backend/internal/httpapi"
)

const shutdownTimeout = 10 * time.Second

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, os.Getenv, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "server:", err)
		os.Exit(1)
	}
}

type config struct {
	addr      string
	staticDir string
}

// loadConfig reads PORT (default 8080) and the optional STATIC_DIR, which must be an existing directory.
func loadConfig(getenv func(string) string) (config, error) {
	port := getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if n, err := strconv.Atoi(port); err != nil || n < 0 || n > 65535 {
		return config{}, fmt.Errorf("PORT must be a number from 0 to 65535, got %q", port)
	}

	staticDir := getenv("STATIC_DIR")
	if staticDir != "" {
		info, err := os.Stat(staticDir)
		if err != nil {
			return config{}, fmt.Errorf("STATIC_DIR: %w", err)
		}
		if !info.IsDir() {
			return config{}, fmt.Errorf("STATIC_DIR %q is not a directory", staticDir)
		}
	}
	return config{addr: ":" + port, staticDir: staticDir}, nil
}

// run serves HTTP until ctx is canceled, then shuts down gracefully. Logs are JSON lines on stdout.
func run(ctx context.Context, getenv func(string) string, stdout io.Writer) error {
	cfg, err := loadConfig(getenv)
	if err != nil {
		return err
	}
	logger := slog.New(slog.NewJSONHandler(stdout, nil))

	ln, err := net.Listen("tcp", cfg.addr)
	if err != nil {
		return err
	}
	srv := &http.Server{
		Handler:           httpapi.NewHandler(logger, cfg.staticDir),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
		ErrorLog:          slog.NewLogLogger(logger.Handler(), slog.LevelError),
	}

	serveErr := make(chan error, 1)
	go func() { serveErr <- srv.Serve(ln) }()
	logger.Info("server listening", "addr", ln.Addr().String(), "static_dir", cfg.staticDir)

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}

	logger.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	if err := <-serveErr; !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
