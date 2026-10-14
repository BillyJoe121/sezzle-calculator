# One image, one origin (ADR 0006): Node builds the SPA, Go builds a static binary,
# and a distroless image runs the binary, which serves the API and the SPA on port 8080.

# Stage 1: frontend build (Node LTS, versions pinned by package-lock.json).
FROM node:24.21.0-bookworm-slim AS web
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
# Only the optional, macOS-only fsevents declares an install script (package-lock.json); none is needed on Linux.
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Stage 2: backend build (same Go version as backend/go.mod; standard library only).
FROM golang:1.27.2-bookworm AS api
WORKDIR /src/backend
COPY backend/ ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" -o /out/server ./cmd/server

# Stage 3: runtime. No shell, no package manager, non-root user.
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=api /out/server /app/server
COPY --from=web /src/frontend/dist /app/web
ENV PORT=8080 \
    STATIC_DIR=/app/web
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/app/server"]
