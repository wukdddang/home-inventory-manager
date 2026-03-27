# 엔티티 논리적 설계 v2 (ERD·구현용)

**버전**: v2.1 — 카탈로그 Household-scoped + NotificationPreference 테이블 추가 (2026-03-26)

**v2.1 변경**:
- Category, Unit, Product에 `householdId FK` 추가 (카탈로그 Household-scoped)
- NotificationPreference 신규 테이블 추가 (userId + householdId nullable)
- Purchase.userId 유지 확정 (§3-6)
- "다른 거점 카탈로그 가져오기" 기능 예정

**v2 변경**:
- Consumption(§14), WasteRecord(§16) 제거 → InventoryLog(§15)로 통합
- ShoppingList(§17) 제거 → ShoppingListItem이 Household에 직접 연결
- ShoppingListItem.checked 제거 (구매 완료 시 행 삭제)
- Purchase.inventoryItemId nullable로 변경
- Purchase.supplierName 추가
- Notification.householdId 추가
- 변경 근거: [frontend-backend-alignment.md](../../alignment/frontend-backend-alignment.md) §1~§4 참조

**상위 문서**: [개념적 설계 v2](./entity-conceptual-design.md)
**v1 원본**: [v1/entity-logical-design.md](../v1/entity-logical-design.md)

---

## 논리적 ERD — 엔티티 관계 (카디널리티)

> 구현 시 FK·테이블명은 TypeORM 기준으로 조정 가능합니다.

```mermaid
erDiagram
    User ||--o{ HouseholdMember : "userId"
    Household ||--o{ HouseholdMember : "householdId"

    Household ||--o{ Category : "householdId"
    Household ||--o{ Unit : "householdId"
    Household ||--o{ Product : "householdId"
    Category ||--o{ Product : "categoryId"

    Household ||--o| HouseStructure : "householdId"
    HouseStructure ||--o{ Room : "houseStructureId"
    Room ||--o{ FurniturePlacement : "roomId"
    Room ||--o{ StorageLocation : "roomId"
    FurniturePlacement ||--o{ StorageLocation : "furniturePlacementId"
    Household ||--o{ StorageLocation : "householdId"
    StorageLocation }o--o| HouseStructure : "레거시: houseStructureId, roomId 문자열"
    Household ||--o{ ExpirationAlertRule : "householdId"
    Product ||--o{ ExpirationAlertRule : "productId"

    Product ||--o{ ProductVariant : "productId"
    Unit ||--o{ ProductVariant : "unitId"

    ProductVariant ||--o{ InventoryItem : "productVariantId"
    StorageLocation ||--o{ InventoryItem : "storageLocationId"

    InventoryItem ||--o{ Purchase : "inventoryItemId"
    Purchase ||--o{ PurchaseBatch : "purchaseId"
    InventoryItem ||--o{ InventoryLog : "inventoryItemId"

    Purchase }o--o| User : "userId"
    InventoryLog }o--o| User : "userId"

    Household ||--o{ ShoppingListItem : "householdId"
    Category ||--o{ ShoppingListItem : "categoryId"
    ShoppingListItem }o--o| Product : "productId"
    ShoppingListItem }o--o| ProductVariant : "productVariantId"
    ShoppingListItem }o--o| InventoryItem : "sourceInventoryItemId"

    User ||--o{ Notification : "userId"
    Notification }o--o| Household : "householdId"
    User ||--o{ NotificationPreference : "userId"
    NotificationPreference }o--o| Household : "householdId"
    User ||--o{ ExpirationAlertRule : "userId"
```

---

## 논리적 ERD — 주요 엔티티 속성 (PK·FK)

> Mermaid 블록은 **다이어그램용 속성 요약**입니다. **정본(필수/선택·비고·제약)** 은 아래 §1~§19 표를 따릅니다.

### 인증·거점

```mermaid
erDiagram
    User {
        bigint id PK
        string email UK
        string passwordHash
        string displayName
        timestamp emailVerifiedAt
        timestamp lastLoginAt
        timestamp createdAt
        timestamp updatedAt
    }
    Household {
        bigint id PK
        string name
        string kind
        timestamp createdAt
        timestamp updatedAt
    }
    HouseholdMember {
        bigint id PK
        bigint userId FK
        bigint householdId FK
        string role
        timestamp joinedAt
    }
```

### 집 구조·방·가구·보관 장소

