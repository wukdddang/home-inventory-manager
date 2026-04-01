# 배포 가이드 — 로컬 리눅스 서버 (미니 PC)

리눅스 서버에 레포를 클론하고, Docker Compose로 빌드 + 실행하는 구조.
`git pull` → `docker compose up --build` 한 줄로 배포한다.

---

## 아키텍처

```
┌───────────────────────────────────────────────────┐
│                 미니 PC (리눅스)                     │
│                                                     │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ PostgreSQL │◄─│ Backend  │  │    Frontend      │ │
│  │   :5432    │  │  :4200   │  │     :3000        │ │
│  └───────────┘  └────┬─────┘  └───────┬──────────┘ │
│                      │                │             │
│                 ┌────┴────────────────┴───┐         │
│                 │      cloudflared        │         │
│                 └────────────┬────────────┘         │
└──────────────────────────────┼──────────────────────┘
                               │
                        ┌──────┴───────┐
                        │  Cloudflare  │
                        │  HTTPS / DNS │
                        └──────┬───────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
            ┌────┴───┐   ┌────┴───┐   ┌─────┴───┐
            │ Browser│   │ Browser│   │  Mobile │
            └────────┘   └────────┘   └─────────┘
```

---

## 1. 서버 준비

### 1.1 요구사항

| 항목 | 요구사항 |
|------|----------|
| OS | Ubuntu 22.04+ / Debian 12+ |
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
APP_URL=https://yourdomain.com
PORT=4200

# ── PostgreSQL Container ──
POSTGRES_USER=him_user
POSTGRES_PASSWORD=<DB_PASSWORD와_동일>
POSTGRES_DB=home_inventory
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

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    container_name: him-frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com

volumes:
  him-pgdata:
```

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
curl http://localhost:4200   # 백엔드
curl http://localhost:3000   # 프론트엔드

# 로그
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 6. 업데이트 배포

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

---

## 7. Cloudflare Tunnel

### 7.1 설치

```bash
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg > /dev/null

echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list

sudo apt update && sudo apt install -y cloudflared
```

### 7.2 터널 생성

```bash
cloudflared tunnel login          # 브라우저에서 도메인 선택
cloudflared tunnel create him     # 터널 생성, UUID 기록
```

### 7.3 설정

```bash
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << 'YAML'
tunnel: <터널_UUID>
credentials-file: /home/<사용자>/.cloudflared/<터널_UUID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:4200
  - hostname: yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
YAML
```

### 7.4 DNS + 서비스 등록

```bash
cloudflared tunnel route dns him api.yourdomain.com
cloudflared tunnel route dns him yourdomain.com

# 테스트
cloudflared tunnel run him

# systemd 등록 (부팅 시 자동)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## 8. 자동 시작

`restart: unless-stopped` + Docker 데몬 자동시작으로 충분:

```bash
sudo systemctl enable docker
```

---

## 9. DB 백업

```bash
# 백업 폴더
mkdir -p ~/backups

# 수동 백업
docker exec him-postgres pg_dump -U him_user home_inventory \
  > ~/backups/him_$(date +%Y%m%d_%H%M%S).sql

# 복원
docker exec -i him-postgres psql -U him_user home_inventory \
  < ~/backups/him_20260402_120000.sql
```

### 자동 백업 (cron)

```bash
crontab -e
```

```cron
# 매일 03:00 백업, 7일분 유지
0 3 * * * docker exec him-postgres pg_dump -U him_user home_inventory | gzip > /home/<사용자>/backups/him_$(date +\%Y\%m\%d).sql.gz && find /home/<사용자>/backups/ -name "him_*.sql.gz" -mtime +7 -delete
```

---

## 10. 모니터링

```bash
# 실시간 로그
docker compose -f docker-compose.prod.yml logs -f

# 리소스
docker stats him-backend him-frontend him-postgres

# 디스크
docker system df
```

---

## 11. 트러블슈팅

| 증상 | 확인 |
|------|------|
| DB 연결 실패 | `.env`의 `DB_HOST=postgres` 확인, `docker exec him-postgres pg_isready -U him_user` |
| 포트 충돌 | `sudo lsof -i :5432`, `sudo lsof -i :4200`, `sudo lsof -i :3000` |
| 터널 안 됨 | `sudo systemctl status cloudflared`, `sudo journalctl -u cloudflared -f` |
| 재시작 루프 | `docker compose -f docker-compose.prod.yml logs backend` (대부분 환경 변수 누락) |

---

## 12. 체크리스트

### 최초 세팅

```
□ Docker 설치
□ git clone
□ .env 생성 (DB, JWT, SMTP)
□ docker-compose.prod.yml 생성
□ docker compose -f docker-compose.prod.yml up -d --build
□ curl localhost:4200, localhost:3000 확인
□ cloudflared 설치 → 터널 → DNS → systemd
□ 외부 접근 확인
□ 자동 백업 cron 설정
```

### 매 배포

```
□ git pull origin main
□ docker compose -f docker-compose.prod.yml up -d --build
□ docker image prune -f
```
