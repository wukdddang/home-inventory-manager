# CLAUDE.md — Home Inventory Manager (집비치기)

## 프로젝트 개요
가정 재고 관리 웹 애플리케이션. 가구(household) 단위로 방/공간, 물품, 구매 로트, 재고 이력, 장보기 제안 등을 관리한다.

## 모노레포 구조
- **패키지 매니저**: pnpm 9.15.4 (workspace)
- **빌드 오케스트레이션**: Turborepo
- **Node**: >= 20

```
/
├── frontend/          # Next.js 16 (App Router), React 19, Tailwind CSS 4, port 4100
├── backend/           # NestJS 11 (초기 scaffold 상태)
├── packages/
│   ├── app-styles/    # 공유 Tailwind 추가 스타일 (@him/app-styles)
│   └── pretendard/    # Pretendard 폰트 에셋
├── docs/              # 공통 도메인 문서 (ERD, 엔티티 설계, 기능 체크리스트 등)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json       # 루트 스크립트 (dev, build, lint, test)
```

## 주요 명령어
```bash
pnpm dev               # frontend + backend 동시 실행
pnpm dev:frontend      # frontend만 (next dev -p 4100)
pnpm dev:backend       # backend만 (nest start --watch)
pnpm build             # 전체 빌드
pnpm lint              # 전체 lint
pnpm test              # 전체 테스트
```

## 프론트엔드 (frontend/)
- **프레임워크**: Next.js 16 (App Router), React 19
- **스타일링**: Tailwind CSS 4, class-variance-authority, tailwind-merge, clsx
- **UI/애니메이션**: framer-motion, lucide-react (아이콘), @radix-ui/react-toast
- **기타**: @xyflow/react (집 구조 플로우 차트)

### 라우트 구조
- `app/(current)/` — 실제 운영 페이지 (dashboard, purchases, inventory-history, settings, login, signup)
- `app/(mock)/mock/` — 목업/프로토타입 페이지 (동일 구조, sessionStorage 기반 mock 데이터)
- `app/_ui/` — 전역 공유 UI 컴포넌트

### 프론트엔드 아키텍처 컨벤션
각 페이지는 다음 하위 폴더 구조를 따른다:
- `_context/` — React Context, 서비스/포트 정의
- `_hooks/` — 페이지 전용 커스텀 훅
- `_ui/` — UI 컴포넌트 (네이밍: `*.panel`, `*.section`, `*.module`, `*.component`)
- `_lib/` — 헬퍼, mock 데이터 등

### 타입
- `types/domain.ts` — 도메인 공통 타입
- `types/index.ts` — 타입 re-export

### 라이브러리 유틸 (lib/)
`household-persist.ts`, `local-store.ts`, `shopping-suggestions.ts`, `purchase-lot-helpers.ts`, `table-period-filter.ts` 등

## 백엔드 (backend/)
- **프레임워크**: NestJS 11
- **테스트**: Jest
- 현재 초기 scaffold 상태 (app.controller, app.service, app.module)

## 도메인 문서
- `docs/design/er-diagram.md` — ER 다이어그램
- `docs/design/entity-conceptual-design.md` — 개념적 설계
- `docs/design/entity-logical-design.md` — 논리적 설계
- `docs/feature/feature-checklist.md` — 기능 체크리스트
- `docs/alignment/frontend-backend-alignment.md` — 프론트-백엔드 정합성 정리
- `frontend/docs/domain-data-model.md` — 프론트엔드용 도메인 데이터 모델
- `frontend/docs/screen/screens-overview.md` — 화면 설계 개요
- `frontend/docs/screen/ui-roadmap.md` — UI 개발 진행 현황

## 코드 컨벤션
- **커밋 메시지**: 한국어로 작성. 형식: `<타입>: <한글 제목>` (타입은 영어: feat, fix, refactor 등)
- **함수명**: Context 내 함수는 '~한다' 형태의 한글 함수명 사용
- **응답 언어**: 모든 대화 및 설명은 한국어로 작성
