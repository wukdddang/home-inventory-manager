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
