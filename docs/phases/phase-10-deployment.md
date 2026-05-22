# Phase 10 — Deployment

**Status:** ⏳ Pending  
**Estimate:** 1 day  
**Depends on:** Phase 1-9

## Objectives
Production deployment to VPS: Docker containers, Nginx reverse proxy with SSL, CI/CD via GitHub Actions, monitoring, and backup.

## Architecture

```
                   ┌──────────────────────────┐
                   │     Cloudflare DNS       │
                   │  klip.app → VPS IP       │
                   └─────────────┬────────────┘
                                 │
                   ┌─────────────┴────────────┐
                   │    Nginx Reverse Proxy   │
                   │    (SSL via Certbot)     │
                   └──────┬──────────┬────────┘
                          │          │
              ┌───────────┴──┐  ┌────┴───────────┐
              │  Next.js     │  │  NestJS + Agent │
              │  (port 3000) │  │  (port 8000)    │
              └──────────────┘  └────┬────────────┘
                                     │
                        ┌────────────┼────────────┐
                        │            │            │
                   ┌────┴────┐ ┌────┴────┐ ┌─────┴──────┐
                   │PostgreSQL│ │  Redis  │ │LangGraph   │
                   │  :5432   │ │  :6379  │ │Python :8001│
                   └─────────┘ └─────────┘ └────────────┘
                             │
                    ┌────────┴────────┐
                    │   FFMPEG +      │
                    │   Chromium Head │
                    └─────────────────┘
```

## VPS Specs

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Storage | 40 GB SSD | 80 GB SSD |
| Bandwidth | 1 TB | Unlimited |

**Provider:** Hetzner CX41 (~€7/mo) or Vultr ($12/mo)

---

## Tasks

### Docker
- [ ] `apps/backend/Dockerfile` — multi-stage (build + production)
- [ ] `apps/frontend/Dockerfile` — multi-stage, standalone Next.js output
- [ ] `apps/langgraph-agent/Dockerfile` — Python FastAPI
- [ ] `packages/remotion-mcp/Dockerfile` — Node.js MCP server
- [ ] `docker-compose.prod.yml` — all services with healthchecks, restart policies, volumes
- [ ] `.dockerignore` files for each service

### Nginx
- [ ] `nginx/nginx.conf` — reverse proxy rules
  - [ ] `/api/*` → backend:8000
  - [ ] `/api/ws/*` → backend:8000 with WebSocket upgrade
  - [ ] `/` → frontend:3000
  - [ ] Gzip compression
  - [ ] Static asset caching (1y for hashed assets)
  - [ ] Client max body size (500MB for video upload)
- [ ] `nginx/Dockerfile` — Nginx with certbot

### SSL
- [ ] Certbot with DNS challenge (Cloudflare)
- [ ] Auto-renew cron job
- [ ] HTTP → HTTPS redirect

### CI/CD
- [ ] `.github/workflows/deploy.yml`
  ```yaml
  on:
    push:
      branches: [main]
  jobs:
    lint:
      runs-on: ubuntu-latest
      steps: npm run lint + typecheck
    
    deploy:
      needs: lint
      runs-on: ubuntu-latest
      steps:
        - Build Docker images
        - Push to GitHub Container Registry
        - SSH into VPS
        - docker compose pull && up -d
        - Health check
  ```
- [ ] GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, env vars

### Environment Management
- [ ] `.env.production` template
- [ ] All secrets in GitHub Secrets
- [ ] Env injection at deploy time (docker compose `env_file` or `--env-file`)

### Monitoring
- [ ] Health check endpoints:
  - [ ] `GET /api/health` → backend status + DB connection + Redis connection
  - [ ] `GET /health` → agent status
- [ ] Docker health checks on all containers
- [ ] UptimeRobot (free tier) — monitors health check endpoint every 5 min
- [ ] Docker logging: `json-file` driver with rotation (max 10 files, 10MB each)

### Backup
- [ ] `scripts/backup.sh`
  ```bash
  pg_dump → compress → upload to R2
  Keep last 7 daily backups
  Cron: daily at 3am
  ```

### Domain + DNS
- [ ] Cloudflare DNS: A record → VPS IP
- [ ] Cloudflare proxy (orange cloud) for DDoS protection
- [ ] Cloudflare firewall rules

### Verification
- [ ] `docker compose up` starts all services
- [ ] Nginx routes correctly
- [ ] SSL certificate valid
- [ ] Health checks pass
- [ ] CI/CD deploy works from GitHub push
- [ ] Backup script runs successfully
- [ ] 500MB video upload works through Nginx

## Notes
- Remotion rendering needs Chrome — install `google-chrome-stable` in Docker
- FFMPEG needs to be installed in backend Docker image
- yt-dlp needs to be installed in backend Docker image
- R2 CORS: allow frontend domain for signed URL access
- Consider using Docker Swarm or Kamal for zero-downtime deploys later
