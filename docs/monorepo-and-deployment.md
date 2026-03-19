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

## 3. Backend — 홈 서버 + Docker + Cloudflare

### 3.1 필요한 것

| 항목 | 설명 |
|------|------|
| **Dockerfile** | `backend/` 기준으로 NestJS 빌드·실행 이미지 정의. |
| **.dockerignore** | `backend/` 또는 루트에 두어 `node_modules`, `.git`, `frontend` 등 제외로 이미지 경량화. |
| **Cloudflare Tunnel** | 홈 서버에서 cloudflared로 터널 연결 → Cloudflare가 HTTPS·DNS 제공. (도메인 연결 시 유용.) |
| **환경 변수** | DB URL, JWT 시크릿 등은 Docker 런타임에 주입 (예: `-e` 또는 env 파일). |

### 3.2 Dockerfile 예시 (backend)

`backend/Dockerfile` 에 두고, 빌드 컨텍스트를 `backend/`로 두는 방식입니다.

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
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 3.3 .dockerignore (backend)

`backend/.dockerignore` 예시:

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

### 3.4 Cloudflare 연동

- **Cloudflare Tunnel**: 홈 서버에 `cloudflared` 설치 후 터널 설정 → 백엔드 포트(예: 3000)를 Cloudflare에 노출.
- **DNS**: 원하는 서브도메인(예: `api.yourdomain.com`)을 터널에 연결하면 됨.

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
| **Backend** | `backend/Dockerfile`, `backend/.dockerignore`, Cloudflare Tunnel, 환경 변수. |
| **Frontend** | Vercel에서 Root Directory = `frontend`, 환경 변수 `NEXT_PUBLIC_API_URL`. |
| **공통** | `.env.example` 은 루트 또는 frontend/backend 각각에 두고, 실제 `.env`는 .gitignore 유지. |

원본 .gitignore 정리는 완료되었고, 위 설정을 순서대로 적용하면 모노레포 + 홈 서버(Cloudflare) + Vercel 배포 구성이 됩니다.
