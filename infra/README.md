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

## 6. docker-compose.prod.yml

프로젝트 루트에 `docker-compose.prod.yml`이 이미 포함되어 있다. 별도 생성 불필요.

> 프론트엔드는 Vercel에서 배포하므로 Docker Compose에 포함하지 않는다.
> 모든 포트 `127.0.0.1` 바인딩 → 외부 접근은 Cloudflare Tunnel로만.

---

## 6.1 Nginx 리버스 프록시

`docker-compose.prod.yml`에 Nginx가 포함되어 있다. 백엔드 앞에서 다음을 처리한다:

| 역할 | 설명 |
|------|------|
| **gzip 압축** | JSON 응답을 30~70% 압축하여 모바일 체감 속도 향상 |
| **요청 로깅** | 접속 IP, 요청 경로, 응답 시간을 access.log에 기록 |
| **Rate Limiting** | 인증 API: 분당 10회, 일반 API: 초당 30회 제한 |
| **보안 헤더** | X-Frame-Options, X-Content-Type-Options 등 자동 추가 |
| **프록시** | 외부 → Nginx:80 → Backend:4200 (백엔드 직접 노출 차단) |

### 아키텍처 변경

```
변경 전: Cloudflare Tunnel → Backend:4200
변경 후: Cloudflare Tunnel → Nginx:80 → Backend:4200
```

### 설정 파일

`infra/nginx/nginx.conf` — 주요 설정:

```nginx
# 인증 API 브루트포스 방지 (분당 10회)
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/m;

# 일반 API (초당 30회)
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
```

### Cloudflare Tunnel 설정 변경

기존에 `localhost:4200`으로 터널링했다면, Nginx 도입 후 `localhost:80`으로 변경:

```yaml
# ~/.cloudflared/config.yml
tunnel: <터널-ID>
credentials-file: /root/.cloudflared/<터널-ID>.json

ingress:
  - hostname: api.your-domain.com
    service: http://localhost:80    # ← 4200에서 80으로 변경
  - service: http_status:404
```

변경 후 터널 재시작:

```bash
sudo systemctl restart cloudflared
```

### 로그 확인

```bash
# 실시간 접속 로그
docker logs -f him-nginx

# 로그 파일 직접 확인
docker exec him-nginx cat /var/log/nginx/access.log | tail -20

# 에러 로그
docker exec him-nginx cat /var/log/nginx/error.log | tail -20
```

### Rate Limit 테스트

```bash
# 인증 API 11회 연속 호출 → 마지막은 429 반환
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/auth/login
done
```

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

## 9. 프론트엔드 배포

Vercel로 배포한다. `main` push 시 자동 프로덕션 배포, PR 생성 시 프리뷰 배포.

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

백엔드 애플리케이션(`backend/src/context/backup-context/`)에서 GFS 백업을 자동 수행한다. 별도 cron 설정 불필요.

| 타입 | 실행 주기 | 보관 기간 |
|------|----------|-----------|
| 4시간 | 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 | 7일 |
| 일간 | 매일 01:00 | 30일 |
| 주간 | 매주 일요일 01:30 | 90일 |
| 월간 | 매월 1일 02:00 | 1년 |
| 분기 | 1/1, 4/1, 7/1, 10/1 03:00 | 2년 |
| 연간 | 1월 1일 04:00 | 5년 |
| 정리 | 매일 05:00 | - |

백업 경로: `.env`의 `BACKUP_PATH` (기본값 `./backups/database`)

### 수동 복원

```bash
# 복원
gunzip -c ~/him/backups/database/daily/backup_daily_20260402_010000.sql.gz | \
  docker exec -i him-postgres psql -U him_user home_inventory

# 새 DB로 복원 (기존 DB를 덮어쓰지 않고 검증)
docker exec him-postgres createdb -U him_user home_inventory_restore
gunzip -c <백업파일> | \
  docker exec -i him-postgres psql -U him_user home_inventory_restore
```

---

