# CHANGELOG — frontend-backend-alignment.md

[frontend-backend-alignment.md](./frontend-backend-alignment.md)의 버전별 상세 변경 내역입니다.

---

## v1.4 — 카탈로그 Household-scoped + NotificationPreference + Purchase.userId 확정 (2026-03-26)

**단계**: §3-6, §4-2, §4-4 결정 확정 + docs/v2.1 반영

### 확정된 결정

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| 4-4 | ProductCatalog 스코프 | **Household-scoped** — Category, Unit, Product에 `householdId FK` 추가 | 거점별로 카탈로그 분리. 같은 거점 멤버끼리 공유. "다른 거점에서 카탈로그 가져오기"로 거점 간 복사 가능. ProductVariant는 Product를 통해 간접 스코프 |
| 4-2 | NotificationDetailPreferences | **별도 NotificationPreference 테이블** (userId FK + householdId FK nullable) | null이면 사용자 기본값, 값이 있으면 거점별 오버라이드. 향후 알림 채널(이메일/푸시), 시간대, 알림 유형별 세분화 등 확장 대비 |
| 3-6 | Purchase.userId | **유지 확정** (nullable FK) | 이미 v2 ERD에 존재. 백엔드에서 인증 토큰 기반 자동 기록. 프론트 입력 불필요 |

### docs/v2.1 반영 사항
- `entity-logical-design.md`: §3 Category, §8 Unit, §9 Product에 householdId FK 추가. §19 NotificationPreference 신규 섹션 추가. ERD Mermaid 갱신. v2 변경 요약 테이블에 v2.1 항목 추가. 정합성 제약 테이블 추가
- `er-diagram.md`: 엔티티 목록에 Category/Unit/Product householdId 명시, NotificationPreference 추가. 관계 요약·Mermaid ERD 갱신
- `entity-conceptual-design.md`: Category, Unit, Product에 소속 거점 추가. NotificationPreference 엔티티 추가. 개념적 설계 메모 갱신
- `feature-checklist.md`: Category/Unit/Product 섹션에 거점별 표기·가져오기 기능 추가. NotificationPreference CRUD 섹션 추가

### 연쇄 영향 (카탈로그 Household-scoped)
카탈로그가 거점별로 분리됨에 따라, 아래 FK 참조 시 같은 household 소속이어야 함 (앱 레벨 제약):
- ShoppingListItem: categoryId, productId, productVariantId
- FurniturePlacement: productId, productVariantId
- ExpirationAlertRule: productId
- InventoryItem: productVariantId (StorageLocation.householdId 통해)

### 남은 미결정 사항
- §4 나머지 API/로직 항목 (4-1, 4-3, 4-5, 4-6, 4-7, 4-8) → API 설계(v2.1) 단계에서 결정

---

## v1.3 — §2 필드 추가/변경 11건 결정 확정 (2026-03-26)

**단계**: §2 전체 결정 완료 + docs/v2 반영

### 확정된 결정

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| 2-1 | Household.kind | `kind varchar nullable` 추가 | 프론트가 거점 유형으로 적극 사용. 별도 마스터 테이블은 과설계 |
| 2-2 | HouseStructure.diagramLayout | `diagramLayout jsonb nullable` 추가 | structurePayload와 용도 분리 (렌더링 좌표 전용) |
| 2-3 | FurniturePlacement.anchorDirectStorageId | `anchorDirectStorageId FK nullable` 추가 | UI 앵커 포인트용 메타 정보 |
| 2-4 | Purchase.supplierName | `supplierName varchar nullable` 추가 | 1차 수기 입력. Supplier 테이블은 **통계 기능 구현 시(다음 버전) 추가** 예정 |
| 2-5 | Purchase.inventoryItemId | **nullable 확정** | "구매만 먼저, 재고 연결은 나중에" 플로우 (영수증 → 나중에 정리) |
| 2-6 | Purchase 스냅샷 | `itemName`, `variantCaption`, `unitSymbol` **3컬럼 항상 저장** | 품목 삭제 시에도 구매 내역 표시 필요. join만으로는 원본 삭제 시 복원 불가 |
| 2-7 | InventoryRow 비정규화 | **API DTO join으로 해결. 테이블 변경 없음** | ProductVariant FK 통해 join 가능. 재고는 삭제보다 수량 0 관리가 일반적 |
| 2-8 | Notification.householdId | `householdId FK nullable` 추가 | 프론트가 householdId 기준으로 알림 필터. userId도 유지 |
| 2-9 | InventoryLog.itemLabel | `itemLabel varchar nullable` **유지** | 품목 삭제 시에도 이력에 품목명 표시 필요. 이력은 시점 기록 성격 |
| 2-10 | ShoppingListItem.targetStorageLocationId | `targetStorageLocationId FK nullable` 추가 | 장보기 제안 "담기" 시 기존 보관 칸 자동 복사. 구매 후 "어디에 넣을지" 힌트 |
| 2-11 | ShoppingListItem.categoryId | **nullable 확정** | 현재 프론트는 항상 채우지만 타입은 optional. 자유 텍스트 장보기 확장 대비 |

