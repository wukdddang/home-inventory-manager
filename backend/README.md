# 집비치기 — Backend

NestJS 11 + TypeORM 기반의 가정 재고 관리 백엔드.
거점(household) 단위로 방/공간, 물품, 구매 로트, 재고 이력, 장보기 제안 등을 관리한다.

> **설계 기준**: [docs/design/v2/](../docs/design/v2/) (v2.5)
> **정합성 문서**: [docs/alignment/frontend-backend-alignment.md](../docs/alignment/frontend-backend-alignment.md) (v1.8)

---

## 1. 아키텍처

### 레이어드 아키텍처

```
Interface Layer    → REST Controllers, DTOs, Guards, Decorators
    ↓
Business Layer     → 비즈니스 로직, 트랜잭션 관리, 복합 오케스트레이션
    ↓
Context Layer      → Commands, Command Handlers (CQRS 패턴)
    ↓
Domain Layer       → TypeORM 엔티티, Repository 패턴
    ↓
Infrastructure     → PostgreSQL, JWT, Mail, Scheduler
```

### 모듈 구성

```
src/
├── common/
│   ├── auth/           # JWT 인프라 (Guards, Strategies, Decorators)
│   ├── config/         # 환경 변수 검증 (Joi)
│   ├── database/       # TypeORM 비동기 설정
│   └── infrastructure/ # Mail 서비스 (NodeMailer)
├── domain/             # TypeORM 엔티티 (21개 모듈)
│   ├── user/
│   ├── household/
│   ├── household-invitation/
│   ├── household-kind-definition/
│   ├── category/
│   ├── unit/
│   ├── product/
│   ├── product-variant/
│   ├── inventory-item/
│   ├── inventory-log/
│   ├── purchase/
│   ├── purchase-batch/
│   ├── storage-location/
│   ├── house-structure/
│   ├── room/
│   ├── furniture-placement/
│   ├── shopping-list-item/
│   ├── notification/
│   ├── notification-preference/
│   └── expiration-alert-rule/
├── business/           # 비즈니스 서비스 (17개 모듈)
├── context/            # CQRS Command Handlers
├── interface/          # REST 컨트롤러 (17개 모듈)
│   ├── auth/
│   ├── household/
│   ├── invitation/
│   ├── household-kind/
│   ├── category/
│   ├── unit/
│   ├── product/
│   ├── product-variant/
│   ├── inventory-item/
│   ├── inventory-log/
│   ├── purchase/
│   ├── purchase-batch/
│   ├── shopping-list/
│   ├── space/
│   ├── notification/
│   ├── notification-preference/
│   └── expiration-alert-rule/
└── app.module.ts
```

---

## 2. 기술 스택

| 항목 | 기술 | 비고 |
|------|------|------|
| 언어/프레임워크 | TypeScript 5.7 + NestJS 11 | — |
| ORM | TypeORM 0.3 | PostgreSQL driver |
| 데이터베이스 | PostgreSQL 17 | JSONB 활용 (structurePayload, diagramLayout) |
| 인증 | JWT + Refresh Token | @nestjs/passport, bcrypt |
| 인가 | Role-based Guard | admin / editor / viewer 3단계 |
| 유효성 검사 | class-validator + class-transformer | Global ValidationPipe |
| 설정 관리 | @nestjs/config | .env + Joi 검증 |
| 스케줄러 | @nestjs/schedule | 유통기한 체크, 알림 생성 |
| 메일 | NodeMailer | 이메일 인증, 초대 |
| 테스트 | Jest + @testcontainers/postgresql | — |
| 배포 | Docker + Cloudflare Tunnel | 로컬 리눅스 서버 |

---

## 3. 실행

### 사전 요구사항

- Node.js >= 20
- pnpm 9.15.4+
- PostgreSQL 17 (Docker 권장)

### 환경 변수

`backend/.env`를 `.env.example` 기반으로 생성:

