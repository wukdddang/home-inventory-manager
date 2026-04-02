# 인프라 가이드 — 집비치기 (Home Inventory Manager)

미니 PC(백엔드 + DB) + Vercel(프론트엔드) 하이브리드 배포 구조.

---

## 아키텍처

```
                    ┌──────────────┐
                    │   Vercel     │
                    │  (Frontend)  │
                    │  Next.js SSR │
                    └──────┬───────┘
                           │ HTTPS
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴───┐        ┌────┴───┐        ┌────┴───┐
    │ Browser│        │ Browser│        │ Mobile │
    └────┬───┘        └────┬───┘        └────┬───┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │ API 요청
                    ┌──────┴───────┐
                    │  Cloudflare  │
                    │  HTTPS / DNS │
                    └──────┬───────┘
                           │
┌──────────────────────────┼──────────────────────────┐
│              미니 PC (Ubuntu 24.04 LTS)              │
│                                                      │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ PostgreSQL │◄─│ Backend  │  │   cloudflared    │  │
│  │   :5432    │  │  :4200   │  │   (tunnel)       │  │
│  └───────────┘  └──────────┘  └──────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │           backups/ (GFS 전략)                 │    │
│  │  four_hourly / daily / weekly / monthly /     │    │
│  │  quarterly / yearly                           │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

## 1. 서버 준비

### 1.1 요구사항

| 항목 | 요구사항 |
|------|----------|
| OS | Ubuntu 24.04 LTS |
| Docker | 24.0+ |
| Docker Compose | v2 |
| Git | 2.30+ |
| Node.js | 불필요 (Docker 안에서 빌드) |

### 1.2 Docker 설치

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 확인
docker --version
docker compose version
```

---

## 2. 소스 코드 클론

```bash
git clone <repository-url> ~/him
cd ~/him
```

---

## 3. 환경 변수 설정

```bash
cp backend/.env.example .env
```

`.env`를 편집:

```ini
# ── Database ──
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=him_user
DB_PASSWORD=<강력한_비밀번호>
DB_DATABASE=home_inventory

# ── JWT ──
JWT_SECRET=<openssl rand -base64 48 로 생성>
JWT_REFRESH_SECRET=<다른_랜덤_문자열>
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# ── Mail (SMTP) ──
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=<이메일>
MAIL_PASSWORD=<앱_비밀번호>
MAIL_FROM=noreply@yourdomain.com

# ── App ──
APP_URL=https://api.yourdomain.com
PORT=4200

# ── PostgreSQL Container ──
POSTGRES_USER=him_user
POSTGRES_PASSWORD=<DB_PASSWORD와_동일>
POSTGRES_DB=home_inventory

# ── Backup ──
BACKUP_COMPRESS=true
```

```bash
# JWT 시크릿 생성
openssl rand -base64 48
```

### Gmail SMTP 앱 비밀번호

1. Google 계정 → 보안 → 2단계 인증 활성화
2. 앱 비밀번호 생성 → 16자리 코드를 `MAIL_PASSWORD`에 입력

---

## 4. docker-compose.prod.yml

루트에 생성:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: him-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - him-pgdata:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: him-backend
    restart: unless-stopped
    ports:
      - "127.0.0.1:4200:4200"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  him-pgdata:
```

> 프론트엔드는 Vercel에서 배포하므로 Docker Compose에 포함하지 않는다.
> 모든 포트 `127.0.0.1` 바인딩 → 외부 접근은 Cloudflare Tunnel로만.

---

## 5. 빌드 & 실행

```bash
cd ~/him

# 빌드 + 시작
docker compose -f docker-compose.prod.yml up -d --build

# 상태 확인
docker compose -f docker-compose.prod.yml ps

# 동작 확인
curl http://localhost:4200

# 로그
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 6. 프론트엔드 (Vercel)

### 6.1 Vercel 연결

