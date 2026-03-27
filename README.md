# 집비치기 (Home Inventory Manager)

가정 재고 관리 웹 애플리케이션. 거점(household) 단위로 방/공간, 물품, 구매 로트, 재고 이력, 장보기 제안 등을 관리한다.

## 핵심 기능

- **거점(Household) 관리** — 집, 사무실, 차량 등 여러 거점을 등록하고 멤버와 공유
- **공간 구조** — 방 → 가구 → 보관 슬롯 계층으로 물건 위치 추적
- **재고 관리** — 소모품/비소모품 등록, 수량 추적, 카테고리·품목·용량 카탈로그
- **구매·로트 추적** — 구매 이력, 로트별 유통기한, 단가 변동 파악
- **재고 이력** — 입고/소비/폐기/조정 이력을 원장(ledger) 방식으로 기록
- **장보기 제안** — 유통기한 임박 + 최소 재고 미만 품목 자동 제안
- **알림** — 유통기한 임박, 재고 부족, 장보기 리마인더

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 16 (App Router), React 19, Tailwind CSS 4, framer-motion |
| 백엔드 | NestJS 11, TypeORM, PostgreSQL 16+ |
| 인증 | JWT + Refresh Token |
| 파일 저장 | AWS S3 |
| 빌드 | pnpm workspace + Turborepo |
| 배포 | 프론트: Vercel / 백엔드: Docker + Cloudflare Tunnel |

## 모노레포 구조

```
/
├── frontend/           # Next.js 16 (App Router), port 4100
├── backend/            # NestJS 11, port 4200
├── packages/
│   ├── app-styles/     # 공유 Tailwind 추가 스타일 (@him/app-styles)
│   └── pretendard/     # Pretendard 폰트 에셋
├── docs/               # 공통 도메인 문서 (ERD, 엔티티 설계, 정합성 등)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 시작하기

### 사전 요구사항

- Node.js >= 20
- pnpm 9.15.4+
- PostgreSQL 16+

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 전체 개발 서버 실행 (frontend + backend)
pnpm dev

# 개별 실행
pnpm dev:frontend      # http://localhost:4100
pnpm dev:backend       # http://localhost:4200
```

### 빌드 및 테스트

```bash
pnpm build             # 전체 빌드
pnpm lint              # 전체 lint
pnpm test              # 전체 테스트
```

## 문서

| 문서 | 설명 |
|------|------|
| [ER 다이어그램](docs/design/v2/er-diagram.md) | 엔티티 관계도 (v2.5) |
| [개념적 설계](docs/design/v2/entity-conceptual-design.md) | 엔티티·속성 정의 |
| [논리적 설계](docs/design/v2/entity-logical-design.md) | PK/FK/타입/제약 상세 |
| [정합성 정리](docs/alignment/frontend-backend-alignment.md) | 프론트-백엔드 설계 정합성 (v1.8) |
| [기능 체크리스트](docs/feature/feature-checklist.md) | 기능별 구현 현황 |
| [배포 가이드](docs/infra/monorepo-and-deployment.md) | 모노레포 + 배포 설정 |
| [프론트엔드 README](frontend/README.md) | 프론트엔드 상세 |
| [백엔드 README](backend/README.md) | 백엔드 상세 |

## 현재 진행 상황

- **프론트엔드**: 주요 화면 구현 완료 (대시보드, 구매, 재고 이력, 설정, 알림). localStorage 기반 mock 데이터로 동작
- **백엔드**: 초기 scaffold 상태. v2.5 설계 기준으로 개발 시작 예정
- **설계 문서**: v2.5 확정 (UUID PK, 엔티티 통합, Household-scoped 카탈로그)
