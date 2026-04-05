# 배포 & 인프라 팁 — 집비치기

배포 전략을 결정하면서 검토한 내용을 정리한다.

---

## 1. Ubuntu 24.04 LTS 선택 이유

- **LTS 지원**: 2029년 4월까지 (22.04는 2027년 4월)
- **커널 6.8**: 더 나은 Docker/cgroup v2 지원, 최신 하드웨어 호환
- 미니 PC에 새로 설치하는 경우 구버전을 쓸 이유가 없음
- Docker, cloudflared 등 모든 도구가 24.04 정식 지원

---

## 2. 프론트엔드: Vercel vs 셀프호스팅 비교

| 항목 | Vercel | 미니 PC 셀프호스팅 |
|------|--------|-------------------|
| **설정 난이도** | GitHub 연결만 하면 끝 | Dockerfile + Cloudflare Tunnel 직접 관리 |
| **CI/CD** | push하면 자동 빌드/배포 | 직접 구축해야 함 |
| **HTTPS/CDN** | 자동 (글로벌 Edge) | Cloudflare Tunnel로 가능하나 CDN은 제한적 |
| **프리뷰 배포** | PR마다 자동 프리뷰 URL | 직접 구현해야 함 |
| **비용** | Hobby 무료 (개인), Pro $20/월 | 미니 PC 전기세 + 도메인비만 |
| **가용성** | 99.99% SLA | 미니 PC 꺼지면 끝 |
| **성능** | 글로벌 Edge, ISR/SSG 최적화 | 한국 한 곳에서만 서빙 |
| **데이터 주권** | Vercel 서버에 빌드 결과 저장 | 내 서버에 모든 데이터 |
| **백엔드 연동** | API URL만 환경변수로 설정 | 같은 머신이라 localhost 가능 |

### 결론: 프론트는 Vercel, 백엔드+DB는 미니 PC

- Next.js 만든 회사가 Vercel → 최적화가 압도적 (ISR, Edge Functions 등)
- PR마다 프리뷰 배포 → 개발 생산성 향상
- 미니 PC가 꺼져도 프론트는 살아있음 (API만 에러, 에러 화면은 표시)
- 개인 프로젝트 Hobby 플랜이면 무료
- 단점: CORS 설정 필요, API 레이턴시 약간 증가 (하지만 `NEXT_PUBLIC_API_URL`로 이미 분리 구조)

---

## 3. Cloudflare 도메인

### 도메인 구입이 필요한가?

- **Cloudflare Tunnel 자체는 도메인 없이 사용 가능** (`<random>.cfargotunnel.com` 형태)
- **커스텀 도메인을 쓰려면 구입 필요**

### 도메인 구입 옵션

| 등록기관 | 특징 |
|---------|------|
| **Cloudflare Registrar** | 원가 판매 (가장 저렴), DNS 자동 연동 |
| 가비아 | 한국 업체, 한글 지원 |
| Namecheap | 해외, 저렴한 편 |
| Google Domains (→ Squarespace) | 인수됨, 비추 |

### 가격 참고

- `.com`: 연 ~$10 (~13,000원)
- `.dev`, `.app`: 연 ~$12-15
- `.kr`: 가비아에서 연 ~20,000원

### 추천

Cloudflare Registrar에서 구입하면 DNS 설정이 자동으로 연동되어 가장 편리하다.
다른 곳에서 사서 Cloudflare로 네임서버만 이전해도 된다.

---

## 4. CI/CD 전략

### GitHub Actions (클라우드 CI)

현재 구성: ESLint만 클라우드에서 실행.

**장점**: 설정 간단, GitHub에 통합, PR 체크 자동화
**단점**: 무료 플랜 월 2,000분 제한, E2E 테스트는 과금 우려

### E2E 테스트: 로컬 CI 권장

현재 E2E 케이스가 데스크탑만 122개 → GitHub Actions에서 돌리면:
- Playwright 브라우저 설치 시간 + 실행 시간 = PR당 5-10분 소모
- 월 2,000분 금방 소진

#### 로컬 CI 옵션

**옵션 A: Self-hosted Runner (추천)**

미니 PC에 GitHub Actions runner를 설치하면 GitHub Actions 문법 그대로 쓰면서 로컬에서 실행.

