# 집비치기 — Frontend

Next.js 16 (App Router) + React 19 기반 프론트엔드. Tailwind CSS 4로 스타일링하며, localStorage 기반 mock 데이터로 독립 동작한다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 스타일링 | Tailwind CSS 4, class-variance-authority, tailwind-merge, clsx |
| 애니메이션 | framer-motion |
| 아이콘 | lucide-react |
| UI | @radix-ui/react-toast |
| 구조도 | @xyflow/react (집 구조 플로우 차트) |
| 폰트 | Pretendard (@him/pretendard) |

## 실행

```bash
# 루트에서
pnpm dev:frontend      # http://localhost:4100

# 또는 frontend 디렉토리에서
pnpm dev               # next dev -p 4100
```

## 라우트 구조

| 경로 | 설명 |
|------|------|
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/dashboard` | 대시보드 — 거점·방·구조도·재고·카탈로그·장보기 |
| `/purchases` | 구매·로트 관리 |
| `/inventory-history` | 재고 이력 타임라인 |
| `/settings` | 설정 — 카탈로그·알림·계정·멤버 관리 |
| `/mock/*` | 위 경로의 mock 버전 (sessionStorage 기반) |

- `app/(current)/` — 실제 운영 페이지 (백엔드 API 연동 예정)
- `app/(mock)/mock/` — 목업/프로토타입 페이지 (localStorage/sessionStorage 기반)

## 페이지 아키텍처

각 페이지는 다음 하위 폴더 구조를 따른다:

```
app/(mock)/mock/{페이지}/
├── _context/          # React Context, 서비스 Port 정의
├── _hooks/            # 페이지 전용 커스텀 훅
├── _ui/               # UI 컴포넌트 (*.panel, *.section, *.module, *.component)
├── _lib/              # 헬퍼, mock 시드 데이터
└── page.tsx
```

### Port 패턴 (데이터 소스 추상화)

```typescript
// _context/dashboard-households.port.ts
type DashboardHouseholdsPort = {
  list(): Promise<Household[]>;
  saveAll(households: Household[]): Promise<void>;
};
```

현재 localStorage 구현체를 사용하며, 백엔드 준비 시 fetch 기반 구현체로 교체한다.

## 타입

- `types/domain.ts` — 도메인 공통 타입 (Household, InventoryRow, PurchaseRecord 등)
- `types/index.ts` — 타입 re-export

## 유틸리티 (lib/)

| 파일 | 역할 |
|------|------|
| `local-store.ts` | localStorage CRUD, 구독 패턴, 타입 가드, v2.1 마이그레이션 |
| `shopping-suggestions.ts` | 장보기 제안 엔진 (유통기한 임박 + 최소 재고 미만) |
| `purchase-lot-helpers.ts` | 구매·로트 수량 합산, 유통기한 일수 계산 |
| `table-period-filter.ts` | 날짜 범위 필터링 |
| `inventory-lot-from-purchases.ts` | 구매 목록에서 품목 로트 요약 |
| `household-location.ts` | 공간 계층(방→가구→슬롯) 해석, 위치 breadcrumb |
| `household-kind-defaults.ts` | 거점 유형 기본값 (집/사무실/차량/기타) |
| `product-catalog-helpers.ts` | 카탈로그 표시 유틸 |
| `image-upload.ts` | 클라이언트 이미지 읽기 (DataURL, 10MB 제한) |

## localStorage 키

| 키 | 내용 |
|----|------|
| `him-user` | 로그인 사용자 |
| `him-households` | 거점 목록 (카탈로그 포함) |
| `him-purchases` | 구매 기록 |
| `him-inventory-ledger` | 재고 변경 이력 |
| `him-shopping-list` | 장보기 항목 |
| `him-settings` | 앱 설정 (알림 등) |
| `him-notifications` | 알림 목록 |
| `him-household-kinds` | 거점 유형 정의 |

## 구현 현황

- 대시보드: 거점·방·구조도·가구·보관·재고·카탈로그·소비·폐기·장보기·알림
- 구매: 등록·목록·로트·유통기한 임박 뱃지
- 재고 이력: 타임라인·거점 필터·기간 필터·컬럼 필터·정렬·페이지네이션·메모
- 설정: 카탈로그·알림 선호·계정·보안·멤버 관리·거점 유형
- 인증: 로그인·회원가입 (mock)

## 관련 문서

- [도메인 데이터 모델](docs/domain-data-model.md) — 루트 docs/ 참조 안내
- [화면 설계 개요](docs/screen/screens-overview.md) — 라우트·워크플로우·데이터 흐름
- [UI 개발 현황](docs/screen/ui-roadmap.md) — 화면별 구현 체크리스트
- [집 구조 프론트 기능](docs/feature/house-structure-feature.md) — 2D 구조도 구현 가이드
