# 프론트엔드-백엔드 정합성 정리 및 백엔드 할 일

**목적**: 프론트엔드 UI 구현 현황과 docs(ERD·논리 설계·기능 체크리스트)를 대조하여, 백엔드 개발 시 **반영·조정·결정**해야 할 사항을 정리한 문서입니다.

**현재 버전**: **v1.3** — §2 필드 추가 11건 결정 완료

| 버전 | 날짜 | 단계 | 요약 |
|------|------|------|------|
| v1.0 | 2026-03-26 | 간극 분석 | 프론트 구현과 docs 대조 완료. 결정 항목 31건 도출 |
| v1.1 | 2026-03-26 | 설계 결정 | §1 엔티티 병합/단순화 4건 결정 확정 |
| v1.2 | 2026-03-26 | docs 수정 | docs/v2/ 문서 4건 생성. §6 체크리스트 18/19건 완료 |
| **v1.3** | 2026-03-26 | 설계 결정 | §2 필드 추가/변경 11건 결정 확정. Purchase 스냅샷 3컬럼 추가, categoryId nullable 확정 등 |
| v2.0 | — | 물리적 설계 | TypeORM 엔티티·마이그레이션 확정 |
| v2.1 | — | API 설계 | 엔드포인트·DTO 명세 확정 |
| v3.0 | — | 구현 완료 | 1차 백엔드 개발 완료, 프론트 연동 시작 |

> 각 버전의 상세 변경 내역은 [CHANGELOG.md](./CHANGELOG.md) 참조

**참조 문서**:
- 루트: [ER 다이어그램](../../docs/er-diagram.md) · [개념적 설계](../../docs/entity-conceptual-design.md) · [논리적 설계](../../docs/entity-logical-design.md) · [기능 체크리스트](../../docs/feature-checklist.md)
- 프론트: [screens-overview.md](../../frontend/docs/screens-overview.md) · [ui-roadmap.md](../../frontend/docs/ui-roadmap.md) · [types/domain.ts](../../frontend/types/domain.ts)

**중요도 기준**:
- **P0 — 필수**: 프론트엔드가 이미 이 구조로 동작하므로, 백엔드가 맞추지 않으면 연동 불가
- **P1 — 높음**: 핵심 플로우에 영향. 1차 개발에 포함 권장
- **P2 — 보통**: 있으면 좋지만 후순위 가능. 프론트 수정으로 대체 가능한 경우 포함
- **P3 — 낮음**: 현재 프론트 UI 없음 또는 향후 확장 영역

---

## 0. 현재 설계 단계 — 어디까지 왔고, 무엇을 해야 하는가

### 설계 진행 현황

| 단계 | 상태 | 설명 |
|------|------|------|
| 개념적 설계 | 완료 | 엔티티 이름·속성·관계 정의. 큰 변경 없음 (kind, supplierName 등 소폭 추가만 필요) |
| 논리적 설계 | **수정 필요** | PK/FK·타입·제약까지 정의됨. 프론트 구현 피드백을 반영한 revision 필요 |
| 물리적 설계 | 미착수 | TypeORM 엔티티, 인덱스, 마이그레이션 등 |
| 백엔드 구현 | 미착수 | NestJS 모듈·서비스·컨트롤러 |

### 왜 논리적 설계 수정이 필요한가

논리적 설계 자체가 틀렸던 것이 아니다. 프론트엔드를 **실제로 구현하면서** 사용자 플로우에 맞게 실용적 판단이 들어갔고, 그 결과 설계 원안과 구현 사이에 간극이 생긴 상황이다.

```
개념적 설계 (완료) → 논리적 설계 (완료) → 프론트 구현 (진행)
                                              ↓
                                    프론트가 실용적으로 변형하며 개발
                                    (엔티티 병합, 필드 추가, 구조 단순화)
                                              ↓
                                    설계 원안 ↔ 구현 간극 발생
                                              ↓
                                    ★ 논리적 설계 v2 — 프론트 구현 피드백 반영 ★
                                              ↓
                                    물리적 설계 → 백엔드 구현
```

