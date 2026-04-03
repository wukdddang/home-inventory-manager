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

## 1. Ubuntu 24.04 LTS 설치

### 1.1 설치 미디어 준비

1. [Ubuntu 24.04 LTS ISO](https://ubuntu.com/download/server) 다운로드 (Server 또는 Desktop)
2. USB 부팅 디스크 생성:
   - Windows: [Rufus](https://rufus.ie/) 또는 [balenaEtcher](https://etcher.balena.io/)
   - macOS/Linux: `dd` 또는 balenaEtcher
3. 미니 PC BIOS에서 USB 부팅 우선순위 설정 후 설치 진행

### 1.2 설치 시 권장 설정

| 항목 | 권장값 |
|------|--------|
| 파티션 | 기본 (guided — use entire disk) |
| 사용자명 | 원하는 이름 (예: `him`) |
| OpenSSH Server | **설치** (원격 접속 필수) |
| 시간대 | `Asia/Seoul` |

### 1.3 설치 후 초기 설정

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# 시간대 확인 (Asia/Seoul이 아니면 설정)
timedatectl
sudo timedatectl set-timezone Asia/Seoul

# 재부팅
sudo reboot
```

---

## 2. 필수 패키지 설치

### 2.1 기본 도구

```bash
sudo apt install -y \
  curl \
  wget \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common \
  build-essential \
  unzip \
  htop
```

### 2.2 Git 설치 및 설정

```bash
# Git 설치 (Ubuntu 24.04 기본 저장소에 2.43+ 포함)
sudo apt install -y git

# 버전 확인
git --version   # 2.43 이상

# Git 사용자 설정
git config --global user.name "이름"
git config --global user.email "이메일@example.com"
```

### 2.3 Docker 설치

```bash
# Docker 공식 GPG 키 추가
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Docker 저장소 추가
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 현재 사용자를 docker 그룹에 추가 (sudo 없이 docker 명령 실행)
sudo usermod -aG docker $USER
newgrp docker

# 버전 확인
docker --version          # 24.0+
docker compose version    # v2.x
```

### 2.4 Docker 자동 시작 설정

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3. SSH 키 생성 및 GitHub 등록

원격 서버에서 private 레포를 클론하려면 SSH 키가 필요하다.

```bash
# SSH 키 생성 (이미 있으면 생략)
ssh-keygen -t ed25519 -C "이메일@example.com"
# Enter 3번 (기본 경로, 패스프레이즈 없음 또는 설정)

# 공개키 확인
cat ~/.ssh/id_ed25519.pub
```

출력된 공개키를 복사하여 GitHub에 등록:

1. [GitHub Settings → SSH and GPG keys](https://github.com/settings/keys)
2. **New SSH key** 클릭
3. Title: `미니PC` (식별용)
4. Key: 복사한 공개키 붙여넣기
5. **Add SSH key**

```bash
# GitHub SSH 연결 테스트
ssh -T git@github.com
# "Hi <username>! You've successfully authenticated..." 출력되면 성공
```

---

## 4. 소스 코드 클론

```bash
git clone git@github.com:<owner>/home-inventory-manager.git ~/him
cd ~/him
```

> 이후 모든 명령은 `~/him` 디렉토리 기준으로 진행한다.

---

## 5. 환경 변수 설정

### 5.1 .env 파일 생성

```bash
cp backend/.env.example .env
```

### 5.2 .env 편집

```bash
nano .env   # 또는 vim .env
```

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

# ── Firebase (FCM 푸시 알림 — 둘 중 하나만 설정) ──
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/him/firebase-service-account.json
# FIREBASE_SERVICE_ACCOUNT_JSON=

# ── App ──
APP_URL=https://api.yourdomain.com
PORT=4200

# ── PostgreSQL Container ──
POSTGRES_USER=him_user
POSTGRES_PASSWORD=<DB_PASSWORD와_동일>
POSTGRES_DB=home_inventory

# ── Backup ──
BACKUP_ENABLED=true
BACKUP_PATH=./backups
BACKUP_COMPRESS=true
BACKUP_MAX_RETRIES=3
BACKUP_RETRY_DELAY_MS=5000
```

### 5.3 시크릿 값 생성

```bash
# JWT Secret 생성
openssl rand -base64 48
# 출력된 값을 JWT_SECRET에 입력

# JWT Refresh Secret (다른 값으로)
openssl rand -base64 48
# 출력된 값을 JWT_REFRESH_SECRET에 입력

# DB 비밀번호 생성
openssl rand -base64 32
# 출력된 값을 DB_PASSWORD, POSTGRES_PASSWORD에 동일하게 입력
```

### 5.4 Gmail SMTP 앱 비밀번호

1. [Google 계정](https://myaccount.google.com) → 보안 → 2단계 인증 활성화
2. [앱 비밀번호 생성](https://myaccount.google.com/apppasswords) → 16자리 코드를 `MAIL_PASSWORD`에 입력

### 5.5 Firebase 서비스 계정 (FCM 푸시 알림 사용 시)

```bash
# 서비스 계정 키 파일 배치
sudo mkdir -p /etc/him
sudo cp firebase-service-account.json /etc/him/
sudo chmod 600 /etc/him/firebase-service-account.json
```

> Firebase 설정 상세: `infra/fcm/README.md` 참조

---

## 6. docker-compose.prod.yml 생성

프로젝트 루트(`~/him/`)에 생성:

```bash
cat > ~/him/docker-compose.prod.yml << 'YAML'
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
YAML
```

> 프론트엔드는 Vercel에서 배포하므로 Docker Compose에 포함하지 않는다.
> 모든 포트 `127.0.0.1` 바인딩 → 외부 접근은 Cloudflare Tunnel로만.

---

## 7. 빌드 & 실행

```bash
cd ~/him

# 빌드 + 시작
docker compose -f docker-compose.prod.yml up -d --build

# 상태 확인
docker compose -f docker-compose.prod.yml ps

# 동작 확인
curl http://localhost:4200

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f backend

# 로그 (전체)
docker compose -f docker-compose.prod.yml logs -f
```

### 빌드 문제 해결

```bash
# 캐시 없이 완전히 새로 빌드
docker compose -f docker-compose.prod.yml build --no-cache

# 볼륨까지 삭제 후 재시작 (⚠️ DB 데이터 삭제됨 — 백업 먼저!)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 8. Cloudflare Tunnel 설정 (백엔드 외부 노출)

Cloudflare Tunnel을 사용하면 포트 포워딩 없이 백엔드를 안전하게 외부에 노출할 수 있다.

### 8.1 cloudflared 설치

```bash
# Cloudflare GPG 키 추가
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg > /dev/null

# 저장소 추가
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list

# 설치
sudo apt update && sudo apt install -y cloudflared

# 버전 확인
cloudflared --version
```

### 8.2 터널 생성

```bash
# Cloudflare 로그인 (브라우저에서 도메인 선택)
cloudflared tunnel login

# 터널 생성 (UUID가 출력됨 — 기록해둘 것)
cloudflared tunnel create him
```

### 8.3 터널 설정 파일 작성

```bash
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << YAML
tunnel: <터널_UUID>
credentials-file: /home/$(whoami)/.cloudflared/<터널_UUID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:4200
  - service: http_status:404
YAML
```

> `<터널_UUID>`를 8.2에서 생성된 실제 UUID로 교체할 것.

### 8.4 DNS 레코드 등록 및 서비스화

```bash
# Cloudflare DNS에 CNAME 레코드 자동 등록
cloudflared tunnel route dns him api.yourdomain.com

# 터널 테스트
cloudflared tunnel run him
# Ctrl+C로 중단

# systemd 서비스로 등록 (부팅 시 자동 시작)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# 상태 확인
sudo systemctl status cloudflared
```

### 8.5 터널 동작 확인

```bash
# 외부에서 접근 가능한지 확인
curl https://api.yourdomain.com

# 터널 로그 확인
sudo journalctl -u cloudflared -f
```

---

## 9. 프론트엔드 배포 (Vercel)

### 9.1 Vercel 프로젝트 연결

1. [vercel.com](https://vercel.com)에서 GitHub 레포 import
2. **Framework Preset**: Next.js
3. **Root Directory**: `frontend`
4. **Build Command**: `pnpm build` (Vercel이 자동 감지)
5. **환경 변수** 설정:
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
   - Firebase 관련 환경변수 (`NEXT_PUBLIC_FIREBASE_*`) — FCM 사용 시

### 9.2 배포 흐름

- `main` 브랜치 push → 자동 프로덕션 배포
- PR 생성 → 자동 프리뷰 배포 (고유 URL 생성)

### 9.3 커스텀 도메인

1. Vercel 프로젝트 Settings → Domains에서 `yourdomain.com` 추가
2. Cloudflare DNS에서 Vercel이 안내하는 CNAME 레코드 추가

---

## 10. 업데이트 배포

### 백엔드 (미니 PC)

```bash
cd ~/him
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f   # 사용하지 않는 이미지 정리
```

백엔드만 업데이트:

```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d --no-deps backend
```

### 프론트엔드

`main`에 push하면 Vercel이 자동 배포. 별도 작업 불필요.

---

## 11. DB 백업 (GFS 전략)

GFS (Grandfather-Father-Son) 백업 전략으로 다계층 백업을 운영한다.

### 11.1 디렉토리 구조

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

### 11.2 백업 스케줄

| 타입 | 실행 주기 | 보관 기간 | Cron 표현식 |
|------|----------|-----------|-------------|
| 4시간 | 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 | 7일 | `0 */4 * * *` |
| 일간 | 매일 01:00 | 30일 | `0 1 * * *` |
| 주간 | 매주 일요일 01:30 | 90일 | `30 1 * * 0` |
| 월간 | 매월 1일 02:00 | 1년 | `0 2 1 * *` |
| 분기 | 1/1, 4/1, 7/1, 10/1 03:00 | 2년 | `0 3 1 1,4,7,10 *` |
| 연간 | 1월 1일 04:00 | 5년 | `0 4 1 1 *` |
| 정리 | 매일 05:00 | - | `0 5 * * *` |

### 11.3 백업 설정

```bash
# 스크립트 실행 권한 부여
chmod +x ~/him/infra/scripts/backup.sh

# 백업 디렉토리 초기화
~/him/infra/scripts/backup.sh init

# crontab 편집
crontab -e
```

crontab에 아래 내용 추가:

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

### 11.4 파일 형식

- 형식: gzip 압축 SQL (`*.sql.gz`)
- 파일명: `backup_{type}_{YYYYMMDD}_{HHMMSS}.sql.gz`
- 압축 효율: 평균 70-90% (10MB → 1-3MB)

### 11.5 수동 백업 & 복원

```bash
# 수동 백업
~/him/infra/scripts/backup.sh daily

# 백업 현황 확인
~/him/infra/scripts/backup.sh status

# 복원
gunzip -c ~/him/backups/database/daily/backup_daily_20260402_010000.sql.gz | \
  docker exec -i him-postgres psql -U him_user home_inventory

# 새 DB로 복원 (기존 DB를 덮어쓰지 않고 검증)
docker exec him-postgres createdb -U him_user home_inventory_restore
gunzip -c <백업파일> | \
  docker exec -i him-postgres psql -U him_user home_inventory_restore
```

---

## 12. 방화벽 설정 (UFW)

```bash
# UFW 설치 및 활성화
sudo apt install -y ufw

# 기본 정책: 들어오는 연결 차단, 나가는 연결 허용
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH 허용 (원격 접속 끊기지 않도록 반드시 먼저!)
sudo ufw allow ssh

# UFW 활성화
sudo ufw enable

# 상태 확인
sudo ufw status verbose
```

> Docker 포트는 `127.0.0.1`에 바인딩되어 있고, 외부 접근은 Cloudflare Tunnel을 통하므로 추가 포트 개방 불필요.

---

## 13. CI/CD

GitHub Actions로 자동화. 상세 내용은 `.github/workflows/` 참조.

| 워크플로우 | 트리거 | 역할 |
|-----------|--------|------|
| `ci.yml` | PR, push to main | ESLint 검사 |
| `deploy-backend.yml` | push to main (backend 변경 시) | 미니 PC SSH 배포 |

프론트엔드는 Vercel이 push/PR 이벤트를 자동 감지하여 배포.

### Self-hosted Runner (E2E 테스트용, 선택사항)

GitHub Actions 무료 플랜 분 제한을 피하기 위해 미니 PC에서 E2E 테스트를 실행할 수 있다.

```bash
# 미니 PC에 runner 설치
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf actions-runner-linux-x64.tar.gz
./config.sh --url https://github.com/<owner>/<repo> --token <TOKEN>
sudo ./svc.sh install && sudo ./svc.sh start
```

---

## 14. 모니터링

```bash
# 실시간 로그
docker compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그
docker compose -f docker-compose.prod.yml logs -f backend

# 리소스 사용량 (CPU, 메모리, 네트워크)
docker stats him-backend him-postgres

# Docker 디스크 사용량
docker system df

# 백업 용량 확인
du -sh ~/him/backups/database/*

# 백업 현황
~/him/infra/scripts/backup.sh status

# 시스템 전체 디스크 확인
df -h

# 시스템 리소스 모니터링
htop
```

---

## 15. 트러블슈팅

| 증상 | 확인 |
|------|------|
| DB 연결 실패 | `.env`의 `DB_HOST=postgres` 확인, `docker exec him-postgres pg_isready -U him_user` |
| 포트 충돌 | `sudo lsof -i :5432`, `sudo lsof -i :4200` |
| 터널 안 됨 | `sudo systemctl status cloudflared`, `sudo journalctl -u cloudflared -f` |
| 재시작 루프 | `docker compose -f docker-compose.prod.yml logs backend` (대부분 환경 변수 누락) |
| Vercel 빌드 실패 | Vercel 대시보드 → Deployments에서 빌드 로그 확인 |
| Docker 권한 오류 | `sudo usermod -aG docker $USER && newgrp docker` |
| 디스크 부족 | `docker system prune -a` (사용하지 않는 이미지/컨테이너 전체 정리) |
| SSH 접속 불가 | `sudo systemctl status ssh`, `sudo ufw status` |

---

## 16. 체크리스트

### 최초 세팅

```
□ Ubuntu 24.04 LTS 설치
□ 시스템 업데이트 (apt update && apt upgrade)
□ 시간대 설정 (Asia/Seoul)
□ 기본 도구 설치 (curl, wget, gnupg, build-essential 등)
□ Git 설치 및 사용자 설정
□ Docker + Docker Compose 설치
□ Docker 자동 시작 (systemctl enable docker)
□ SSH 키 생성 및 GitHub 등록
□ git clone
□ .env 생성 (DB, JWT, SMTP, Firebase, Backup)
□ docker-compose.prod.yml 생성
□ docker compose -f docker-compose.prod.yml up -d --build
□ curl localhost:4200 확인
□ UFW 방화벽 설정
□ cloudflared 설치 → 터널 생성 → DNS → systemd
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