```mermaid
erDiagram
    HouseStructure {
        bigint id PK
        bigint householdId FK
        string name
        jsonb structurePayload
        jsonb diagramLayout
        int version
        timestamp createdAt
        timestamp updatedAt
    }
    Room {
        bigint id PK
        bigint houseStructureId FK
        string structureRoomKey
        string displayName
        int sortOrder
        timestamp createdAt
        timestamp updatedAt
    }
    FurniturePlacement {
        bigint id PK
        bigint roomId FK
        string label
        bigint productId FK
        bigint productVariantId FK
        bigint anchorDirectStorageId FK
        int sortOrder
        jsonb placementPayload
        timestamp createdAt
        timestamp updatedAt
    }
    StorageLocation {
        bigint id PK
        bigint householdId FK
        string name
        bigint roomId FK
        bigint furniturePlacementId FK
        bigint houseStructureId FK
        string legacyRoomKey
        int sortOrder
        timestamp createdAt
        timestamp updatedAt
    }
```

- **HouseStructure**: `householdId`는 **Household당 1건**(unique, 1:1). **v2 추가**: `diagramLayout`(구조도 2D 좌표, jsonb).
- **Room**: `(houseStructureId, structureRoomKey)` **유일** 권장(JSON room id와 1:1 대응).
- **FurniturePlacement**: `productId`·`productVariantId`는 **선택**(가구를 마스터에 안 올린 경우 라벨만으로 운용 가능). **v2 추가**: `anchorDirectStorageId`(대표 보관 슬롯 FK, nullable).

### 카테고리·단위·상품 마스터

```mermaid
erDiagram
    Category {
        bigint id PK
        bigint householdId FK
        string name
        int sortOrder
        timestamp createdAt
        timestamp updatedAt
    }
    Unit {
        bigint id PK
        bigint householdId FK
        string symbol
        string name
        int sortOrder
    }
    Product {
        bigint id PK
        bigint householdId FK
        bigint categoryId FK
        string name
        boolean isConsumable
        string imageUrl
        string description
        timestamp createdAt
        timestamp updatedAt
    }
    ProductVariant {
        bigint id PK
        bigint productId FK
        bigint unitId FK
        decimal quantityPerUnit
        string name
        decimal price
        string sku
        boolean isDefault
        timestamp createdAt
        timestamp updatedAt
    }
```

### 재고·구매·이력

```mermaid
erDiagram
    InventoryItem {
        bigint id PK
        bigint productVariantId FK
        bigint storageLocationId FK
        decimal quantity
        decimal minStockLevel
        timestamp createdAt
        timestamp updatedAt
    }
    Purchase {
        bigint id PK
        bigint inventoryItemId FK
        decimal quantity
        decimal unitPrice
        decimal totalPrice
        timestamp purchasedAt
        string supplierName
        string itemName
        string variantCaption
        string unitSymbol
        string memo
        bigint userId FK
        timestamp createdAt
    }
    PurchaseBatch {
        bigint id PK
        bigint purchaseId FK
        decimal quantity
        date expirationDate
        timestamp createdAt
    }
    InventoryLog {
        bigint id PK
        bigint inventoryItemId FK
        string type
        decimal quantityDelta
        decimal quantityAfter
        string reason
        bigint userId FK
        string itemLabel
        string memo
        string refType
        string refId
        timestamp createdAt
    }
```

- **Purchase**: **v2 변경** — `inventoryItemId` **nullable** (구매만 먼저 기록, 재고 연결은 나중에). `supplierName` **추가** (구매처, nullable).
- **InventoryLog**: **v2 변경** — Consumption·WasteRecord 통합. `type: 'in' | 'out' | 'adjust' | 'waste'`. `reason`(폐기 사유, nullable), `itemLabel`(품목명 스냅샷, nullable) **추가**.

### 장보기

```mermaid
erDiagram
    ShoppingListItem {
        bigint id PK
        bigint householdId FK
        bigint categoryId FK
        bigint productId FK
        bigint productVariantId FK
        bigint sourceInventoryItemId FK
        bigint targetStorageLocationId FK
        decimal quantity
        int sortOrder
        string memo
        timestamp createdAt
        timestamp updatedAt
    }
```

- **v2 변경**: ShoppingList(부모) 테이블 제거. `shoppingListId FK` → `householdId FK`로 변경. `checked` 컬럼 제거 (구매 완료 시 행 삭제). `targetStorageLocationId` **추가** (넣을 칸 힌트, nullable).
- **`categoryId`**: v1에서는 필수. **v1.3에서 nullable 확정** — 현재 프론트는 항상 채우지만, 자유 텍스트 장보기 항목 확장 대비.

### 알림·만료 규칙·리포트