이 과정은 **설계-구현 피드백 루프**(design-implementation feedback loop)로, 소프트웨어 개발에서 자연스러운 반복 과정이다.

### 간극의 주요 원인

- **엔티티 통합**: Consumption + WasteRecord + InventoryLog → 단일 InventoryLedgerRow로 통합이 UX상 자연스러웠음
- **구조 단순화**: ShoppingList 2단 구조(부모→자식)가 실제 화면에서 불필요, flat 구조로 대체
- **필드 추가**: 거점 유형(kind), 구매처(supplierName), 비정규화 스냅샷 등 화면 요구에 따라 추가
- **nullable 변경**: Purchase.inventoryItemId를 선택으로 — "구매만 먼저, 재고 연결은 나중에" 플로우 지원

### 다음 단계

본 문서의 §1~§6 항목을 검토·결정한 뒤, **논리적 설계 문서를 v2로 수정**하고, 이어서 물리적 설계(TypeORM 엔티티)·백엔드 구현으로 진행한다.

---

## 1. 엔티티 병합/단순화 — 설계 결정 (v1.1 확정)

프론트엔드가 docs 원안보다 **단순화한 구조**로 구현된 부분입니다. 아래 4건 모두 **v1.1에서 결정 확정**되었습니다.

| # | 항목 | 결정 | 상세 | 중요도 | 상태 |
|---|------|------|------|--------|------|
| 1-1 | **Household + HouseStructure** | **2테이블 유지 + API DTO flat 병합** | 백엔드는 Household, HouseStructure 2테이블 유지. API 응답 DTO에서 join하여 프론트 `Household` 타입에 맞는 flat shape로 내려줌 (rooms, furniturePlacements, storageLocations, items, structureDiagramLayout 포함) | **P0** | **확정** |
| 1-2 | **ShoppingList 구조** | **방안 B — ShoppingList 테이블 제거** | ShoppingList(부모) 테이블을 제거하고, ShoppingListItem을 Household에 직접 연결 (`householdId FK`). 프론트에 "리스트 이름·마감일" 개념이 없으므로 부모 테이블은 불필요. `checked` 컬럼도 제거 — 구매 완료 시 행 삭제 방식 | **P1** | **확정** |
| 1-3 | **InventoryLog + WasteRecord + Consumption** | **방안 A — 단일 InventoryLog 테이블로 통합** | Consumption, WasteRecord 테이블을 제거하고 InventoryLog 하나로 통합. `type: "in"\|"out"\|"adjust"\|"waste"`, `reason varchar nullable`(폐기 사유), `refType`/`refId`(출처 참조)로 구분. 프론트 `InventoryLedgerRow` 타입과 1:1 대응. 이력 조회 쿼리가 단순해짐 | **P0** | **확정** |
| 1-4 | **HouseholdMember** | **테이블 유지 + API DTO에서 email 포함** | HouseholdMember 테이블(id, userId, householdId, role, joinedAt) 유지. API 응답에서 User를 join하여 프론트 `GroupMember`(id, email, role, label?) 형태의 DTO로 반환 | **P1** | **확정** |

---

## 2. 프론트에 있지만 docs ERD에 없는 필드/개념 — 설계 결정 (v1.3 확정)

프론트엔드가 **docs보다 확장하여 구현**한 부분입니다. 아래 11건 모두 **v1.3에서 결정 확정**되었습니다.

