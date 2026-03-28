# 개인 재고·물품 관리 시스템 (Home Inventory Manager) — Backend

NestJS + TypeORM 기반의 가정 재고 관리 백엔드
거점(household) 단위로 방/공간, 물품, 구매 로트, 재고 이력, 장보기 제안 등을 관리한다.

> **설계 기준**: [docs/design/v2/](../docs/design/v2/) (v2.5)
> **정합성 문서**: [docs/alignment/frontend-backend-alignment.md](../docs/alignment/frontend-backend-alignment.md) (v1.8)

---

## 1. 아키텍처

### 레이어드 아키텍처

```
Interface Layer    → REST Controllers, DTOs, Guards, Filters, Decorators
Service Layer      → 비즈니스 로직, 트랜잭션 관리, 복합 오케스트레이션
Domain Layer       → TypeORM 엔티티, Repository 패턴
Infrastructure     → PostgreSQL, S3, JWT, Scheduler
```

### 의존성 규칙

```
Interface → Service → Domain → Infrastructure
    ↓          ↓         ↓          ↓
  DTO/Guard  로직     엔티티    DB/외부 서비스
```

### 모듈 구성 (예정)

```
src/
├── auth/               # 인증 (JWT + Refresh Token)
│   ├── guards/         # JwtAuthGuard, RolesGuard, HouseholdMemberGuard
│   ├── strategies/     # JwtStrategy, JwtRefreshStrategy
│   └── decorators/     # @CurrentUser, @Roles
├── user/               # User 엔티티·CRUD
├── household/          # Household, HouseholdMember, HouseholdInvitation
├── catalog/            # Category, Unit, Product, ProductVariant (Household-scoped)
├── structure/          # HouseStructure, Room, FurniturePlacement, StorageLocation
├── inventory/          # InventoryItem, InventoryLog
├── purchase/           # Purchase, PurchaseBatch
├── shopping/           # ShoppingListItem, 장보기 제안 API
├── notification/       # Notification, NotificationPreference, ExpirationAlertRule
├── file/               # S3 이미지 업로드
├── household-kind/     # HouseholdKindDefinition (사용자별 거점 유형)
└── common/             # 공통 필터, 인터셉터, 파이프, 유틸
```

---

## 2. 기술 스택

| 항목            | 선택 기술                           | 비고                                  |
| --------------- | ----------------------------------- | ------------------------------------- |
| 언어/프레임워크 | TypeScript + NestJS 11              | —                                     |
| ORM             | TypeORM                             | PostgreSQL driver                     |
| 데이터베이스    | PostgreSQL 16+                      | JSONB 활용 (structurePayload, diagramLayout) |
| 인증            | JWT + Refresh Token                 | @nestjs/passport, Guard 패턴          |
| 인가            | Role-based Guard                    | admin / editor / viewer 3단계         |
| 유효성 검사     | class-validator + class-transformer | —                                     |
| 설정 관리       | @nestjs/config                      | .env + validation                     |
| 스케줄러        | @nestjs/schedule                    | 유통기한 체크, 알림 생성 등           |
| API 문서        | Postman Collection                  | —                                     |
| 파일 업로드     | AWS S3                              | 카탈로그 상품 이미지, 최대 10MB       |
| 테스트          | Jest                                | 단위·통합·e2e 모두 커버리지 100% 목표 |
| 배포            | Docker + Cloudflare Tunnel          | 홈 서버 운영                          |

---

## 3. 인증·인가 설계

### JWT + Refresh Token

```
POST /auth/signup       → User 생성, Access Token + Refresh Token 발급
POST /auth/login        → 이메일/비밀번호 검증, Access Token + Refresh Token 발급
POST /auth/refresh      → Refresh Token 검증, 새 Access Token 발급
POST /auth/logout       → Refresh Token 무효화
```

- **Access Token**: 짧은 만료 (15~30분), 요청 헤더 `Authorization: Bearer <token>`
- **Refresh Token**: 긴 만료 (7일), DB 또는 Redis 저장, 1회용 rotation 권장
- **비밀번호**: bcrypt 해싱