```mermaid
erDiagram
    Notification {
        bigint id PK
        bigint userId FK
        bigint householdId FK
        string type
        string title
        string body
        timestamp readAt
        string refType
        string refId
        timestamp createdAt
    }
    NotificationPreference {
        bigint id PK
        bigint userId FK
        bigint householdId FK
        int expirationDaysBefore
        string expirationRuleScope
        boolean notifyExpiredLots
        boolean expirationSameDayReminder
        boolean shoppingNotifyListUpdates
        boolean shoppingTripReminder
        int shoppingTripReminderWeekday
        boolean lowStockRespectMinLevel
        timestamp createdAt
        timestamp updatedAt
    }
    ExpirationAlertRule {
        bigint id PK
        bigint productId FK
        bigint userId FK
        bigint householdId FK
        int daysBefore
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }
    ReportPreset {
        bigint id PK
        bigint userId FK
        string name
        jsonb config
        int sortOrder
        timestamp createdAt
        timestamp updatedAt
    }
```

- **Notification**: **v2 추가** — `householdId FK nullable`. 프론트는 householdId 기준으로 필터. userId도 유지.
- **ExpirationAlertRule**: `productId` **필수**. `userId`와 `householdId`는 **택1**(정확히 하나만 NOT NULL). **동일 소유·동일 품목** 중복 방지는 §18.

---

## 1. User (사용자)

| 구분     | 항목                 | 타입/비고            | 검토                                       |
| -------- | -------------------- | -------------------- | ------------------------------------------ |
| **필수** | id                   | PK, UUID 또는 bigint | —                                          |
| **필수** | email                | string, unique       | —                                          |
| **필수** | passwordHash         | string (bcrypt 등)   | —                                          |
| **선택** | displayName          | string               | 닉네임/표시 이름                           |
| **선택** | emailVerifiedAt      | timestamp, nullable  | 이메일 인증 완료 시각; **NULL이면 미인증** |
| **선택** | createdAt, updatedAt | timestamp            | 감사용                                     |
| **선택** | lastLoginAt          | timestamp            | —                                          |

**관계**: Household (N:N), Notification (1:N), ExpirationAlertRule (1:N), ReportPreset (1:N), Purchase·InventoryLog (선택 `userId`)

**이메일 검증**: 가입 시 인증 메일 발송 → 토큰(또는 링크) 검증 후 `emailVerifiedAt` 설정. 토큰 저장·만료는 별도 테이블 또는 캐시로 구현 가능.

---

## 2. Household (거점)

| 구분     | 항목                 | 타입/비고        | 검토                                        |
| -------- | -------------------- | ---------------- | ------------------------------------------- |
| **필수** | id                   | PK               | —                                           |
| **필수** | name                 | string           | "우리 가족", "1인" 등 (거점 이름) |
| **v2**   | **kind**             | string, nullable | **거점 유형** (home, office, vehicle, other + 사용자 정의) |
| **선택** | createdAt, updatedAt | timestamp        | —                                           |

**관계**: User (N:N, 연관 테이블 HouseholdMember), StorageLocation (1:N), ShoppingListItem (1:N), ExpirationAlertRule (1:N, 선택)

**연관 테이블 HouseholdMember** (User–Household N:N)
| 구분 | 항목 | 비고 |
|------|------|------|
| 필수 | userId, householdId | 복합 PK 또는 PK + unique |
| 선택 | role | 'owner' \| 'member' |
| 선택 | joinedAt | timestamp |

**API DTO**: HouseholdMember는 User를 join하여 `GroupMember`(id, email, role, label?) 형태로 반환 — [frontend-backend-alignment.md §1-4](../../alignment/frontend-backend-alignment.md).

---

## 3. Category (대분류)

| 구분     | 항목                 | 타입/비고        | 검토                                                              |
| -------- | -------------------- | ---------------- | ----------------------------------------------------------------- |
| **필수** | id                   | PK               | —                                                                 |
| **v2.1** | **householdId**      | FK → Household   | **거점별 카탈로그** — 같은 거점 멤버끼리 공유                     |
| **필수** | name                 | string           | "식료품", "생활용품", "의약품", "전자제품", "식기류", "가구류" 등 |
| **선택** | sortOrder            | int              | 표시 순서                                                         |
| **선택** | createdAt, updatedAt | timestamp        | —                                                                 |

**관계**: Household (N:1), Product (1:N), ShoppingListItem (1:N) — **플랫(1단계) 카테고리만** 사용, 계층(parent) 없음.

**v2.1 변경**: `householdId FK` 추가. 카탈로그가 Household-scoped로 변경됨. "다른 거점에서 카테고리 가져오기" 기능으로 거점 간 복사 가능.

---

## 4. HouseStructure (집 구조)

| 구분     | 항목                 | 타입/비고              | 검토                          |
| -------- | -------------------- | ---------------------- | ----------------------------- |
| **필수** | id                   | PK                     | —                             |
| **필수** | householdId          | FK → Household, unique | Household당 1개               |
| **필수** | name                 | string                 | "우리 집" 등                  |
| **필수** | structurePayload     | jsonb                  | 방·슬롯 정의(rooms, slots 등) |
| **v2**   | **diagramLayout**    | jsonb, nullable        | **구조도 2D 좌표** `Record<string, {x,y}>` |
| **선택** | version              | int                    | 스키마 버전                   |
| **선택** | createdAt, updatedAt | timestamp              | —                             |