| # | 프론트 타입 | 추가 필드/개념 | 결정 | 근거 | 중요도 | 상태 |
|---|------------|---------------|------|------|--------|------|
| 2-1 | `Household` | **`kind`** | Household에 `kind varchar nullable` 추가 | 프론트가 거점 유형(home/office/vehicle/other)으로 적극 사용 중. 별도 HouseholdKind 마스터 테이블은 과설계 — 라벨 관리는 프론트 로컬에서 충분 | **P1** | **확정** |
| 2-2 | `Household` | **`structureDiagramLayout`** | HouseStructure에 `diagramLayout jsonb nullable` 추가 | structurePayload(방·슬롯 정의)와 용도가 다름 — diagramLayout은 구조도 2D 렌더링 좌표 전용 | **P2** | **확정** |
| 2-3 | `FurniturePlacement` | **`anchorDirectStorageId`** | `anchorDirectStorageId bigint FK nullable` 추가 | 가구 배치의 대표 보관 슬롯을 지정하여 UI에서 앵커 포인트로 사용. 프론트 UX에 필요한 메타 정보 | **P2** | **확정** |
| 2-4 | `PurchaseRecord` | **`supplierName`** | Purchase에 `supplierName varchar nullable` 추가 (수기 입력) | 개념 설계에 "구매처 이름(선택)" 이미 기술됨. 1차는 수기 입력으로 시작. **Supplier 별도 테이블은 통계 기능 구현 시(다음 버전) 추가** 예정 | **P1** | **확정** |
| 2-5 | `PurchaseRecord` | **`inventoryItemId` optional** | Purchase.inventoryItemId FK를 **nullable**로 변경 | 프론트 `/purchases`에서 "구매만 먼저, 재고 연결은 나중에" 플로우가 구현됨. 영수증 기록 후 집에서 정리하는 실사용 패턴 반영 | **P0** | **확정** |
| 2-6 | `PurchaseRecord` | **`itemName`, `variantCaption`, `unitSymbol`** | Purchase에 스냅샷 **3컬럼 항상 저장** (`itemName`, `variantCaption`, `unitSymbol` 모두 varchar nullable) | 품목(Product/ProductVariant)이 삭제되어도 구매 내역에 품목명이 표시되어야 함. join만으로는 원본 삭제 시 복원 불가. 재고 미연결 구매(§2-5)에서도 필수 | **P1** | **확정** |
| 2-7 | `InventoryRow` | **`name`, `unit`, `categoryId` 등** | API 응답 DTO에서 join으로 해결. **테이블 변경 없음** | InventoryItem은 ProductVariant FK를 통해 Product→Category까지 join 가능. 재고는 삭제보다 수량 0 관리가 일반적이므로 스냅샷 불필요 | **P0** | **확정** |
| 2-8 | `NotificationItem` | **`householdId`** | Notification에 `householdId bigint FK nullable` 추가. userId 유지 | 프론트는 householdId 기준으로 알림을 필터. 같은 가족 그룹의 알림을 모아 볼 수 있어야 함. userId는 개인 알림·수신자 식별에 필요 | **P1** | **확정** |
| 2-9 | `InventoryLedgerRow` | **`itemLabel`** | InventoryLog에 `itemLabel varchar nullable` **유지** | 품목(Product)이 삭제되어도 이력에 "식료품 › 우유 › 500ml" 같은 품목명이 표시되어야 함. 이력은 "그 시점에 무슨 일이 있었는지"를 기록하는 성격 — 원본 삭제와 무관하게 읽을 수 있어야 함 | **P2** | **확정** |
| 2-10 | `ShoppingListEntry` | **`targetStorageLocationId`** | ShoppingListItem에 `targetStorageLocationId bigint FK nullable` 추가 | 장보기 제안에서 "담기" 시 기존 품목의 보관 칸(storageLocationId)을 자동 복사. 구매 후 "어디에 넣을지" 힌트 표시("넣을 칸 · 부엌 › 냉장고 › 윗칸"). 수동 추가 시에는 미설정(nullable) | **P2** | **확정** |
| 2-11 | `ShoppingListEntry` | **`categoryId` optional** | ShoppingListItem.categoryId를 **nullable**로 변경 | 현재 프론트에서는 카탈로그 선택·제안 담기 두 경로 모두 categoryId를 채우지만, 타입은 optional으로 선언. 향후 "우유 사야 함" 같은 자유 텍스트 장보기 항목 지원 시 nullable이 필요. 현재 UI에서 categoryId 기반 필터/그룹핑은 사용하지 않음 | **P1** | **확정** |

---