```bash
cp .env.example .env
```

| 변수 | 설명 | 예시 |
|------|------|------|
| `DB_HOST` | PostgreSQL 호스트 | `localhost` |
| `DB_PORT` | PostgreSQL 포트 | `5432` |
| `DB_USERNAME` | DB 사용자 | `postgres` |
| `DB_PASSWORD` | DB 비밀번호 | `postgres` |
| `DB_DATABASE` | DB 이름 | `home_inventory` |
| `JWT_SECRET` | Access Token 서명 키 | (랜덤 문자열) |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 키 | (랜덤 문자열) |
| `JWT_EXPIRES_IN` | Access Token 만료 | `30m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 만료 | `7d` |
| `MAIL_HOST` | SMTP 호스트 | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP 포트 | `587` |
| `MAIL_USER` | SMTP 사용자 | — |
| `MAIL_PASSWORD` | SMTP 비밀번호 | — |
| `MAIL_FROM` | 발신 이메일 | `noreply@example.com` |
| `APP_URL` | 프론트엔드 URL | `http://localhost:4100` |
| `PORT` | 백엔드 포트 | `4200` |

### 개발 서버

```bash
# 루트에서
pnpm dev:backend       # http://localhost:4200

# 또는 backend 디렉토리에서
pnpm start:dev         # nest start --watch
```

### 빌드 및 테스트

```bash
pnpm build --filter backend
pnpm test --filter backend
pnpm lint --filter backend
```

---

## 4. 인증·인가

### JWT + Refresh Token

```
POST /auth/signup       → User 생성, Access + Refresh Token 발급
POST /auth/login        → 이메일/비밀번호 검증, Token 발급
POST /auth/refresh      → Refresh Token → 새 Access Token
POST /auth/logout       → Refresh Token 무효화
GET  /auth/verify-email → 이메일 인증 확인
GET  /auth/me           → 현재 사용자 정보
PATCH /auth/password    → 비밀번호 변경
```

### Guard 패턴

| Guard | 역할 | 적용 범위 |
|-------|------|-----------|
| `JwtAuthGuard` | Access Token 검증, `req.user` 주입 | 전역 (Public 제외) |
| `JwtRefreshGuard` | Refresh Token 검증 | `/auth/refresh` |
| `RolesGuard` | HouseholdMember.role 기반 권한 체크 | `@Roles('admin')` |
| `HouseholdMemberGuard` | 해당 Household 멤버인지 검증 | Household 하위 리소스 |

### 역할 권한 매트릭스

| 역할 | 조회 | 추가 | 수정 | 삭제 | 멤버 관리 |
|------|:----:|:----:|:----:|:----:|:---------:|
| admin | O | O | O | O | O |
| editor | O | O | O | — | — |
| viewer | O | — | — | — | — |

---

## 5. 도메인 엔티티 (v2.5)

UUID PK 전체 적용. 21개 엔티티.

| # | 엔티티 | 핵심 역할 |
|---|--------|-----------|
| 1 | User | 사용자 계정 |
| 2 | Household | 거점 (가족·그룹) |
| 3 | HouseholdMember | User ↔ Household N:N (role: admin/editor/viewer) |
| 4 | HouseholdInvitation | 거점 초대 (링크·이메일) |
| 5 | HouseholdKindDefinition | 거점 유형 정의 (사용자별) |
| 6 | Category | 대분류 — Household-scoped |
| 7 | Unit | 단위 마스터 — Household-scoped |
| 8 | Product | 상품 마스터 — Household-scoped |
| 9 | ProductVariant | 용량/포장 단위별 정보 |
| 10 | InventoryItem | 실제 보유 재고 |
| 11 | Purchase | 구매 기록 (스냅샷 컬럼 포함) |
| 12 | PurchaseBatch | 로트별 유통기한 |
| 13 | InventoryLog | 재고 변경 이력 (in/out/adjust/waste) |
| 14 | StorageLocation | 보관 슬롯 (방·가구 아래) |
| 15 | HouseStructure | 집 구조 (JSONB payload + diagramLayout) |
| 16 | Room | 집 구조 내 방 |
| 17 | FurniturePlacement | 방 안 가구 인스턴스 |
| 18 | ShoppingListItem | 장보기 항목 |
| 19 | Notification | 알림 |
| 20 | NotificationPreference | 알림 상세 설정 |
| 21 | ExpirationAlertRule | 만료 알림 설정 (품목별 일수) |