### Guard 패턴

| Guard | 역할 | 적용 범위 |
|-------|------|-----------|
| `JwtAuthGuard` | Access Token 검증, `req.user` 주입 | 전역 (Public 제외) |
| `RolesGuard` | HouseholdMember.role 기반 권한 체크 | 엔드포인트별 `@Roles('admin')` |
| `HouseholdMemberGuard` | 해당 Household 멤버인지 검증 | Household 하위 리소스 접근 시 |

### 역할 권한 매트릭스

| 역할   | 조회 | 추가 | 수정 | 삭제 | 멤버 관리 |
|--------|:----:|:----:|:----:|:----:|:---------:|
| admin  | O    | O    | O    | O    | O         |
| editor | O    | O    | O    | —    | —         |
| viewer | O    | —    | —    | —    | —         |

---

## 4. 도메인 & 엔티티 설계 (v2.5)

**상세 설계 문서**:
- [ER 다이어그램 v2](../docs/design/v2/er-diagram.md)
- [개념적 설계 v2](../docs/design/v2/entity-conceptual-design.md)
- [논리적 설계 v2](../docs/design/v2/entity-logical-design.md)

### PK: UUID 전체 적용

### 엔티티 목록 (21개)

| # | 엔티티 | 핵심 역할 | 우선순위 |
|---|--------|-----------|----------|
| 1 | User | 사용자 계정 | P0 |
| 2 | Household | 거점 (가족·그룹) | P0 |
| 3 | HouseholdMember | User ↔ Household N:N 연관 (role: admin/editor/viewer) | P0 |
| 4 | Category | 대분류 — Household-scoped | P0 |
| 5 | Unit | 단위 마스터 — Household-scoped | P1 |
| 6 | Product | 상품 마스터 — Household-scoped | P0 |
| 7 | ProductVariant | 용량/포장 단위별 정보 | P0 |
| 8 | InventoryItem | 실제 보유 재고 | P0 |
| 9 | Purchase | 구매 기록 (inventoryItemId nullable, 스냅샷 3컬럼) | P0 |
| 10 | PurchaseBatch | 로트별 유통기한 | P0 |
| 11 | InventoryLog | 재고 변경 이력 (in/out/adjust/waste 통합) | P0 |
| 12 | StorageLocation | 보관 슬롯 (방·가구 아래) | P0 |
| 13 | HouseStructure | 집 구조 (1:1, JSONB payload + diagramLayout) | P1 |
| 14 | Room | 집 구조 내 방 | P1 |
| 15 | FurniturePlacement | 방 안 가구 인스턴스 (anchorDirectStorageId) | P1 |
| 16 | ShoppingListItem | 장보기 항목 — Household 직접 연결 | P1 |
| 17 | Notification | 알림 (householdId 포함) | P1 |
| 18 | NotificationPreference | 알림 상세 설정 (마스터 토글 3종 포함) | P1 |
| 19 | ExpirationAlertRule | 만료 알림 설정 (품목별 일수) | P1 |
| 20 | HouseholdInvitation | 거점 초대 (링크·이메일) | P1 |
| 21 | HouseholdKindDefinition | 거점 유형 정의 (사용자별 라벨·순서) | P1 |

### v2에서 제거된 엔티티

| 엔티티 | 사유 | 대체 |
|--------|------|------|
| ~~Consumption~~ | InventoryLog(type='out')로 통합 | InventoryLog |
| ~~WasteRecord~~ | InventoryLog(type='waste' + reason)로 통합 | InventoryLog |
| ~~ShoppingList~~ | 부모 리스트 불필요, ShoppingListItem → Household 직접 연결 | ShoppingListItem |
| ~~Account~~ | 가계부 기능 범위 외 | — |
| ~~RecurringIncome~~ | 가계부 기능 범위 외 | — |
| ~~ReportPreset~~ | P3, 프론트 UI 없음 | — |
| ~~Tag~~ | P3, 카테고리로 대체 | — |

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

