# Docker Setup for LLMCalculator

## Quick Start

### 1. Build the Docker Image

Navigate to your project root directory and run:

```bash
docker build -t llmcalculator:latest .
```

This will:
- Build the frontend (React/Vite) → outputs to `/dist`
- Build the backend (Python/FastAPI) → installs dependencies with `uv`
- Combine both into a single container

**Expected output:** `Successfully tagged llmcalculator:latest`

---

### 2. Run the Container

```bash
docker run -p 8080:8080 llmcalculator:latest
```

This will:
- Start the backend on `http://localhost:8080`
- Serve the frontend from the same port
- Load all JSON data into memory at startup

**Expected output:**
```
Loading data files...
Loaded X models
Loaded X desktop GPUs
...
Server ready!
```

---

### 3. Access Your App

- **Frontend:** http://localhost:8080
- **API:** http://localhost:8080/api/calculate
- **Health check:** http://localhost:8080/health

---

## Stop the Container

Press `Ctrl+C` in the terminal, or in another terminal run:

```bash
docker stop $(docker ps -q --filter "ancestor=llmcalculator:latest")
```

---

## Docker Compose (Recommended for Development)

### Create `docker-compose.yml`

Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
    restart: unless-stopped
```

### Run with Docker Compose

```bash
docker-compose up
```

### Stop with Docker Compose

```bash
docker-compose down
```

---

## Troubleshooting

### Container exits immediately?

Open a shell inside the container to debug:

```bash
docker run -it llmcalculator:latest /bin/bash
```

### Check logs

```bash
docker logs $(docker ps -a -q --filter "ancestor=llmcalculator:latest" | head -1)
```

### Rebuild without cache

If you made changes to the code:

```bash
docker build --no-cache -t llmcalculator:latest .
```

### View running containers

```bash
docker ps
```

### Remove old images

```bash
docker rmi llmcalculator:latest
```

---

## How It Works

### Single Container Architecture

The Dockerfile uses a **multi-stage build**:

1. **Stage 1 (Frontend Builder):**
   - Uses Node.js 20
   - Installs npm dependencies
   - Builds React/Vite → outputs to `/dist`

2. **Stage 2 (Backend + Frontend):**
   - Uses Python 3.13
   - Installs `uv` package manager
   - Installs Python dependencies from `pyproject.toml` and `uv.lock`
   - Copies built frontend to `/static`
   - Runs FastAPI backend that serves both API routes and static files

### Why Single Container?

- ✅ Simpler deployment (one service on Cloud Run)
- ✅ Lower cost
- ✅ No inter-container networking needed
- ✅ Frontend and backend share the same port (8080)
- ✅ Data (JSON files) loaded into memory at startup

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Port the backend listens on |

---

## Quick Reference

| Task | Command |
|------|---------|
| Build | `docker build -t llmcalculator:latest .` |
| Run | `docker run -p 8080:8080 llmcalculator:latest` |
| Access Frontend | http://localhost:8080 |
| Access API | http://localhost:8080/api/calculate |
| Health Check | http://localhost:8080/health |
| Stop | `Ctrl+C` |
| Compose Up | `docker-compose up` |
| Compose Down | `docker-compose down` |
| View Logs | `docker logs <container-id>` |
| List Containers | `docker ps` |

---

## Next Steps

- For **production deployment**, use `deploy.sh` to deploy to Google Cloud Run
- For **code updates**, use `update.sh` to rebuild and redeploy
- See `README.md` for local development setup with `uv`
