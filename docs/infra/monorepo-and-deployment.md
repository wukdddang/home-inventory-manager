# 모노레포 및 배포 설정 가이드

frontend / backend 두 폴더로 구성된 모노레포 기준입니다.

→ 도메인·ERD 등 **공통 문서 목차**: [docs/README.md](./README.md)

---

## 1. 현재 정리된 것

- **.gitignore**: 루트에 공통 패턴 통합, frontend/backend는 중복 제거 후 최소 유지.

---

## 2. 모노레포 추가 설정 (선택)

루트에서 `frontend`와 `backend`를 한 번에 다루려면 아래 중 하나를 쓰면 됩니다.

### 2.1 패키지 매니저 워크스페이스 (권장)

**pnpm**

- 루트에 `package.json` + `pnpm-workspace.yaml` 추가.
- 루트에서 `pnpm install` 시 frontend, backend 의존성 한 번에 설치.

```yaml
# pnpm-workspace.yaml (루트)
packages:
  - "frontend"
  - "backend"
```

```json
// package.json (루트)
{
  "name": "home-inventory-manager",
  "private": true,
  "scripts": {
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:backend": "pnpm --filter backend start:dev",
    "build:frontend": "pnpm --filter frontend build",
    "build:backend": "pnpm --filter backend build"
  },
  "devDependencies": {}
}
```

**npm**

- 루트 `package.json`에 `"workspaces": ["frontend", "backend"]` 추가 후 `npm install`.

### 2.2 루트에 package.json만 두고 스크립트만 통합

워크스페이스 없이 루트에서 아래처럼 스크립트만 두는 방식도 가능합니다.

```json
{
  "scripts": {
    "dev:frontend": "cd frontend && pnpm dev",
    "dev:backend": "cd backend && pnpm run start:dev",
    "build:frontend": "cd frontend && pnpm build",
    "build:backend": "cd backend && pnpm build"
  }
}
```

- 각 패키지는 `frontend/`와 `backend/`에서 자기 패키지 매니저로 설치·실행.

---

## 3. Backend — 로컬 리눅스 서버 + Docker + Cloudflare

### 3.1 구성 개요

로컬 리눅스 머신에서 NestJS 백엔드와 PostgreSQL을 함께 운영한다.

| 항목 | 설명 |
|------|------|
| **PostgreSQL** | 로컬 리눅스 머신에서 Docker 컨테이너 또는 네이티브로 실행. |
| **NestJS 백엔드** | Docker 컨테이너로 실행 (포트 4200). |
| **Cloudflare Tunnel** | `cloudflared`로 터널 연결 → Cloudflare가 HTTPS·DNS 제공. |
| **환경 변수** | DB URL, JWT 시크릿, AWS S3 키 등은 Docker 런타임에 주입. |

### 3.2 docker-compose 예시

```yaml
# docker-compose.yml (루트 또는 backend/)
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: him
      POSTGRES_USER: him_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "4200:4200"
    environment:
      PORT: 4200
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: him
      DB_USER: him_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      AWS_S3_BUCKET: ${AWS_S3_BUCKET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: ${AWS_REGION}
    depends_on:
      - db

volumes:
  pgdata:
```

### 3.3 Dockerfile (backend)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock*.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 4200
CMD ["node", "dist/main.js"]
```

### 3.4 .dockerignore (backend)

```
node_modules
dist
.git
.env
.env.*
*.log
coverage
.nyc_output
```

### 3.5 Cloudflare 연동

- **Cloudflare Tunnel**: 리눅스 서버에 `cloudflared` 설치 후 터널 설정 → 백엔드 포트(4200)를 Cloudflare에 노출.
- **DNS**: 서브도메인(예: `api.yourdomain.com`)을 터널에 연결.
- 프론트엔드에서 `NEXT_PUBLIC_API_URL`로 이 주소를 사용.

---

## 4. Frontend — Vercel 배포

### 4.1 필요한 것

| 항목 | 설명 |
|------|------|
| **Root Directory** | Vercel 프로젝트 설정에서 **Root Directory**를 `frontend`로 지정. |
| **빌드 명령** | `pnpm build` (또는 `npm run build`) — Next.js 기본. |
| **출력 디렉터리** | Next.js 기본값 사용 시 별도 설정 불필요. |
| **환경 변수** | Vercel 대시보드에서 `NEXT_PUBLIC_API_URL` 등 백엔드 API URL 설정. |

### 4.2 API URL

- 프론트에서 백엔드 호출 시 `NEXT_PUBLIC_API_URL`(예: `https://api.yourdomain.com`) 사용.
- 로컬 개발 시 `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001` 등.

---

## 5. 체크리스트 요약

| 구분 | 설정 |
|------|------|
| **모노레포** | (선택) 루트 `pnpm-workspace.yaml` + 루트 `package.json` 스크립트. |
| **Backend** | `docker-compose.yml` (PostgreSQL + NestJS), `backend/Dockerfile`, Cloudflare Tunnel, 환경 변수. |
| **Frontend** | Vercel에서 Root Directory = `frontend`, 환경 변수 `NEXT_PUBLIC_API_URL`. |
| **공통** | `.env.example` 은 루트 또는 frontend/backend 각각에 두고, 실제 `.env`는 .gitignore 유지. |

위 설정을 순서대로 적용하면 모노레포 + 로컬 리눅스 서버(Docker + Cloudflare) + Vercel 배포 구성이 됩니다.