### docs/v2 반영 사항
- `entity-logical-design.md`: Purchase §12에 스냅샷 3컬럼 추가, ShoppingListItem §15 categoryId nullable 확정, v2 변경 요약 테이블 갱신
- `er-diagram.md`: Purchase 엔티티 목록에 스냅샷 명시, ShoppingListItem categoryId nullable 반영
- `entity-conceptual-design.md`: Purchase 스냅샷 필드·ShoppingListItem categoryId 반영

### 설계 메모: 스냅샷 vs join 정책
- **스냅샷 저장**: Purchase(itemName/variantCaption/unitSymbol), InventoryLog(itemLabel) — 원본 삭제 대비
- **join 조회**: InventoryRow(name/unit/categoryId 등) — 재고 품목은 삭제보다 수량 0으로 관리, join 충분
- **Supplier 테이블**: 1차는 supplierName 수기 입력. 구매처별 지출 통계·가격 비교 필요 시 다음 버전에서 Supplier 마스터 테이블 추가 예정

### 남은 미결정 사항
- [x] ProductCatalog 스코프: Household-scoped vs global (§4-4) → **v1.4 확정: Household-scoped**

---

## v1.2 — docs v2 문서 생성 (2026-03-26)

**단계**: §6 docs 수정 체크리스트 수행 완료 (18/19건)

### 수행한 작업

**폴더 구조 변경**:
- `docs/v1/` — v1 원본 4건 보존 (entity-logical-design, er-diagram, entity-conceptual-design, feature-checklist)
- `docs/v2/` — v2 문서 4건 신규 생성

**v2 문서 생성 목록**:

| 파일 | 주요 변경 |
|------|-----------|
| `docs/v2/entity-logical-design.md` | Consumption·WasteRecord 섹션 제거 → InventoryLog §14 통합 (type/reason/itemLabel). ShoppingList §17 제거 → ShoppingListItem에 householdId FK. Purchase.inventoryItemId nullable, supplierName 추가. Notification.householdId 추가. Household.kind, HouseStructure.diagramLayout, FurniturePlacement.anchorDirectStorageId, ShoppingListItem.targetStorageLocationId 추가. 하단에 v2 변경 요약 테이블 포함 |
| `docs/v2/er-diagram.md` | 엔티티 목록에서 Consumption·WasteRecord·ShoppingList 제거, InventoryLog "소비·폐기 통합" 명시. Mermaid ERD 갱신. "v2에서 제거된 엔티티" 테이블 추가 |
| `docs/v2/entity-conceptual-design.md` | 동일 엔티티 제거/통합 반영. v1 매핑 테이블 추가 (Consumption→InventoryLog, WasteRecord→InventoryLog, ShoppingList→제거) |
| `docs/v2/feature-checklist.md` | Consumption·WasteRecord 섹션을 InventoryLog 섹션으로 통합. ShoppingList 섹션 제거, ShoppingListItem에 병합. Shopping Suggestions, 구매→재고 자동 반영, 소비·폐기 처리 기능 추가 |

### §6 체크리스트 진행

- §1 결정에 따른 수정: **9/9건 완료**
- §2 필드 추가 수정: **8/9건 완료** (ShoppingListItem.categoryId nullable 미결정)
- §4 추가 기능 수정: **1/1건 완료**
- **총 18/19건 완료**

### 남은 미결정 사항
- [ ] ShoppingListItem.categoryId nullable 여부 (§2-11)
- [ ] Purchase.inventoryItemId nullable 확정 (§2-5) — v2에 nullable로 반영했으나 최종 확정 대기
- [ ] ProductCatalog 스코프: Household-scoped vs global (§4-4)

---

## v1.1 — §1 엔티티 병합/단순화 설계 결정 (2026-03-26)

**단계**: §1 4건 결정 확정

### 확정된 결정

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| 1-1 | Household + HouseStructure | **2테이블 유지 + API DTO flat 병합** | DB 정규화 유지하면서 프론트 타입에 맞춤. HouseStructure의 structurePayload 등 큰 JSONB를 분리해두는 것이 관리상 유리 |
| 1-2 | ShoppingList 구조 | **방안 B — ShoppingList 테이블 제거** | 프론트에 리스트 이름·마감일 개념이 없음. ShoppingListItem을 Household에 직접 연결. checked 컬럼도 제거 (구매 완료 시 행 삭제) |
| 1-3 | InventoryLog 통합 | **방안 A — 단일 InventoryLog 테이블** | Consumption, WasteRecord 테이블 제거. type/reason/refType/refId로 구분. 프론트 InventoryLedgerRow와 1:1 대응, 이력 조회 쿼리 단순화 |
| 1-4 | HouseholdMember | **테이블 유지 + API DTO에서 email 포함** | 정규화된 User-Household 관계 유지. API 응답에서 User join하여 GroupMember 형태로 반환 |