**관계**: Household (1:1), Room (1:N)

**API DTO**: Household 응답에 flat 병합하여 rooms, furniturePlacements, storageLocations, items, structureDiagramLayout 포함 — [frontend-backend-alignment.md §1-1](../../alignment/frontend-backend-alignment.md).

---

## 5. Room (방)

| 구분     | 항목                 | 타입/비고                        | 검토                                                         |
| -------- | -------------------- | -------------------------------- | ------------------------------------------------------------ |
| **필수** | id                   | PK                               | —                                                            |
| **필수** | houseStructureId     | FK → HouseStructure              | 소속 집 구조                                                 |
| **필수** | structureRoomKey     | string                           | `structurePayload` 내 room id와 **동일** (앱·3D와 동기)      |
| **선택** | displayName          | string, nullable                 | UI 표시명(JSON 라벨과 다를 때)                               |
| **선택** | sortOrder            | int                              | 방 목록 정렬                                                 |
| **선택** | createdAt, updatedAt | timestamp                        | —                                                            |

**관계**: HouseStructure (N:1), FurniturePlacement (1:N), StorageLocation (1:N, 방 직속 슬롯)

### 식별·제약 (권장)

- `(houseStructureId, structureRoomKey)` **유일**(UNIQUE) — 동일 집 구조 안에서 방 키 중복 방지.

---

## 6. FurniturePlacement (가구)

| 구분     | 항목                       | 타입/비고                            | 검토                                                                 |
| -------- | -------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| **필수** | id                         | PK                                   | —                                                                    |
| **필수** | roomId                     | FK → Room                            | 이 가구가 놓인 방                                                  |
| **필수** | label                      | string                               | "책상", "침대 옆 협탁" 등                                          |
| **선택** | productId                  | FK → Product, nullable               | 가구 **종류**를 마스터와 연결할 때                                  |
| **선택** | productVariantId           | FK → ProductVariant, nullable        | 모델·규격까지 연결할 때                                            |
| **v2**   | **anchorDirectStorageId**  | FK → StorageLocation, nullable       | **대표 보관 슬롯** (UI 앵커링용)                                   |
| **선택** | sortOrder                  | int                                  | 방 안에서 가구 나열 순서                                           |
| **선택** | placementPayload           | jsonb, nullable                      | 3D 위치·회전 등                                                    |
| **선택** | createdAt, updatedAt       | timestamp                            | —                                                                    |

**관계**: Room (N:1), Product·ProductVariant (선택 N:1), StorageLocation (1:N)

---

## 7. StorageLocation (보관 장소)

| 구분     | 항목                    | 타입/비고                     | 검토                                                                                         |
| -------- | ----------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| **필수** | id                      | PK                            | —                                                                                            |
| **필수** | householdId             | FK → Household                | —                                                                                            |
| **필수** | name                    | string                        | "책상 서랍 왼쪽", "냉장고 문쪽", "선반 2단"                                                  |
| **선택** | roomId                  | FK → Room, nullable           | **방 직속** 보관                                                                             |
| **선택** | furniturePlacementId    | FK → FurniturePlacement, nullable | **특정 가구** 위·안의 칸                                                                  |
| **선택** | houseStructureId        | FK → HouseStructure, nullable | **레거시** 마이그레이션용                                                                    |
| **선택** | legacyRoomKey           | string, nullable              | **레거시**: Room 도입 후 roomId FK로 이전 권장                                               |
| **선택** | sortOrder               | int                           | —                                                                                            |
| **선택** | createdAt, updatedAt    | timestamp                     | —                                                                                            |

**관계**: Household (N:1), Room (선택 N:1), FurniturePlacement (선택 N:1), InventoryItem (1:N)

---

## 8. Unit (단위 마스터)

| 구분     | 항목            | 타입/비고      | 검토                        |
| -------- | --------------- | -------------- | --------------------------- |
| **필수** | id              | PK             | —                           |
| **v2.1** | **householdId** | FK → Household | **거점별 카탈로그**         |
| **필수** | symbol          | string         | "ml", "g", "개", "병", "팩" |
| **선택** | name            | string         | "밀리리터", "그램"          |
| **선택** | sortOrder       | int            | —                           |

**관계**: Household (N:1), ProductVariant (N:1, 단위 참조)

**v2.1 변경**: `householdId FK` 추가. `symbol` unique 제약은 거점 내 유일(`householdId + symbol` 복합 unique) 권장.