```bash
# 미니 PC에 runner 설치
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf actions-runner-linux-x64.tar.gz
./config.sh --url https://github.com/<owner>/<repo> --token <TOKEN>
sudo ./svc.sh install && sudo ./svc.sh start
```

워크플로우에서 `runs-on: self-hosted`로 지정:

```yaml
jobs:
  e2e:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
```

**옵션 B: Git Hook (pre-push)**

`husky`로 push 전에 로컬에서 테스트:

```bash
npx husky add .husky/pre-push "pnpm test:e2e"
```

단점: 개인 환경 의존, CI 리포트 없음.

**옵션 C: 하이브리드 (추천 조합)**

```
PR 생성 → GitHub Actions (클라우드): ESLint + 타입 체크
        → Self-hosted Runner (미니 PC): E2E 테스트
main 머지 → Vercel 자동 배포 (프론트)
         → SSH 배포 (백엔드)
```

이렇게 하면 과금 걱정 없이 모든 테스트를 PR 단계에서 돌릴 수 있다.

---

## 5. GFS 백업 전략 요약

Grandfather-Father-Son 전략으로 다계층 백업 운영.

| 타입 | 주기 | 보관 | 최대 파일 수 (추정) |
|------|------|------|-------------------|
| 4시간 | 6회/일 | 7일 | ~42개 |
| 일간 | 1회/일 | 30일 | ~30개 |
| 주간 | 1회/주 | 90일 | ~13개 |
| 월간 | 1회/월 | 1년 | ~12개 |
| 분기 | 1회/분기 | 2년 | ~8개 |
| 연간 | 1회/년 | 5년 | ~5개 |

총 ~110개 파일. DB 크기 10MB 기준, 압축 시 총 ~100-300MB 정도.

디스크 걱정 없이 안전하게 운영 가능한 수준이다.

---

## 6. 폴더 구조 결정

| 이름 | 적합한 경우 |
|------|-----------|
| `deploy/` | 배포 스크립트/가이드만 |
| `infra/` | 배포 + 백업 + CI/CD + 모니터링 (포괄적) |
| `ops/` | 운영 전반 (온콜, 인시던트 등 포함) |

백업, CI/CD, 모니터링까지 포함하므로 **`infra/`** 를 선택했다.

```
infra/
├── README.md            # 인프라 가이드 (메인)
├── TIPS.md              # 배포 전략 비교/팁 (이 파일)
└── scripts/
    └── backup.sh        # GFS 백업 스크립트

.github/
└── workflows/
    └── ci.yml           # GitHub Actions CI (ESLint)
```

---

## 7. 모니터링 + 로그 수집 스택 비교

### 후보 스택

#### A. ELK (Elasticsearch + Logstash + Kibana)

```
Docker logs → Logstash (파싱/변환) → Elasticsearch (저장/검색) → Kibana (시각화)
```

| 장점 | 단점 |
|------|------|
| 풀텍스트 검색 최강 | **최소 RAM 4-8GB** (Elasticsearch만 2GB+) |
| 거대한 생태계, 레퍼런스 풍부 | 설정 복잡도 높음 (3개 서비스 각각 튜닝) |
| 다양한 데이터 소스 지원 | 디스크 사용량이 큼 (인덱스) |
| Elastic APM으로 추적까지 확장 가능 | 미니 PC에서 리소스 부담이 심함 |

**적합한 경우**: 대규모 트래픽, 다수의 마이크로서비스, 로그 기반 분석이 핵심인 경우.

#### B. PLG (Promtail + Loki + Grafana)

```
Docker logs → Promtail (수집) → Loki (저장) → Grafana (시각화)
```

| 장점 | 단점 |
|------|------|
| **매우 가벼움** (Loki RAM ~256MB, 전체 ~512MB) | 풀텍스트 검색은 Elasticsearch보다 약함 |
| Grafana 하나로 로그 + 메트릭 + 대시보드 통합 | Loki는 라벨 기반 검색 (구조화 필요) |
| 설정이 간단하고 Docker Compose로 바로 실행 | ELK만큼 생태계가 크진 않음 |
| Prometheus와 자연스러운 연동 | |
| 디스크 효율적 (인덱스 대신 라벨 기반) | |

**적합한 경우**: 소규모 서비스, 리소스가 제한된 환경, 메트릭과 로그를 한 곳에서 보고 싶은 경우.

#### C. Dozzle + Uptime Kuma (초경량)

