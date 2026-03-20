# ER 다이어그램 & 엔티티 명세 (Home Inventory Manager)

구현 대상 엔티티 목록과 관계를 정리한 문서입니다.  
[backend/README.md](../backend/README.md) **「4. 도메인 & 엔티티 설계」** 표와 동기화해 두었습니다.  
상세 필드는 [엔티티 논리적 설계](./entity-logical-design.md), 개념만 보려면 [개념적 설계](./entity-conceptual-design.md)를 참고하세요.

---

## 1. 엔티티 목록

| 순번 | 엔티티              | 핵심 역할                                                                  | 주요 관계                            | 우선순위 |
| ---- | ------------------- | -------------------------------------------------------------------------- | ------------------------------------ | -------- |
| 1    | User                | 사용자 계정                                                                | — (Household과 N:N)                  | ★★★★★    |
| 2    | Household           | 가족·공유 그룹                                                             | User ↔ ManyToMany                    | ★★★★     |
| 3    | Category            | 대분류 (식료품, 생활용품, 의약품, 전자제품, 식기류, 가구류…) — 플랫(1단계) | —                                    | ★★★★★    |
| 4    | StorageLocation     | 보관 슬롯(방·가구 아래 최종 칸)                                            | Household, Room·FurniturePlacement(선택) | ★★★★     |
| 5    | Unit                | 단위 마스터 (ml, g, 개…)                                                   | —                                    | ★★★      |
| 6    | Product             | 상품 마스터 (소모품·비소모품: 식료품, 전자제품, 가구 등)                   | Category                             | ★★★★★    |
| 7    | ProductVariant      | 용량/포장 단위별 정보                                                      | Product                              | ★★★★     |
| 8    | InventoryItem       | 실제 보유 재고(물품)                                                       | ProductVariant, StorageLocation(→방·가구 간접) | ★★★★★    |
| 9    | Purchase            | 구매 기록                                                                  | InventoryItem                        | ★★★★     |
| 10   | PurchaseBatch       | 로트별 유통기한 (로트=한 번에 구매한 같은 품목·같은 유통기한 묶음)         | Purchase                             | ★★★★     |
| 11   | Consumption         | 소비/사용 기록                                                             | InventoryItem                        | ★★★★     |
| 12   | InventoryLog        | 재고 변경 이력                                                             | InventoryItem                        | ★★★      |
| 13   | WasteRecord         | 폐기 기록                                                                  | InventoryItem                        | ★★★      |
| 14   | ShoppingList        | 장보기 리스트                                                              | Household                            | ★★★★     |
| 15   | ShoppingListItem    | 리스트 항목                                                                | ShoppingList, Product/ProductVariant | ★★★★     |
| 16   | Notification        | 알림                                                                       | User                                 | ★★★★     |
| 17   | ExpirationAlertRule | 만료 알림 설정(품목별 일수)                                                | User 또는 Household, Product         | ★★★      |
| 18   | ReportPreset        | 리포트 설정 저장                                                           | User                                 | ★★       |
| 19   | HouseStructure      | 집 구조(2D/3D) 한 채 — 방·슬롯 정의(JSONB)                                 | Household 1:1                        | ★★★      |
| 20   | Room                | 집 구조 내 **방**(JSON room id와 FK로 동기)                                | HouseStructure                       | ★★★      |
| 21   | FurniturePlacement  | 방 안 **가구 배치**(인스턴스; 종류는 선택적으로 Product)                   | Room, (선택) Product/ProductVariant  | ★★★      |

### User ↔ Household (다대다)

- 중간 테이블(예: `HouseholdMember`, `UserHousehold`)로 가족/공유 그룹 멤버십·역할(소유자/멤버) 관리 권장.

### ShoppingListItem

- `Product`만 참조하거나 `ProductVariant`만 참조하거나, 둘 중 하나 필수 등 정책을 스키마 단계에서 결정.

---

## 2. 관계 요약 (텍스트)