## 12. 정기 재부팅 스케줄

장기 운영 시 메모리 릭, 좀비 프로세스 등을 예방하기 위해 주 1회 새벽에 자동 재부팅한다.
`restart: unless-stopped` + `systemctl enable docker/cloudflared` 덕분에 재부팅 후 모든 서비스가 자동으로 복구된다.

```bash
# crontab 편집
sudo crontab -e
```

```cron
# ── 주간 정기 재부팅 (매주 월요일 새벽 4:30) ──
30 4 * * 1  /sbin/shutdown -r now
```

> **주의**: 백업 스케줄(`0 4 1 1 *` 연간 백업 등)과 겹치지 않는 시간대로 설정한다.
> 일반 사용자 crontab이 아닌 **root crontab** (`sudo crontab -e`)에 등록해야 한다.

### 설정 확인

```bash
# 재부팅 cron 등록 여부 확인 (root crontab이 유일한 확인 지점)
sudo crontab -l
```

### 재부팅 이력 확인

```bash
# 마지막 재부팅 시각
who -b
uptime -s

# 재부팅 이력 (최근 10건)
last reboot | head -10
```

### 재부팅 후 서비스 복구 확인

```bash
docker compose -f docker-compose.prod.yml ps
sudo systemctl status cloudflared
```

---

## 13. 방화벽 설정 (UFW)

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

## 14. CI/CD

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

## 15. 모니터링 (PLG 스택)

PLG (Promtail + Loki + Grafana) 스택으로 로그 수집 및 시각화를 구성한다.
스택 선택 근거는 `infra/TIPS.md` 섹션 7 참조.

### 15.1 리소스 예상 (ASUS NUC 14 — N355 8코어, 16GB RAM, 2TB SSD)

```
기존 서비스:
  him-postgres     ~256MB
  him-backend      ~128MB
  cloudflared       ~64MB
                   ────────
  소계              ~448MB

PLG 스택:
  him-loki         ~256MB  (max 512MB)
  him-promtail      ~64MB  (max 128MB)
  him-grafana      ~128MB  (max 256MB)
                   ────────
  소계              ~448MB

합계              ~896MB / 16GB (약 5.6%)  ← 충분한 여유
```

### 15.2 디렉토리 구조

```
infra/monitoring/
├── docker-compose.monitoring.yml   # PLG Docker Compose
├── loki-config.yml                 # Loki 설정
├── promtail-config.yml             # Promtail 설정 (Docker 로그 수집)
└── grafana/
    └── provisioning/
        └── datasources/
            └── datasources.yml     # Grafana ↔ Loki 자동 연결
```

### 15.3 환경 변수 추가

`.env` 파일에 Grafana 관리자 비밀번호를 추가한다:

```bash
# .env 에 추가
echo 'GRAFANA_ADMIN_PASSWORD=<강력한_비밀번호>' >> ~/him/.env
```

### 15.4 PLG 스택 실행

```bash
cd ~/him

# PLG 스택 시작
docker compose -f infra/monitoring/docker-compose.monitoring.yml --env-file .env up -d

# 상태 확인
docker compose -f infra/monitoring/docker-compose.monitoring.yml ps

# Grafana 접속 확인
curl http://localhost:3000/api/health
# {"commit":"...","database":"ok","version":"..."}

# Loki 상태 확인
curl http://localhost:3100/ready
# ready
```

### 15.5 Grafana 접속 및 초기 설정

1. 브라우저에서 `http://<미니PC_IP>:3000` 접속 (또는 Cloudflare Tunnel 경유)
2. 로그인: `admin` / `.env`에 설정한 `GRAFANA_ADMIN_PASSWORD`
3. Loki 데이터소스는 provisioning으로 자동 등록되어 있음

#### 로그 확인

1. 좌측 메뉴 → **Explore** 클릭
2. 상단 데이터소스에서 **Loki** 선택
3. Label browser에서 `container` = `him-backend` 선택
4. **Run query** → 백엔드 로그가 표시됨

