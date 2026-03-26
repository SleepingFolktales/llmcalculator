# ── Stage 1: Build the TypeScript frontend ──────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source (exclude .env.production to avoid Tauri config)
COPY frontend/ ./

# Use Docker-specific env config (no VITE_API_URL for relative paths)
COPY frontend/.env.docker .env.production

# Build static files
RUN npm run build
# Output will be at /app/frontend/dist (Vite default)
# Change to /app/frontend/.next if you're using Next.js


# ── Stage 2: Python backend (final image) ────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy backend dependency files first (for layer caching)
COPY backend/pyproject.toml backend/uv.lock ./backend/

# Install Python dependencies using uv
WORKDIR /app/backend
RUN uv sync --frozen --no-dev

# Copy backend source
WORKDIR /app
COPY backend/ ./backend/

# Copy JSON data files
COPY data/ ./data/

# Copy built frontend static files from stage 1
COPY --from=frontend-builder /app/frontend/dist ./static/

# Cloud Run injects PORT env var (default 8080)
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the backend using uv run
WORKDIR /app/backend
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]