### 연쇄 확정된 항목 (§3)
- 3-1 Consumption → InventoryLog 통합으로 테이블 제거 확정
- 3-2 WasteRecord → InventoryLog 통합으로 테이블 제거 확정
- 3-3 HouseStructure → 테이블 유지, API DTO 병합 확정
- 3-7 ShoppingList (부모) → 테이블 제거 확정
- 3-8 ShoppingListItem.checked → 컬럼 제거 확정

### §6 docs 수정 체크리스트에 9건 추가
- entity-logical-design.md: Consumption/WasteRecord 섹션 제거, InventoryLog 통합 반영, ShoppingList 섹션 제거, ShoppingListItem에 householdId FK 추가
- er-diagram.md: Consumption/WasteRecord/ShoppingList 엔티티 제거, 관계 재정리
- entity-conceptual-design.md, feature-checklist.md 동기화

### 남은 미결정 사항 (v1.0에서 이관)
- [ ] Purchase.inventoryItemId nullable 확정 (§2-5) — 방향은 nullable이나 docs 수정 시 최종 확정
- [ ] ShoppingListItem.categoryId nullable 여부 (§2-11)
- [ ] ProductCatalog 스코프: Household-scoped vs global (§4-4)

---

## v1.0 — 프론트-백엔드 간극 분석 (2026-03-26)

**단계**: 간극 분석 완료, 결정 대기

### 수행한 작업
- 프론트엔드 구현(`types/domain.ts`, 라우트, _context/, lib/)과 docs(ERD·논리 설계·기능 체크리스트) 전수 대조
- 프론트 ui-roadmap.md, screens-overview.md 반영

### 도출된 항목 (31건)
- §1 엔티티 병합/단순화 결정 필요: **4건**
- §2 프론트에만 있는 추가 필드/개념: **11건**
- §3 docs에만 있고 프론트 구현 없는 엔티티: **8건**
- §4 프론트 전용 기능 → 백엔드 API 필요: **8건**

### 중요도 분포
- P0 (필수): 6건 — InventoryLog 통합, Household DTO 병합, Purchase.inventoryItemId nullable, InventoryRow join DTO, Catalog 스코프 결정, 소비·폐기 API
- P1 (높음): 11건 — kind 컬럼, supplierName, Notification.householdId, ShoppingList 구조, Shopping Suggestions API, 구매→재고 자동 반영, 알림 스케줄러 등
- P2 (보통): 8건 — diagramLayout, anchorDirectStorageId, Purchase.userId, checked 컬럼, 온보딩 벌크 API 등
- P3 (낮음): 2건 — ReportPreset, Tag

### 미결정 사항 → v1.1에서 처리
- [x] InventoryLog + WasteRecord + Consumption 통합 여부 (§1-3) → **v1.1 확정: 단일 테이블 통합**
- [x] ShoppingList 부모 테이블 유지 여부 (§1-2) → **v1.1 확정: 제거**
- [ ] Purchase.inventoryItemId nullable 확정 (§2-5) → v1.1 미결정, v1.2에서 처리
- [ ] ShoppingListItem.categoryId nullable 여부 (§2-11)
- [ ] ProductCatalog 스코프: Household-scoped vs global (§4-4)

---

## v1.1 — 설계 결정 (예정)

**단계**: §1 엔티티 병합/단순화 결정 반영

### 예상 작업
- v1.0 미결정 사항 5건에 대한 결정 확정
- 결정 근거 기록
- frontend-backend-alignment.md §1 테이블에 결정 결과 반영

---

## v1.2 — docs 수정 (예정)

**단계**: 논리적 설계 v2 반영

### 예상 작업
- frontend-backend-alignment.md §6 체크리스트 10건 수행
- `entity-logical-design.md` 수정 (nullable 변경, 컬럼 추가, 엔티티 통합)
- `er-diagram.md` 수정 (속성 추가)
- `entity-conceptual-design.md` 동기화
- `feature-checklist.md` 항목 추가

---

## v2.0 — 물리적 설계 (예정)

**단계**: TypeORM 엔티티·마이그레이션 확정

### 예상 작업
- NestJS + TypeORM 엔티티 클래스 작성
- 인덱스·유니크 제약 정의
- 초기 마이그레이션 생성
- DB 선정 및 연결 설정

---

## v2.1 — API 설계 (예정)

**단계**: 엔드포인트·DTO 명세 확정

### 예상 작업
- REST 엔드포인트 목록 확정
- 요청/응답 DTO 정의 (§5 DTO 설계 가이드 기반)
- 인증·인가 미들웨어 설계
- Swagger/OpenAPI 명세

---

## v3.0 — 구현 완료 (예정)

**단계**: 1차 백엔드 개발 완료

### 예상 작업
- P0 + P1 항목 전체 구현
- 프론트엔드 연동 테스트
- 프론트 mock 서비스 → API 서비스 전환

---

*새 버전 작성 시: 상단에 추가하고, frontend-backend-alignment.md의 버전 테이블도 함께 갱신합니다.*