### 식별·제약 (권장)

- `(householdId, symbol)` **유일**(UNIQUE) — 같은 거점 내 단위 기호 중복 방지.

---

## 9. Product (상품 마스터)

| 구분     | 항목                 | 타입/비고        | 검토                                                          |
| -------- | -------------------- | ---------------- | ------------------------------------------------------------- |
| **필수** | id                   | PK               | —                                                             |
| **v2.1** | **householdId**      | FK → Household   | **거점별 카탈로그** (비정규화 — 쿼리 편의)                    |
| **필수** | categoryId           | FK → Category    | —                                                             |
| **필수** | name                 | string           | 상품명                                                        |
| **필수** | isConsumable         | boolean          | true: 소비형 / false: 사용형                                  |
| **선택** | imageUrl             | string, nullable | 상품 이미지 URL                                               |
| **선택** | description          | text, nullable   | —                                                             |
| **선택** | createdAt, updatedAt | timestamp        | —                                                             |

**관계**: Household (N:1), Category (N:1), ProductVariant (1:N), ExpirationAlertRule (1:N), FurniturePlacement (선택), ShoppingListItem (선택 힌트)

**v2.1 변경**: `householdId FK` 추가. Category를 통해 간접 스코프되지만, "거점의 모든 상품 조회" 쿼리 편의를 위해 비정규화. Category.householdId와 일치해야 함 (앱 레벨 제약).

---

## 10. ProductVariant (용량/포장 단위별 정보)

| 구분     | 항목                 | 타입/비고         | 검토                                |
| -------- | -------------------- | ----------------- | ----------------------------------- |
| **필수** | id                   | PK                | —                                   |
| **필수** | productId            | FK → Product      | —                                   |
| **필수** | unitId               | FK → Unit         | —                                   |
| **필수** | quantityPerUnit      | decimal           | 1팩=6개 → 6                         |
| **선택** | name                 | string            | "500ml", "1팩(6개)"                 |
| **선택** | price                | decimal, nullable | 참고 단가                           |
| **선택** | sku                  | string, nullable  | Stock Keeping Unit                  |
| **선택** | isDefault            | boolean           | 대표 용량 여부                       |
| **선택** | createdAt, updatedAt | timestamp         | —                                   |

**관계**: Product (N:1), Unit (N:1), InventoryItem (1:N), ShoppingListItem (선택 힌트)

---

## 11. InventoryItem (실제 보유 재고)

| 구분     | 항목                 | 타입/비고            | 검토                                               |
| -------- | -------------------- | -------------------- | -------------------------------------------------- |
| **필수** | id                   | PK                   | —                                                  |
| **필수** | productVariantId     | FK → ProductVariant  | —                                                  |
| **필수** | storageLocationId    | FK → StorageLocation | —                                                  |
| **필수** | quantity             | decimal              | 현재 수량                                          |
| **선택** | minStockLevel        | decimal, nullable    | **잔량 부족 알림** 기준; NULL이면 해당 알림 미사용 |
| **선택** | createdAt, updatedAt | timestamp            | —                                                  |

**관계**: ProductVariant (N:1), StorageLocation (N:1), Purchase (1:N), InventoryLog (1:N), ShoppingListItem (선택 `sourceInventoryItemId`)

---

## 12. Purchase (구매 기록)

| 구분     | 항목                | 타입/비고                    | 검토                                      |
| -------- | ------------------- | ---------------------------- | ----------------------------------------- |
| **필수** | id                  | PK                           | —                                         |
| **v2**   | **inventoryItemId** | FK → InventoryItem, **nullable** | **v2 변경**: nullable. 구매만 먼저, 재고 연결은 나중에 |
| **필수** | quantity            | decimal                      | 구매 수량                                 |
| **필수** | unitPrice           | decimal                      | 구매 시점 단가                            |
| **필수** | totalPrice          | decimal                      | 구매 시점 총액                            |
| **선택** | purchasedAt         | timestamp                    | 구매일 (기본 now)                         |
| **v2**   | **supplierName**    | string, nullable             | **v2 추가**: 구매처 이름. 1차는 수기 입력. Supplier 테이블은 통계 기능 시 추가 예정 |
| **v2**   | **itemName**        | string, nullable             | **v2 추가**: 품목명 스냅샷. 품목 삭제 시에도 구매 내역 표시용 |
| **v2**   | **variantCaption**  | string, nullable             | **v2 추가**: 용량·변형명 스냅샷 (예: "500ml") |
| **v2**   | **unitSymbol**      | string, nullable             | **v2 추가**: 단위 기호 스냅샷 (예: "ml", "개") |
| **선택** | memo                | string, nullable             | —                                         |
| **선택** | userId              | FK → User, nullable          | 누가 구매했는지                           |
| **선택** | createdAt           | timestamp                    | —                                         |