### 공간 계층

```
Household
  └── HouseStructure (1:1)
        └── Room (1:N)
              ├── FurniturePlacement (1:N)
              │     └── StorageLocation (1:N) — 가구 위·안 보관 슬롯
              └── StorageLocation (1:N) — 방 직속 슬롯
                    └── InventoryItem (1:N)
```

---

## 6. 주요 API 엔드포인트

### 인증
```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/verify-email
GET    /auth/me
PATCH  /auth/password
```

### 거점
```
POST   /households
GET    /households
GET    /households/:id
PUT    /households/:id
DELETE /households/:id
```

### 거점 멤버·초대
```
GET    /households/:id/members
POST   /households/:id/members
PATCH  /households/:id/members/:memberId/role
DELETE /households/:id/members/:memberId
POST   /households/:id/invitations
POST   /invitations/:token/accept
DELETE /households/:id/invitations/:invitationId
```

### 카탈로그 (Household-scoped)
```
CRUD   /households/:id/categories
CRUD   /households/:id/units
CRUD   /households/:id/products
CRUD   /households/:id/products/:productId/variants
```

### 공간 구조
```
GET    /households/:id/structure
POST   /households/:id/structure
CRUD   /households/:id/rooms
CRUD   /households/:id/furniture-placements
CRUD   /households/:id/storage-locations
```

### 재고
```
CRUD   /households/:id/inventory-items
GET    /households/:id/inventory-logs
```

### 구매
```
GET    /households/:id/purchases
POST   /households/:id/purchases
DELETE /households/:id/purchases/:purchaseId
```

### 장보기
```
CRUD   /households/:id/shopping-list-items
POST   /households/:id/shopping-list-items/:itemId/complete
GET    /households/:id/shopping-suggestions
```

### 알림
```
GET    /notifications
PATCH  /notifications/:id/read
GET    /notification-preferences
PUT    /notification-preferences
CRUD   /expiration-alert-rules
```

### 거점 유형
```
CRUD   /household-kind-definitions
```

---

## 7. 핵심 트랜잭션

1. **구매 → 재고 반영**: Purchase 생성 + InventoryItem.quantity 증가 + InventoryLog(type='in')
2. **소비/폐기 기록**: InventoryItem.quantity 감소 + InventoryLog(type='out'|'waste')
3. **장보기 완료**: 재고 수량 증가 + InventoryLog + ShoppingListItem 삭제 (단일 트랜잭션)
4. **온보딩 벌크**: Household + Room + 카탈로그 일괄 생성

---

## 8. Docker 빌드

```bash
# 루트 디렉토리에서 실행
docker build -f backend/Dockerfile -t him-backend .
```

멀티스테이지 빌드: pnpm workspace 구조를 유지하며 프로덕션 의존성만 포함.

---

## 9. 참고 문서

- [ER 다이어그램 v2.5](../docs/design/v2/er-diagram.md)
- [개념적 설계](../docs/design/v2/entity-conceptual-design.md)
- [논리적 설계](../docs/design/v2/entity-logical-design.md)
- [프론트-백엔드 정합성](../docs/alignment/frontend-backend-alignment.md)
- [기능 체크리스트](../docs/feature/feature-checklist.md)
- [배포 가이드](../deploy/README.md)
- [인프라 설정](../docs/infra/monorepo-and-deployment.md)