## 3. docs에 있지만 프론트 구현이 없거나 다른 엔티티

프론트에서 **별도 타입/UI가 없는** docs 엔티티입니다. 백엔드 1차 개발 범위에서 제외하거나 후순위로 미룰 수 있습니다.

| # | docs 엔티티 | 프론트 상태 | 비고 | 중요도 | 상태 |
|---|-------------|------------|------|--------|------|
| 3-1 | **Consumption** | 별도 타입 없음 | InventoryLog로 통합 (§1-3 확정). 테이블 제거, `type="out"`으로 표현 | **P0** | **확정** (§1-3) |
| 3-2 | **WasteRecord** | 별도 타입 없음 | InventoryLog로 통합 (§1-3 확정). 테이블 제거, `type="waste"` + `reason`으로 표현 | **P0** | **확정** (§1-3) |
| 3-3 | **HouseStructure** | 별도 타입 없음 | 테이블 유지, API DTO에서 Household에 병합 (§1-1 확정) | **P0** | **확정** (§1-1) |
| 3-4 | **ReportPreset** | UI 없음 | ui-roadmap.md에서도 우선순위 낮음. 1차 개발 제외 | **P3** | 보류 |
| 3-5 | **Tag** | UI 없음 | feature-checklist.md에 있으나 카테고리로 대체 가능. 1차 개발 제외 | **P3** | 보류 |
| 3-6 | **Purchase.userId** | 프론트 타입에 없음 | 구매 수행 사용자 FK. 백엔드에서 인증 토큰 기반 자동 기록 가능 — 프론트 입력 불필요 | **P2** | 미결정 |
| 3-7 | **ShoppingList (부모)** | UI 없음 | 테이블 제거 (§1-2 확정). ShoppingListItem이 Household에 직접 연결 | **P1** | **확정** (§1-2) |
| 3-8 | **ShoppingListItem.checked** | 프론트에 없음 | 컬럼 제거 (§1-2 확정). 구매 완료 시 행 삭제 방식 | **P2** | **확정** (§1-2) |

---

## 4. 프론트에만 있는 추가 기능 — 백엔드 API 필요

프론트엔드가 현재 클라이언트 로직으로 구현한 기능 중, 백엔드 API로 이관해야 할 것들입니다.

| # | 기능 | 현재 구현 | 백엔드 필요 사항 | 중요도 | 상태 |
|---|------|----------|-----------------|--------|------|
| 4-1 | **Shopping Suggestions (장보기 제안)** | `shopping-suggestions.ts` — 유통기한 임박 + minStockLevel 미달 품목 자동 제안, 이미 장보기에 있는 품목 제외, 보충 수량 계산 | `GET /api/shopping-suggestions?householdId=` API. 프론트 로직과 동일한 쿼리: PurchaseBatch 만료 임박 + InventoryItem.quantity < minStockLevel | **P1** | 미결정 |
| 4-2 | **NotificationDetailPreferences** | `AppSettings` 안에 12개 필드 (expirationDaysBefore, scope, 요일 등) | User 또는 Household 단위 설정 테이블. `notification_preferences jsonb` 또는 정규화 컬럼 | **P1** | 미결정 |
| 4-3 | **HouseholdKindDefinition 관리** | `household-kind-defaults.ts` + 설정 화면에서 CRUD | **방안 A**: Household.kind만 varchar로 저장 (프론트에서 관리) / **방안 B**: HouseholdKind 마스터 테이블 추가. 현재 프론트는 로컬에서 관리하므로 **A로 시작** 가능 | **P2** | 미결정 |
| 4-4 | **ProductCatalog 공유 스토어** | `him-catalog` 로컬스토리지 키로 전역 관리. Household에서 분리됨 | Catalog(Unit, Category, Product, ProductVariant)가 **Household-scoped인지 global인지** 결정 필요. 프론트는 현재 global처럼 사용 | **P0** | 미결정 |
| 4-5 | **구매 → 재고 자동 반영** | 프론트 미구현 (ui-roadmap.md에서 "백엔드 API에서 처리"로 명시) | Purchase 생성 시 InventoryItem.quantity 자동 증가 + InventoryLog(type="in") 자동 생성. 트랜잭션 처리 | **P1** | 미결정 |
| 4-6 | **온보딩 마법사 지원 API** | 프론트에서 4단계 위자드 (Household → Room → FurniturePlacement → StorageLocation) | 각 엔티티 생성 API가 순차적으로 호출됨. 벌크 생성 API 제공 시 UX 개선 가능 | **P2** | 미결정 |
| 4-7 | **알림 생성 (서버 사이드)** | 프론트에서 mock 시드 7건. 실제 알림 생성 로직 없음 | 스케줄러/크론: 유통기한 임박, 재고 부족, 장보기 리마인더 체크 후 Notification 생성 | **P1** | 미결정 |
| 4-8 | **소비·폐기 처리** | 대시보드에서 수량·메모·사유 입력 → InventoryLedgerRow 생성 + 수량 감소 | API: `POST /api/inventory-logs` (type="out"/"waste") → InventoryItem.quantity 감소 + InventoryLog 생성. 트랜잭션 | **P0** | 미결정 |