### 핵심 트랜잭션

1. **구매 → 재고 반영**: Purchase 생성 + InventoryItem.quantity 증가 + InventoryLog(type='in') 생성
2. **소비/폐기 기록**: InventoryItem.quantity 감소 + InventoryLog(type='out'|'waste') 생성
3. **장보기 완료**: `POST /api/shopping-list-items/:id/complete` — 재고 수량 증가 + InventoryLog 생성 + ShoppingListItem 삭제 (단일 트랜잭션)
4. **온보딩 벌크**: Household + Room + 카탈로그 일괄 생성

---

## 5. 주요 API 엔드포인트 (예정)

### 인증
```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
```

### 거점
```
GET    /households
POST   /households
GET    /households/:id
PUT    /households/:id
DELETE /households/:id
```

### 거점 멤버·초대
```
GET    /households/:id/members
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

### 집 구조
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
GET    /households/:id/inventory-logs       (페이지네이션 + 필터 + 정렬)
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

### 거점 유형 (사용자별)
```
CRUD   /household-kind-definitions
```

### 파일
```
POST   /upload/image                       (S3, 최대 10MB)
```

---

## 6. 개발 로드맵

### Phase 1 — 기반 + 인증 + 핵심 CRUD

- 프로젝트 환경 설정 (TypeORM, PostgreSQL, @nestjs/config)
- User 엔티티 + Auth 모듈 (JWT + Refresh Token + Guard)
- Household + HouseholdMember CRUD
- Category + Unit + Product + ProductVariant CRUD (Household-scoped)
- StorageLocation CRUD
- InventoryItem CRUD

### Phase 2 — 구매·재고 이력·트랜잭션

- Purchase + PurchaseBatch CRUD
- InventoryLog (소비/폐기/조정/입고)
- 구매 → 재고 반영 트랜잭션
- 소비/폐기 → 재고 감소 트랜잭션

### Phase 3 — 장보기·알림·구조

- ShoppingListItem CRUD + 장보기 완료 트랜잭션
- 장보기 제안 API (유통기한 임박 + 최소 재고 미만)
- HouseStructure + Room + FurniturePlacement CRUD
- HouseholdInvitation (초대 플로우)
- HouseholdKindDefinition CRUD

### Phase 4 — 알림·스케줄러·파일

- Notification + NotificationPreference CRUD
- ExpirationAlertRule + @Cron 만료 체크 → 알림 생성
- 재고 부족 알림
- S3 이미지 업로드
- 온보딩 벌크 API

### Phase 5 — 마무리

- 에러 핸들링 강화 (Exception Filter)
- Docker + CI/CD
- Cloudflare Tunnel 연동
- 프론트엔드 연동 테스트

---

## 7. 개발 명령어

```bash
# 개발 서버 (포트 4200)
pnpm dev:backend

# 빌드
pnpm build --filter backend

# 테스트
pnpm test --filter backend

# lint
pnpm lint --filter backend
```

---

## 8. 참고 문서

- [docs/design/v2/er-diagram.md](../docs/design/v2/er-diagram.md) — ER 다이어그램 v2.5
- [docs/design/v2/entity-conceptual-design.md](../docs/design/v2/entity-conceptual-design.md) — 개념적 설계
- [docs/design/v2/entity-logical-design.md](../docs/design/v2/entity-logical-design.md) — 논리적 설계
- [docs/alignment/frontend-backend-alignment.md](../docs/alignment/frontend-backend-alignment.md) — 프론트-백엔드 정합성
- [docs/feature/feature-checklist.md](../docs/feature/feature-checklist.md) — 기능 체크리스트
- [docs/infra/monorepo-and-deployment.md](../docs/infra/monorepo-and-deployment.md) — 배포 가이드
- [docs/policy/considerations.md](../docs/policy/considerations.md) — 향후 고려 기능