**관계**: InventoryItem (N:1, nullable), PurchaseBatch (1:N), User (선택 N:1)

**스냅샷 정책**: `itemName`, `variantCaption`, `unitSymbol`은 구매 등록 시점의 Product/ProductVariant 정보를 복사하여 저장. 원본 품목이 삭제되어도 구매 내역에 품목명이 표시되어야 하므로 join 대신 스냅샷 방식 채택. 재고 연결된 구매(`inventoryItemId` NOT NULL)에서도 동일하게 저장.

---

## 13. PurchaseBatch (로트)

> **로트(lot)**: 한 번에 구매한 같은 품목 묶음. 같은 유통기한을 공유하는 단위.

| 구분     | 항목           | 타입/비고     | 검토         |
| -------- | -------------- | ------------- | ------------ |
| **필수** | id             | PK            | —            |
| **필수** | purchaseId     | FK → Purchase | —            |
| **필수** | quantity       | decimal       | 이 로트 수량 |
| **필수** | expirationDate | date          | 유통기한     |
| **선택** | createdAt      | timestamp     | —            |

**관계**: Purchase (N:1)

---

## 14. InventoryLog (재고 변경 이력) — v2 통합

> **v2 변경**: v1의 Consumption(§14), WasteRecord(§16), InventoryLog(§15)를 **단일 테이블로 통합**.
> 프론트 `InventoryLedgerRow` 타입과 1:1 대응. 이력 조회 쿼리가 단순해짐.

| 구분     | 항목            | 타입/비고           | 검토                                                |
| -------- | --------------- | ------------------- | --------------------------------------------------- |
| **필수** | id              | PK                  | —                                                   |
| **필수** | inventoryItemId | FK → InventoryItem  | —                                                   |
| **필수** | type            | enum                | `'in'` \| `'out'` \| `'adjust'` \| `'waste'`       |
| **필수** | quantityDelta   | decimal             | + 증가, - 감소                                      |
| **필수** | quantityAfter   | decimal             | 변경 후 수량 (스냅샷)                               |
| **v2**   | **reason**      | string, nullable    | **폐기 사유** (`expired` / `damaged` / `other` 등). type='waste' 시 사용 |
| **선택** | userId          | FK → User, nullable | 누가 변경했는지                                     |
| **v2**   | **itemLabel**   | string, nullable    | **품목명 스냅샷** (조회 편의용)                     |
| **선택** | memo            | string, nullable    | 변경 사유·메모                                      |
| **선택** | refType, refId  | string, nullable    | Purchase 등 참조 출처                               |
| **선택** | createdAt       | timestamp           | —                                                   |

**관계**: InventoryItem (N:1), User (선택 N:1)

### type별 용도 (v1 대비 매핑)

| type | v1 대응 | 설명 |
|------|---------|------|
| `in` | Purchase 생성 시 자동 기록 | 입고 (구매·수량 증가) |
| `out` | v1 Consumption | 소비·사용 (수량 감소) |
| `adjust` | 수동 수량 조정 | 수량 직접 수정 (재고 실사 등) |
| `waste` | v1 WasteRecord | 폐기 (수량 감소). `reason` 필드에 사유 기록 |

**비고**: 재고 자동 변경(배치·트리거)은 없음. 사용자가 앱에서 수행한 작업에 맞춰 명시적으로 기록.

---

## 15. ShoppingListItem (장보기 항목) — v2 변경

> **v2 변경**: ShoppingList(부모) 테이블 제거. ShoppingListItem이 Household에 직접 연결. `checked` 컬럼 제거 (구매 완료 시 행 삭제).

| 구분     | 항목                       | 타입/비고                            | 검토                                          |
| -------- | -------------------------- | ------------------------------------ | --------------------------------------------- |
| **필수** | id                         | PK                                   | —                                             |
| **v2**   | **householdId**            | FK → Household                       | **v2 변경**: ShoppingList FK 대신 Household 직접 연결 |
| **v2**   | categoryId                 | FK → Category, **nullable**          | **v2 변경**: v1 필수 → nullable. 현재 프론트는 항상 채우지만, 향후 자유 텍스트 장보기 항목 지원 대비. UI에서 categoryId 기반 필터/그룹핑 미사용 |
| **선택** | productId                  | FK → Product                         | 품목 힌트                                     |
| **선택** | productVariantId           | FK → ProductVariant                  | 용량 힌트                                     |
| **선택** | sourceInventoryItemId      | FK → InventoryItem, nullable         | 알림 출처 재고 줄                             |
| **v2**   | **targetStorageLocationId** | FK → StorageLocation, nullable      | **v2 추가**: 넣을 칸 힌트                     |
| **선택** | quantity                   | decimal                              | 사야 할 대략 수량                             |
| **선택** | sortOrder                  | int                                  | —                                             |
| **선택** | memo                       | string, nullable                     | 짧은 구분 메모                                |
| **선택** | createdAt, updatedAt       | timestamp                            | —                                             |