---

## 5. API 응답 DTO 설계 가이드

프론트엔드 타입(`types/domain.ts`)과 백엔드 DB 스키마 사이의 **변환 레이어**가 필요한 항목입니다.

| 프론트 타입 | DB 테이블 | join/변환 필요 사항 |
|------------|----------|-------------------|
| `Household` | Household + HouseStructure + Room[] + FurniturePlacement[] + StorageLocation[] + InventoryItem[] + HouseholdMember[] | **가장 복잡한 DTO**. 모든 하위 엔티티를 nested로 포함. 페이지네이션 또는 lazy 로딩 검토 |
| `InventoryRow` | InventoryItem + ProductVariant + Product + Category + Unit | name, unit, categoryId 등은 join 결과에서 매핑 |
| `PurchaseRecord` | Purchase + PurchaseBatch[] + (ProductVariant + Product) | itemName, variantCaption, unitSymbol은 join 또는 스냅샷 |
| `InventoryLedgerRow` | InventoryLog (통합 시) | itemLabel은 InventoryItem → ProductVariant → Product join |
| `ShoppingListEntry` | ShoppingListItem (+ Product/ProductVariant/InventoryItem optional) | label, unit, variantCaption은 join 결과 |
| `NotificationItem` | Notification | householdId 추가 필요 (§2-8) |

---

## 6. docs 수정 체크리스트

v1 원본은 `docs/v1/`에 보존, v2 문서는 `docs/v2/`에 생성했습니다.

### §1 결정에 따른 docs 수정 (v1.1 확정 → v1.2 반영 완료)

- [x] `entity-logical-design.md` — Consumption 엔티티 섹션 제거, InventoryLog에 통합 명시 (§1-3)
- [x] `entity-logical-design.md` — WasteRecord 엔티티 섹션 제거, InventoryLog에 `reason`, `refType`, `refId` 명시 (§1-3)
- [x] `entity-logical-design.md` — ShoppingList 엔티티 섹션 제거 (§1-2)
- [x] `entity-logical-design.md` — ShoppingListItem에 `householdId FK` 추가, `shoppingListId FK` 제거, `checked` 컬럼 제거 (§1-2)
- [x] `er-diagram.md` — Consumption, WasteRecord 엔티티 제거, InventoryLog 통합 반영 (§1-3)
- [x] `er-diagram.md` — ShoppingList 엔티티 제거, ShoppingListItem → Household 직접 연결 (§1-2)
- [x] `entity-conceptual-design.md` — 위 통합/제거 사항 동기화 (§1-2, §1-3)
- [x] `feature-checklist.md` — Consumption, WasteRecord 항목을 InventoryLog 항목으로 통합 (§1-3)
- [x] `feature-checklist.md` — ShoppingList 항목 제거, ShoppingListItem 항목에 병합 (§1-2)

