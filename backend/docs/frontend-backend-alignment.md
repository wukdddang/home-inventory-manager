# 프론트엔드-백엔드 정합성 정리 및 백엔드 할 일

**목적**: 프론트엔드 UI 구현 현황과 docs(ERD·논리 설계·기능 체크리스트)를 대조하여, 백엔드 개발 시 **반영·조정·결정**해야 할 사항을 정리한 문서입니다.

**기준 시점**: 2026-03-26

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

## 1. 엔티티 병합/단순화 — 백엔드 설계 결정 필요

프론트엔드가 docs 원안보다 **단순화한 구조**로 구현된 부분입니다. 백엔드 테이블 설계와 API DTO 설계 시 방향을 정해야 합니다.

| # | 항목 | docs 설계 | 프론트 구현 | 권장 방향 | 중요도 |
|---|------|-----------|------------|-----------|--------|
| 1-1 | **Household + HouseStructure 병합** | 별도 엔티티 (Household ↔ HouseStructure 1:1) | `Household` 하나에 rooms, items, furniturePlacements, storageLocations, structureDiagramLayout 전부 내장 | 백엔드는 2테이블 유지, **API 응답 DTO에서 join하여 flat하게** 내려줌. 프론트 Household 타입에 맞춘 응답 shape 필요 | **P0** |
| 1-2 | **ShoppingList + ShoppingListItem 병합** | ShoppingList(부모) → ShoppingListItem(자식) 2단 구조 | `ShoppingListEntry` 하나로 flat화. 부모 ShoppingList 개념 없음, `checked` 필드 없음(구매 완료 시 삭제) | **방안 A**: 백엔드 2테이블 유지 + API에서 flat DTO 제공 / **방안 B**: ShoppingList 제거, ShoppingListItem만 Household에 직접 연결. 프론트는 "리스트 이름·마감일" 개념이 없으므로 B가 현실적 | **P1** |
| 1-3 | **InventoryLog + WasteRecord + Consumption 통합** | 3개 별도 엔티티 | `InventoryLedgerRow` 하나로 통합. `type: "in"\|"out"\|"adjust"\|"waste"` + `reason` 필드로 구분 | **방안 A**: 백엔드도 단일 `InventoryLog` 테이블로 통합 (reason, refType, refId로 출처 구분) / **방안 B**: 3테이블 유지 + API DTO 통합. **A 권장** — 프론트 타입과 일치하고, 이력 조회 쿼리가 단순해짐 | **P0** |
| 1-4 | **HouseholdMember → GroupMember 단순화** | HouseholdMember(id, userId, householdId, role, joinedAt) | `GroupMember`(id, email, role, label?) — userId 대신 email 기반, joinedAt 없음 | 백엔드는 HouseholdMember 테이블 유지. API 응답에서 User를 join하여 email 포함한 DTO 반환 | **P1** |

---

## 2. 프론트에 있지만 docs ERD에 없는 필드/개념

프론트엔드가 **docs보다 확장하여 구현**한 부분입니다. docs(ERD·논리 설계)를 수정하거나, 백엔드에 새 컬럼/엔티티를 추가해야 합니다.