**관계**: Household (N:1), Category (N:1), Product·ProductVariant·InventoryItem·StorageLocation (선택 N:1)

**구매 완료 플로우**: 사용자가 "구매 완료" 시 → Purchase·InventoryItem 반영 후 **행 삭제** (v1의 `checked` 대체).

---

## 16. Notification (알림)

| 구분     | 항목               | 타입/비고               | 검토                                             |
| -------- | ------------------ | ----------------------- | ------------------------------------------------ |
| **필수** | id                 | PK                      | —                                                |
| **필수** | userId             | FK → User               | —                                                |
| **v2**   | **householdId**    | FK → Household, nullable | **v2 추가**: 프론트는 householdId 기준으로 필터  |
| **필수** | type               | enum                    | 'expiration_soon' \| 'expired' \| 'low_stock' \| 'shopping_reminder' \| 'shopping_list_update' |
| **필수** | title              | string                  | —                                                |
| **선택** | body               | text, nullable          | —                                                |
| **선택** | readAt             | timestamp, nullable     | 읽음 여부                                        |
| **선택** | refType, refId     | string, nullable        | InventoryItem, PurchaseBatch 등                  |
| **선택** | createdAt          | timestamp               | —                                                |

**관계**: User (N:1), Household (선택 N:1)

---

## 17. ExpirationAlertRule (만료 알림 설정)

| 구분          | 항목                        | 타입/비고      | 검토                                                |
| ------------- | --------------------------- | -------------- | --------------------------------------------------- |
| **필수**      | id                          | PK             | —                                                   |
| **필수**      | productId                   | FK → Product   | 품목별 며칠 전 알림                                 |
| **필수(택1)** | userId **또는** householdId | FK 점유 한쪽만 | 개인·가족 소유 구분                                 |
| **필수**      | daysBefore                  | int            | 유통기한 N일 전 알림                                |
| **선택**      | isActive                    | boolean        | 기본 true                                           |
| **선택**      | createdAt, updatedAt        | timestamp      | —                                                   |

**관계**: Product (N:1), User (N:1, 선택) 또는 Household (N:1, 선택)

### 중복 규칙 방지

- `userId`와 `householdId`는 **정확히 하나만** NOT NULL (CHECK 제약)
- `(productId, householdId)` 유일 (householdId NOT NULL 시)
- `(productId, userId)` 유일 (userId NOT NULL 시)

---

## 18. NotificationPreference (알림 설정) — v2.1 신규

> **v2.1 추가**: 사용자별·거점별 알림 상세 설정. 프론트 `NotificationDetailPreferences` 타입과 대응.

| 구분     | 항목                          | 타입/비고                    | 검토                                             |
| -------- | ----------------------------- | ---------------------------- | ------------------------------------------------ |
| **필수** | id                            | PK                           | —                                                |
| **필수** | userId                        | FK → User                    | —                                                |
| **선택** | householdId                   | FK → Household, nullable     | **null이면 사용자 기본 설정**, 값이 있으면 해당 거점 오버라이드 |
| **필수** | expirationDaysBefore          | int                          | 유통기한 N일 전 알림 (기본 3)                    |
| **필수** | expirationRuleScope           | string                       | `'household'` \| `'personal'`                    |
| **필수** | notifyExpiredLots             | boolean                      | 이미 만료된 로트 알림 여부                       |
| **필수** | expirationSameDayReminder     | boolean                      | 만료 당일 리마인더                               |
| **필수** | shoppingNotifyListUpdates     | boolean                      | 장보기 리스트 변경 알림                          |
| **필수** | shoppingTripReminder          | boolean                      | 주간 장보기 리마인더                             |
| **선택** | shoppingTripReminderWeekday   | int, nullable                | 0=일 … 6=토, null이면 요일 고정 없음            |
| **필수** | lowStockRespectMinLevel       | boolean                      | minStockLevel 설정된 재고만 부족 알림            |
| **선택** | createdAt, updatedAt          | timestamp                    | —                                                |

**관계**: User (N:1), Household (선택 N:1)

### 식별·제약 (권장)

- `(userId, householdId)` **유일**(UNIQUE) — 같은 사용자가 같은 거점에 대해 설정 중복 생성 방지.
- `householdId`가 NULL인 행은 사용자당 **최대 1건** — `(userId)` partial unique (householdId IS NULL).

### 확장 가능 방향