### §2 필드 추가에 따른 docs 수정 (v1.2 반영 + v1.3 추가분)

- [x] `entity-logical-design.md` — Purchase.inventoryItemId를 nullable로 변경 (§2-5)
- [x] `entity-logical-design.md` — Purchase에 `supplierName varchar nullable` 추가 (§2-4)
- [x] `entity-logical-design.md` — Notification에 `householdId bigint FK nullable` 추가 (§2-8)
- [x] `entity-logical-design.md` — ShoppingListItem.categoryId를 nullable로 변경 (§2-11) **v1.3 확정**
- [x] `er-diagram.md` — Household에 `kind` 속성 추가 (§2-1)
- [x] `er-diagram.md` — HouseStructure에 `diagramLayout` 속성 추가 (§2-2)
- [x] `er-diagram.md` — FurniturePlacement에 `anchorDirectStorageId` 추가 (§2-3)
- [x] `er-diagram.md` — ShoppingListItem에 `targetStorageLocationId` 추가 (§2-10)
- [x] `entity-conceptual-design.md` — 위 필드 추가 사항 중 개념 수준에서 반영할 것 동기화
- [x] `entity-logical-design.md` — Purchase에 스냅샷 3컬럼 추가: `itemName`, `variantCaption`, `unitSymbol` (§2-6) **v1.3 반영 완료**
- [x] `entity-conceptual-design.md` — Purchase 스냅샷 필드 개념 수준 반영 (§2-6) **v1.3 반영 완료**
- [x] `er-diagram.md` — Purchase 엔티티 목록에 스냅샷 3컬럼 명시 (§2-6) **v1.3 반영 완료**
- [x] `entity-logical-design.md` — ShoppingListItem.categoryId nullable 확정 (§2-11) **v1.3 반영 완료**
- [x] `entity-conceptual-design.md` — ShoppingListItem categoryId nullable 반영 (§2-11) **v1.3 반영 완료**

### §4 추가 기능에 따른 docs 수정 (v1.2 반영 완료)

- [x] `feature-checklist.md` — Shopping Suggestions, 소비·폐기 처리, 구매→재고 자동 반영 등 추가 기능 항목 추가

---

## 7. 1차 개발 범위 제안 (P0 + P1)

아래는 중요도 P0·P1 항목만 모은 **1차 백엔드 개발 범위**입니다.

### 엔티티/스키마 결정 (P0) — v1.1 확정 포함
1. ~~InventoryLog + WasteRecord + Consumption → **단일 InventoryLog 테이블로 통합**~~ (1-3) **확정**
2. ~~Household + HouseStructure → 2테이블 유지, **API DTO에서 병합**~~ (1-1) **확정**
3. Purchase.inventoryItemId → **nullable** (2-5)
4. InventoryRow 조회 DTO → **join 기반 응답** (2-7)
5. ProductCatalog 스코프 결정 → **Household-scoped vs global** (4-4)
6. 소비·폐기 API + 수량 자동 감소 트랜잭션 (4-8)

### 스키마 추가 (P1) — v1.1 확정 포함
7. Household.kind 컬럼 (2-1)
8. Purchase.supplierName 컬럼 (2-4)
9. Notification.householdId 컬럼 (2-8)
10. ShoppingListItem.categoryId nullable 여부 결정 (2-11)
11. ~~ShoppingList 테이블 제거, ShoppingListItem → Household 직접 연결~~ (1-2) **확정**
12. ~~HouseholdMember 테이블 유지, API에서 email 포함 DTO 반환~~ (1-4) **확정**

### API/로직 (P1)
13. Shopping Suggestions API (4-1)
14. 구매 → 재고 자동 반영 트랜잭션 (4-5)
15. 알림 생성 스케줄러 (4-7)
16. NotificationDetailPreferences 저장 (4-2)
17. PurchaseRecord 스냅샷 vs join 정책 결정 (2-6)

---

*본 문서는 프론트엔드 구현 기준으로 작성되었으며, 백엔드 개발 진행에 따라 갱신합니다.*