```
Household (가족·공유 그룹)
  ├── HouseStructure (1:1, 선택) — 집 구조(방·슬롯 JSON)
  │     └── Room (1:N) — 방 엔티티(structureRoomKey ↔ JSON)
  │           ├── FurniturePlacement (1:N) — 가구 배치(인스턴스)
  │           │     └── StorageLocation (1:N) — 그 가구 위·안 보관 슬롯
  │           └── StorageLocation (1:N) — 방 직속 슬롯(냉장고 등)
  ├── StorageLocation (1:N) — 구조 미연동·레거시 장소도 가능
  ├── ShoppingList (1:N)
  └── ExpirationAlertRule (1:N, 선택)

User
  ├── Household (N:N)
  ├── Notification (1:N)
  ├── ExpirationAlertRule (1:N, 선택, 품목별)
  └── ReportPreset (1:N)

Category
  ├── Product (1:N)  ※ 플랫 카테고리(계층 없음)
  └── ShoppingListItem (1:N, 장보기 줄 분류 기준)

Product
  ├── ProductVariant (1:N)
  ├── ExpirationAlertRule (1:N, 선택, 품목별 일수)
  └── ShoppingListItem (선택 힌트)

ProductVariant
  ├── InventoryItem (1:N)
  └── ShoppingListItem (선택 힌트)

InventoryItem
  ├── Purchase (1:N)
  ├── Consumption (1:N)
  ├── InventoryLog (1:N)
  ├── WasteRecord (1:N)
  └── ShoppingListItem (선택: 알림 출처 ref)

Purchase
  └── PurchaseBatch (1:N)

ShoppingList
  └── ShoppingListItem (1:N)
```

---

## 3. Mermaid ER 다이어그램 (개념도)

> 실제 FK·컬럼명은 구현 시 TypeORM 엔티티 기준으로 조정하세요.

```mermaid
erDiagram
    User }o--o{ Household : "members (N:N)"

    Household ||--o| HouseStructure : "optional 1:1"
    HouseStructure ||--o{ Room : rooms
    Room ||--o{ FurniturePlacement : placements
    FurniturePlacement ||--o{ StorageLocation : slots_on_furniture
    Room ||--o{ StorageLocation : slots_in_room
    Household ||--o{ StorageLocation : has
    Household ||--o{ ShoppingList : has
    Household ||--o{ ExpirationAlertRule : "optional"

    User ||--o{ Notification : receives
    User ||--o{ ExpirationAlertRule : "optional"
    User ||--o{ ReportPreset : saves

    Category ||--o{ Product : classifies

    Unit ||--o{ ProductVariant : unit
    Product ||--o{ ProductVariant : variants
    Product ||--o{ ExpirationAlertRule : "per product"
    ProductVariant ||--o{ InventoryItem : stocked_as
    StorageLocation ||--o{ InventoryItem : stores
    StorageLocation }o--o| HouseStructure : "legacy optional"
    FurniturePlacement }o--o| Product : "optional kind"
    FurniturePlacement }o--o| ProductVariant : "optional variant"

    InventoryItem ||--o{ Purchase : purchases
    Purchase ||--o{ PurchaseBatch : batches
    InventoryItem ||--o{ Consumption : consumed
    InventoryItem ||--o{ InventoryLog : logs
    InventoryItem ||--o{ WasteRecord : wasted

    Category ||--o{ ShoppingListItem : "category required"
    ShoppingList ||--o{ ShoppingListItem : lines
    ShoppingListItem }o--o| Product : "hint optional"
    ShoppingListItem }o--o| ProductVariant : "hint optional"
    ShoppingListItem }o--o| InventoryItem : "from alert optional"
```

- **Category**는 플랫(1단계)만 사용; `parentId`·계층 없음. **ShoppingListItem**은 카테고리를 필수로 두고, 품목/변형/재고 출처는 알림·UX에 따라 선택.
- **ExpirationAlertRule**은 품목(Product)마다 유통기한 **며칠 전** 알림 일수를 다르게 둘 수 있음.
- **HouseStructure**: 상세는 [집 구조도 백엔드 명세](./house-structure-3d-feature.md) 참고. **방**은 `Room` 엔티티로 정규화하고, **가구 배치**는 `FurniturePlacement`, 물품(재고)은 기존처럼 `StorageLocation` → `InventoryItem`으로 연결한다([논리 설계](./entity-logical-design.md) §5~§7, §11).

---

## 4. 유지보수

- 엔티티 추가·변경 시 **이 파일**과 [backend/README.md](../backend/README.md) **「4. 도메인 & 엔티티 설계」** 표를 함께 수정하는 것을 권장합니다.
- 상세 ERD(draw.io 등)는 저장소 루트 `docs/` 또는 `backend/drawio/` 등에 두면 됩니다.