| # | 프론트 타입 | 추가 필드/개념 | 설명 | 필요한 조치 | 중요도 |
|---|------------|---------------|------|------------|--------|
| 2-1 | `Household` | **`kind: string`** | 거점 유형 (home, office, vehicle, other + 사용자 정의). `HouseholdKindDefinition`으로 관리 | Household 테이블에 `kind varchar` 컬럼 추가. 또는 별도 `HouseholdKind` 마스터 테이블 | **P1** |
| 2-2 | `Household` | **`structureDiagramLayout`** | 구조도 2D 좌표 `Record<string, {x,y}>`. HouseStructure.structurePayload와 별도 | HouseStructure에 `diagramLayout jsonb` 컬럼 추가 | **P2** |
| 2-3 | `FurniturePlacement` | **`anchorDirectStorageId`** | 가구 배치의 대표 보관 슬롯 ID (UI 앵커링용) | FurniturePlacement 테이블에 `anchorDirectStorageId bigint FK nullable` 추가 | **P2** |
| 2-4 | `PurchaseRecord` | **`supplierName`** | 구매처 이름 | Purchase 테이블에 `supplierName varchar nullable` 추가. 개념 설계에는 "구매처 이름(선택)" 기술 있으므로 논리 설계에 반영 | **P1** |
| 2-5 | `PurchaseRecord` | **`inventoryItemId` optional** | 구매 기록이 재고에 연결되지 않을 수 있음 ("구매만 먼저, 재고 연결은 나중에") | Purchase.inventoryItemId FK를 **nullable**로 변경. ERD 원안(필수 FK)과 다름 — docs 수정 필요 | **P0** |
| 2-6 | `PurchaseRecord` | **`itemName`, `variantCaption`, `unitSymbol`** | 조회용 비정규화 스냅샷 문자열 | **방안 A**: Purchase 테이블에 스냅샷 컬럼 추가 / **방안 B**: API 응답에서 join으로 해결 (프론트 타입만 맞추면 됨). **B 권장** — 단, 재고 미연결 구매(2-5)는 스냅샷 필요 | **P1** |
| 2-7 | `InventoryRow` | **`name`, `unit`, `categoryId`, `variantCaption` 등** | 재고 품목의 조회용 비정규화 필드 | API 응답 DTO에서 ProductVariant → Product → Category join 결과를 포함. 테이블 변경 불필요 | **P0** |
| 2-8 | `NotificationItem` | **`householdId`** (userId 대신) | 알림의 소유 기준이 ERD(userId)와 다름 | Notification 테이블에 `householdId bigint FK nullable` 추가. userId도 유지. 프론트는 householdId 기준으로 필터 | **P1** |
| 2-9 | `InventoryLedgerRow` | **`itemLabel`** | 이력 행에 품목명 스냅샷 | InventoryLog에 `itemLabel varchar nullable` 추가. 또는 API join 응답으로 대체 | **P2** |
| 2-10 | `ShoppingListEntry` | **`targetStorageLocationId`** | 장보기 항목에 "넣을 칸 힌트" | ShoppingListItem에 `targetStorageLocationId bigint FK nullable` 추가 | **P2** |
| 2-11 | `ShoppingListEntry` | **`categoryId` optional** | docs에서는 categoryId 필수, 프론트는 선택 | docs 수정: categoryId를 nullable로 변경. 또는 프론트 수정. 결정 필요 | **P1** |

---

## 3. docs에 있지만 프론트 구현이 없거나 다른 엔티티

프론트에서 **별도 타입/UI가 없는** docs 엔티티입니다. 백엔드 1차 개발 범위에서 제외하거나 후순위로 미룰 수 있습니다.

| # | docs 엔티티 | 프론트 상태 | 비고 | 중요도 |
|---|-------------|------------|------|--------|
| 3-1 | **Consumption** | 별도 타입 없음 | `InventoryLedgerRow(type="out")`으로 흡수. 1-3 결정에 따라 처리 | **P0** (1-3과 연동) |
| 3-2 | **WasteRecord** | 별도 타입 없음 | `InventoryLedgerRow(type="waste")`으로 흡수. 1-3 결정에 따라 처리 | **P0** (1-3과 연동) |
| 3-3 | **HouseStructure** | 별도 타입 없음 | Household에 병합됨. 1-1 결정에 따라 처리 | **P0** (1-1과 연동) |
| 3-4 | **ReportPreset** | UI 없음 | ui-roadmap.md에서도 우선순위 낮음. 1차 개발 제외 권장 | **P3** |
| 3-5 | **Tag** | UI 없음 | feature-checklist.md에 있으나 카테고리로 대체 가능. 1차 개발 제외 권장 | **P3** |
| 3-6 | **Purchase.userId** | 프론트 타입에 없음 | 구매 수행 사용자 FK. 백엔드에서 인증 토큰 기반 자동 기록 가능 — 프론트 입력 불필요 | **P2** |
| 3-7 | **ShoppingList (부모)** | UI 없음 | 1-2 결정에 따라 처리 | **P1** (1-2와 연동) |
| 3-8 | **ShoppingListItem.checked** | 프론트에 없음 | "구매 완료 시 삭제" 방식으로 대체됨. 백엔드에서 soft-delete 또는 checked 컬럼 유지 여부 결정 | **P2** |

---

## 4. 프론트에만 있는 추가 기능 — 백엔드 API 필요

프론트엔드가 현재 클라이언트 로직으로 구현한 기능 중, 백엔드 API로 이관해야 할 것들입니다.