```
Docker logs → Dozzle (실시간 로그 뷰어)
HTTP 요청 → Uptime Kuma (업타임 모니터링 + 알림)
```

| 장점 | 단점 |
|------|------|
| **극도로 가벼움** (합쳐서 ~100MB RAM) | 로그 저장/검색 불가 (Dozzle은 실시간 뷰어) |
| 설정 제로 — docker-compose에 추가하면 끝 | 과거 로그 분석은 `docker logs`에 의존 |
| Uptime Kuma: 예쁜 UI, 다양한 알림 (Slack, Discord, Telegram 등) | 메트릭 수집 없음 (CPU, 메모리 추세) |
| 별도 에이전트 불필요 | 확장성 한계 |

**적합한 경우**: 개인 프로젝트 초기, "일단 돌아가는지 확인"이 목적인 경우.

#### D. PLG + Prometheus + node-exporter (풀 옵저버빌리티)

```
Docker logs  → Promtail → Loki ──┐
시스템 메트릭 → node-exporter ────┤── Grafana (통합 대시보드)
앱 메트릭    → Prometheus ────────┘
업타임 체크  → Uptime Kuma (독립)
```

| 장점 | 단점 |
|------|------|
| 로그 + 메트릭 + 업타임 완벽 커버 | 컨테이너 5-6개 추가 (~1GB RAM) |
| Grafana에서 모든 데이터를 한 눈에 | 초기 설정에 시간 소요 |
| 커뮤니티 대시보드 풍부 | |
| 알림 규칙 설정 가능 (Grafana Alerting) | |

**적합한 경우**: 체계적인 운영을 원하면서 ELK만큼의 리소스는 쓰기 싫은 경우.

---

### 비교 요약

| 항목 | ELK | PLG | Dozzle + Uptime Kuma | PLG + Prometheus |
|------|-----|-----|---------------------|-----------------|
| **최소 RAM** | 4-8GB | ~512MB | ~100MB | ~1GB |
| **디스크** | 많음 | 적음 | 거의 없음 | 적음 |
| **로그 검색** | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ | ★★★☆☆ |
| **메트릭** | APM 별도 | Prometheus 연동 | 없음 | ★★★★★ |
| **시각화** | Kibana | Grafana | Dozzle (실시간) | Grafana |
| **설정 난이도** | 높음 | 낮음 | 매우 낮음 | 중간 |
| **알림** | Watcher (유료) | Grafana Alerting | Uptime Kuma | Grafana + Uptime Kuma |
| **컨테이너 수** | 3개 | 3개 | 2개 | 5-6개 |

---

### 추천: PLG 스택 (Promtail + Loki + Grafana)

이 프로젝트에는 **PLG 스택**이 가장 적합하다.

**서버 사양:** ASUS NUC 14 Essential (NUC14MNK35) — Intel N355 8코어 8스레드 (최대 3.9GHz, TDP 15W), **16GB RAM**, 2TB M.2 SSD

**이유:**

1. **리소스 효율**: 미니 PC(16GB)에서 운영하므로 ELK의 4-8GB RAM 요구는 과도함. PLG는 ~512MB로 충분 (전체 서비스 합산 ~900MB, 16GB의 약 6%)
2. **서비스 규모에 적합**: 컨테이너 2개(backend, postgres)의 로그를 수집하는 데 ELK는 오버 스펙
3. **확장 가능**: 나중에 Prometheus + node-exporter를 추가하면 메트릭까지 커버 (점진적 도입)
4. **Grafana 통합**: 로그, 메트릭, 알림을 하나의 대시보드에서 관리
5. **Docker 친화적**: Docker Compose에 3개 서비스 추가만으로 구성 완료

**단계적 도입 전략:**

```
1단계: PLG (Promtail + Loki + Grafana)        — 로그 수집 + 시각화
2단계: + Prometheus + node-exporter            — 시스템/앱 메트릭
3단계: + Uptime Kuma                           — 외부 업타임 모니터링 + 알림
4단계: + Grafana Alerting                      — 이상 징후 자동 알림
```

Dozzle + Uptime Kuma는 "지금 당장 빠르게"가 목적이면 좋지만, 로그를 저장하고 검색할 수 없어서 장기 운영에는 부족하다. PLG를 처음부터 세팅해두면 이후 확장도 자연스럽다.