- **Household 단위 설정 분리**: "우리집은 3일 전, 사무실은 7일 전" — householdId로 이미 지원
- **알림 채널 확장**: `channel` 컬럼 추가 (in_app / email / push)
- **알림 유형별 세분화**: `notificationType` 컬럼으로 분리
- **시간대/조용한 시간**: `quietHoursStart`, `quietHoursEnd`, `timezone` 컬럼 추가

---

## v2 변경 요약

| 변경 유형 | 항목 | 상세 |
|-----------|------|------|
| **제거** | Consumption (v1 §14) | InventoryLog type='out'으로 통합 |
| **제거** | WasteRecord (v1 §16) | InventoryLog type='waste' + reason으로 통합 |
| **제거** | ShoppingList (v1 §17) | ShoppingListItem이 Household에 직접 연결 |
| **제거** | ShoppingListItem.checked | 구매 완료 시 행 삭제로 대체 |
| **제거** | ShoppingListItem.shoppingListId | householdId FK로 대체 |
| **추가** | Household.kind | 거점 유형 (string, nullable) |
| **추가** | HouseStructure.diagramLayout | 구조도 2D 좌표 (jsonb, nullable) |
| **추가** | FurniturePlacement.anchorDirectStorageId | 대표 보관 슬롯 FK (nullable) |
| **추가** | Purchase.supplierName | 구매처 이름 (string, nullable). 1차 수기 입력, Supplier 테이블은 통계 기능 시 추가 예정 |
| **추가** | Purchase.itemName | 품목명 스냅샷 (string, nullable). 품목 삭제 시에도 구매 내역 표시용 |
| **추가** | Purchase.variantCaption | 용량·변형명 스냅샷 (string, nullable) |
| **추가** | Purchase.unitSymbol | 단위 기호 스냅샷 (string, nullable) |
| **추가** | InventoryLog.reason | 폐기 사유 (string, nullable) |
| **추가** | InventoryLog.itemLabel | 품목명 스냅샷 (string, nullable) |
| **추가** | ShoppingListItem.householdId | Household 직접 FK |
| **추가** | ShoppingListItem.targetStorageLocationId | 넣을 칸 힌트 FK (nullable) |
| **추가** | Notification.householdId | 거점 기준 필터용 FK (nullable) |
| **변경** | Purchase.inventoryItemId | 필수 → **nullable** |
| **변경** | ShoppingListItem.categoryId | 필수 → **nullable**. 현재 프론트는 항상 채우지만, 자유 텍스트 장보기 항목 확장 대비 |
| **v2.1 추가** | Category.householdId | 거점별 카탈로그 FK |
| **v2.1 추가** | Unit.householdId | 거점별 카탈로그 FK |
| **v2.1 추가** | Product.householdId | 거점별 카탈로그 FK (비정규화) |
| **v2.1 추가** | NotificationPreference (§19) | 신규 테이블. 사용자별·거점별 알림 상세 설정 |
| **v2.1 확정** | Purchase.userId | 유지 확정 (백엔드 인증 토큰 기반 자동 기록) |

### 정합성 제약 (v2.1 — 카탈로그 Household-scoped)

카탈로그가 거점별로 분리됨에 따라, 아래 FK 참조 시 **같은 household** 소속이어야 함 (앱 레벨 제약):

| 엔티티 | FK | 같은 household 검증 대상 |
|--------|-----|------------------------|
| ShoppingListItem | categoryId, productId, productVariantId | householdId와 일치 |
| FurniturePlacement | productId, productVariantId | Room → HouseStructure → Household 경로 |
| ExpirationAlertRule | productId | householdId와 일치 |
| InventoryItem | productVariantId | StorageLocation.householdId와 일치 |

---

## 사용하지 않음 (P3 — 1차 개발 범위 외)

> 아래 엔티티는 현재 프론트엔드 UI가 없거나, 기존 기능으로 대체 가능하여 1차 개발에서 제외합니다. 필요 시 추후 추가.

### ReportPreset (리포트 설정 저장)

| 구분     | 항목                 | 타입/비고 | 검토                |
| -------- | -------------------- | --------- | ------------------- |
| **필수** | id                   | PK        | —                   |
| **필수** | userId               | FK → User | —                   |
| **필수** | name                 | string    | "지난 30일 TOP10"   |
| **선택** | config               | jsonb     | 필터, 기간, 정렬 등 |
| **선택** | sortOrder            | int       | —                   |
| **선택** | createdAt, updatedAt | timestamp | —                   |

**관계**: User (N:1)

### Tag (태그)

> 카테고리로 대체 가능. 프론트 UI 없음.

---

*본 문서는 [frontend-backend-alignment.md](../../alignment/frontend-backend-alignment.md) §1~§4 결정에 따라 v1에서 갱신되었습니다.*