| # | 기능 | 현재 구현 | 백엔드 필요 사항 | 중요도 |
|---|------|----------|-----------------|--------|
| 4-1 | **Shopping Suggestions (장보기 제안)** | `shopping-suggestions.ts` — 유통기한 임박 + minStockLevel 미달 품목 자동 제안, 이미 장보기에 있는 품목 제외, 보충 수량 계산 | `GET /api/shopping-suggestions?householdId=` API. 프론트 로직과 동일한 쿼리: PurchaseBatch 만료 임박 + InventoryItem.quantity < minStockLevel | **P1** |
| 4-2 | **NotificationDetailPreferences** | `AppSettings` 안에 12개 필드 (expirationDaysBefore, scope, 요일 등) | User 또는 Household 단위 설정 테이블. `notification_preferences jsonb` 또는 정규화 컬럼 | **P1** |
| 4-3 | **HouseholdKindDefinition 관리** | `household-kind-defaults.ts` + 설정 화면에서 CRUD | **방안 A**: Household.kind만 varchar로 저장 (프론트에서 관리) / **방안 B**: HouseholdKind 마스터 테이블 추가. 현재 프론트는 로컬에서 관리하므로 **A로 시작** 가능 | **P2** |
| 4-4 | **ProductCatalog 공유 스토어** | `him-catalog` 로컬스토리지 키로 전역 관리. Household에서 분리됨 | Catalog(Unit, Category, Product, ProductVariant)가 **Household-scoped인지 global인지** 결정 필요. 프론트는 현재 global처럼 사용 | **P0** |
| 4-5 | **구매 → 재고 자동 반영** | 프론트 미구현 (ui-roadmap.md에서 "백엔드 API에서 처리"로 명시) | Purchase 생성 시 InventoryItem.quantity 자동 증가 + InventoryLog(type="in") 자동 생성. 트랜잭션 처리 | **P1** |
| 4-6 | **온보딩 마법사 지원 API** | 프론트에서 4단계 위자드 (Household → Room → FurniturePlacement → StorageLocation) | 각 엔티티 생성 API가 순차적으로 호출됨. 벌크 생성 API 제공 시 UX 개선 가능 | **P2** |
| 4-7 | **알림 생성 (서버 사이드)** | 프론트에서 mock 시드 7건. 실제 알림 생성 로직 없음 | 스케줄러/크론: 유통기한 임박, 재고 부족, 장보기 리마인더 체크 후 Notification 생성 | **P1** |
| 4-8 | **소비·폐기 처리** | 대시보드에서 수량·메모·사유 입력 → InventoryLedgerRow 생성 + 수량 감소 | API: `POST /api/inventory-logs` (type="out"/"waste") → InventoryItem.quantity 감소 + InventoryLog 생성. 트랜잭션 | **P0** |

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

위 분석 결과를 반영하여 **루트 docs 문서를 수정**해야 할 항목입니다.

- [ ] `entity-logical-design.md` — Purchase.inventoryItemId를 nullable로 변경 (§2-5)
- [ ] `entity-logical-design.md` — Purchase에 `supplierName varchar nullable` 추가 (§2-4)
- [ ] `entity-logical-design.md` — Notification에 `householdId bigint FK nullable` 추가 (§2-8)
- [ ] `entity-logical-design.md` — ShoppingListItem.categoryId nullable 여부 결정 (§2-11)
- [ ] `er-diagram.md` — Household에 `kind` 속성 추가 (§2-1)
- [ ] `er-diagram.md` — HouseStructure에 `diagramLayout` 속성 추가 (§2-2)
- [ ] `er-diagram.md` — FurniturePlacement에 `anchorDirectStorageId` 추가 (§2-3)
- [ ] `er-diagram.md` — ShoppingListItem에 `targetStorageLocationId` 추가 (§2-10)
- [ ] `entity-conceptual-design.md` — 위 변경 사항 중 개념 수준에서 반영할 것 동기화
- [ ] `feature-checklist.md` — Shopping Suggestions, 소비·폐기 처리, 구매→재고 자동 반영 등 추가 기능 항목 추가

---

## 7. 1차 개발 범위 제안 (P0 + P1)

아래는 중요도 P0·P1 항목만 모은 **1차 백엔드 개발 범위**입니다.

### 엔티티/스키마 결정 (P0)
1. InventoryLog + WasteRecord + Consumption → **단일 InventoryLog 테이블로 통합** (1-3)
2. Household + HouseStructure → 2테이블 유지, **API DTO에서 병합** (1-1)
3. Purchase.inventoryItemId → **nullable** (2-5)
4. InventoryRow 조회 DTO → **join 기반 응답** (2-7)
5. ProductCatalog 스코프 결정 → **Household-scoped vs global** (4-4)
6. 소비·폐기 API + 수량 자동 감소 트랜잭션 (4-8)

### 스키마 추가 (P1)
7. Household.kind 컬럼 (2-1)
8. Purchase.supplierName 컬럼 (2-4)
9. Notification.householdId 컬럼 (2-8)
10. ShoppingListItem.categoryId nullable 여부 결정 (2-11)
11. ShoppingList 부모 테이블 유지 여부 결정 (1-2)
12. HouseholdMember API → email 포함 DTO (1-4)

### API/로직 (P1)
13. Shopping Suggestions API (4-1)
14. 구매 → 재고 자동 반영 트랜잭션 (4-5)
15. 알림 생성 스케줄러 (4-7)
16. NotificationDetailPreferences 저장 (4-2)
17. PurchaseRecord 스냅샷 vs join 정책 결정 (2-6)

---

*본 문서는 프론트엔드 구현 기준으로 작성되었으며, 백엔드 개발 진행에 따라 갱신합니다.*