1. [vercel.com](https://vercel.com)에서 GitHub 레포 import
2. **Framework Preset**: Next.js
3. **Root Directory**: `frontend`
4. **Build Command**: `pnpm build` (Vercel이 자동 감지)
5. **환경 변수** 설정:
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`

### 6.2 배포 흐름

- `main` 브랜치 push → 자동 프로덕션 배포
- PR 생성 → 자동 프리뷰 배포 (고유 URL 생성)

### 6.3 커스텀 도메인

Vercel 프로젝트 Settings → Domains에서 `yourdomain.com` 추가.
Cloudflare DNS에서 Vercel이 안내하는 CNAME 레코드 추가.

---

## 7. 업데이트 배포

### 백엔드 (미니 PC)

```bash
cd ~/him
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

백엔드만 업데이트:

```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
```

### 프론트엔드

`main`에 push하면 Vercel이 자동 배포. 별도 작업 불필요.

---

## 8. Cloudflare Tunnel (백엔드 전용)

### 8.1 설치

```bash
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg > /dev/null

echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list

sudo apt update && sudo apt install -y cloudflared
```

### 8.2 터널 생성

```bash
cloudflared tunnel login          # 브라우저에서 도메인 선택
cloudflared tunnel create him     # 터널 생성, UUID 기록
```

### 8.3 설정

```bash
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << 'YAML'
tunnel: <터널_UUID>
credentials-file: /home/<사용자>/.cloudflared/<터널_UUID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:4200
  - service: http_status:404
YAML
```

> 프론트엔드는 Vercel이므로 `yourdomain.com` ingress는 불필요.

### 8.4 DNS + 서비스 등록

```bash
cloudflared tunnel route dns him api.yourdomain.com

# 테스트
cloudflared tunnel run him

# systemd 등록 (부팅 시 자동)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 9. DB 백업 (GFS 전략)

GFS (Grandfather-Father-Son) 백업 전략으로 다계층 백업을 운영한다.

### 9.1 디렉토리 구조

```
~/him/backups/
└── database/
    ├── four_hourly/     # 4시간마다 (7일 보관)
    ├── daily/           # 매일 01:00 (30일 보관)
    ├── weekly/          # 매주 일요일 01:30 (90일 보관)
    ├── monthly/         # 매월 1일 02:00 (1년 보관)
    ├── quarterly/       # 분기 첫날 03:00 (2년 보관)
    └── yearly/          # 1월 1일 04:00 (5년 보관)
```

### 9.2 백업 스케줄

| 타입 | 실행 주기 | 보관 기간 | Cron 표현식 |
|------|----------|-----------|-------------|
| 4시간 | 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 | 7일 | `0 */4 * * *` |
| 일간 | 매일 01:00 | 30일 | `0 1 * * *` |
| 주간 | 매주 일요일 01:30 | 90일 | `30 1 * * 0` |
| 월간 | 매월 1일 02:00 | 1년 | `0 2 1 * *` |
| 분기 | 1/1, 4/1, 7/1, 10/1 03:00 | 2년 | `0 3 1 1,4,7,10 *` |
| 연간 | 1월 1일 04:00 | 5년 | `0 4 1 1 *` |
| 정리 | 매일 05:00 | - | `0 5 * * *` |

### 9.3 백업 스크립트

`infra/scripts/backup.sh` 참조. 설치:

```bash
# 스크립트 실행 권한
chmod +x ~/him/infra/scripts/backup.sh

# 백업 디렉토리 생성
~/him/infra/scripts/backup.sh init

# crontab 등록
crontab -e
```

```cron
# ── GFS 백업 ──
0 */4 * * *       ~/him/infra/scripts/backup.sh four_hourly
0 1 * * *         ~/him/infra/scripts/backup.sh daily
30 1 * * 0        ~/him/infra/scripts/backup.sh weekly
0 2 1 * *         ~/him/infra/scripts/backup.sh monthly
0 3 1 1,4,7,10 *  ~/him/infra/scripts/backup.sh quarterly
0 4 1 1 *         ~/him/infra/scripts/backup.sh yearly
# ── 만료 백업 정리 ──
0 5 * * *         ~/him/infra/scripts/backup.sh cleanup
```

### 9.4 파일 형식

- 형식: gzip 압축 SQL (`*.sql.gz`)
- 파일명: `backup_{type}_{YYYYMMDD}_{HHMMSS}.sql.gz`
- 압축 효율: 평균 70-90% (10MB → 1-3MB)

### 9.5 수동 백업 & 복원

```bash
# 수동 백업
~/him/infra/scripts/backup.sh daily

# 복원
gunzip -c ~/him/backups/database/daily/backup_daily_20260402_010000.sql.gz | \
  docker exec -i him-postgres psql -U him_user home_inventory

# 새 DB로 복원
docker exec him-postgres createdb -U him_user home_inventory_restore
gunzip -c <백업파일> | \
  docker exec -i him-postgres psql -U him_user home_inventory_restore
```

---

## 10. 자동 시작

`restart: unless-stopped` + Docker 데몬 자동시작으로 충분:

```bash
sudo systemctl enable docker
```

---

## 11. CI/CD

GitHub Actions로 자동화. 상세 내용은 `.github/workflows/` 참조.

| 워크플로우 | 트리거 | 역할 |
|-----------|--------|------|
| `ci.yml` | PR, push to main | ESLint 검사 |
| `deploy-backend.yml` | push to main (backend 변경 시) | 미니 PC SSH 배포 |

프론트엔드는 Vercel이 push/PR 이벤트를 자동 감지하여 배포.

---

## 12. 모니터링

```bash
# 실시간 로그
docker compose -f docker-compose.prod.yml logs -f

# 리소스
docker stats him-backend him-postgres

# 디스크
docker system df

# 백업 용량 확인
du -sh ~/him/backups/database/*

# 백업 현황
~/him/infra/scripts/backup.sh status
```

---

## 13. 트러블슈팅

| 증상 | 확인 |
|------|------|
| DB 연결 실패 | `.env`의 `DB_HOST=postgres` 확인, `docker exec him-postgres pg_isready -U him_user` |
| 포트 충돌 | `sudo lsof -i :5432`, `sudo lsof -i :4200` |
| 터널 안 됨 | `sudo systemctl status cloudflared`, `sudo journalctl -u cloudflared -f` |
| 재시작 루프 | `docker compose -f docker-compose.prod.yml logs backend` (대부분 환경 변수 누락) |
| Vercel 빌드 실패 | Vercel 대시보드 → Deployments에서 빌드 로그 확인 |

---

## 14. 체크리스트

### 최초 세팅

```
□ Docker 설치 (Ubuntu 24.04 LTS)
□ git clone
□ .env 생성 (DB, JWT, SMTP, Backup)
□ docker compose -f docker-compose.prod.yml up -d --build
□ curl localhost:4200 확인
□ cloudflared 설치 → 터널 → DNS → systemd
□ Vercel 프로젝트 연결 + 환경변수 설정
□ 커스텀 도메인 연결 (Vercel + Cloudflare)
□ GFS 백업 cron 설정
□ GitHub Actions secrets 설정
```

### 매 배포 (백엔드)

```
□ git pull origin main
□ docker compose -f docker-compose.prod.yml up -d --build
□ docker image prune -f
```