#### 유용한 LogQL 쿼리 예시

```logql
# 백엔드 에러 로그만 보기
{container="him-backend"} |= "error" | json | level="error"

# PostgreSQL 느린 쿼리
{container="him-postgres"} |= "duration"

# 최근 1시간 백엔드 로그
{container="him-backend"} | json

# 특정 API 경로 로그
{container="him-backend"} |= "/api/inventory"
```

### 15.6 Grafana를 Cloudflare Tunnel로 노출 (선택사항)

외부에서 Grafana 대시보드에 접근하려면 Cloudflare Tunnel ingress에 추가한다:

```yaml
# ~/.cloudflared/config.yml 에 ingress 추가
ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:4200
  - hostname: grafana.yourdomain.com      # 추가
    service: http://localhost:3000         # 추가
  - service: http_status:404
```

```bash
# DNS 등록
cloudflared tunnel route dns him grafana.yourdomain.com

# cloudflared 재시작
sudo systemctl restart cloudflared
```

> **보안**: Grafana 자체 로그인이 있으므로 추가 인증은 선택사항이나, `docker-compose.monitoring.yml`의 `GF_SERVER_ROOT_URL`을 실제 도메인으로 수정할 것.

### 15.7 PLG 업데이트 & 관리

```bash
# 이미지 업데이트
docker compose -f infra/monitoring/docker-compose.monitoring.yml pull
docker compose -f infra/monitoring/docker-compose.monitoring.yml up -d

# 로그 확인
docker compose -f infra/monitoring/docker-compose.monitoring.yml logs -f

# 중지 (데이터 보존)
docker compose -f infra/monitoring/docker-compose.monitoring.yml down

# 중지 + 데이터 삭제 (⚠️ 로그/대시보드 전부 삭제)
docker compose -f infra/monitoring/docker-compose.monitoring.yml down -v
```

### 15.8 CLI 모니터링 (PLG 없이도 사용 가능)

```bash
# 실시간 로그
docker compose -f docker-compose.prod.yml logs -f

# 리소스 사용량 (CPU, 메모리, 네트워크)
docker stats him-backend him-postgres him-loki him-grafana him-promtail

# Docker 디스크 사용량
docker system df

# 백업 현황
~/him/infra/scripts/backup.sh status

# 시스템 디스크/리소스
df -h
htop
```

---

## 16. 트러블슈팅

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
| Nginx 502 Bad Gateway | `docker logs him-nginx`, 백엔드 컨테이너 상태 확인 (`docker ps`) |
| Rate limit 429 | 정상 동작. 인증 API 분당 10회 초과 시 발생. 해제: nginx.conf의 `limit_req` 주석 처리 |
| Grafana 접속 불가 | `docker logs him-grafana`, 포트 3000 확인 |
| Loki 로그 수집 안 됨 | `docker logs him-promtail`, Docker 소켓 마운트 확인 |
| Loki 디스크 사용량 증가 | `retention_period` 설정 확인, `docker exec him-loki ls -lh /loki/chunks` |

---

## 17. 체크리스트

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
□ curl localhost:80 확인 (Nginx 경유)
□ UFW 방화벽 설정
□ cloudflared 설치 → 터널 생성 → DNS(localhost:80) → systemd
□ Vercel 프로젝트 연결 + 환경변수 설정
□ 커스텀 도메인 연결 (Vercel + Cloudflare)
□ GFS 백업 cron 설정
□ 정기 재부팅 cron 설정 (sudo crontab -e)
□ PLG 모니터링 스택 실행 (docker-compose.monitoring.yml)
□ Grafana 초기 로그인 + 비밀번호 변경
□ Grafana Cloudflare Tunnel ingress 추가 (선택)
□ GitHub Actions secrets 설정
```

### 매 배포 (백엔드)

```
□ git pull origin main
□ docker compose -f docker-compose.prod.yml up -d --build
□ docker image prune -f
```
