# ER 다이어그램 & 엔티티 명세 v2 (Home Inventory Manager)

**버전**: v2.6 — UserDeviceToken 신규 엔티티 추가 (2026-04-02)

**v2.6 변경**:
- UserDeviceToken 신규 엔티티 추가 (FCM 푸시 알림용 기기 토큰 관리)

**v2.5 변경**:
- 모든 엔티티 PK를 UUID로 확정
- `Purchase.quantity`, `Purchase.totalPrice` 제거 (파생값)
- `InventoryLog.householdId` 비정규화 불요 확정

**v2.4 변경**:
- NotificationPreference에 마스터 토글 3컬럼 추가 (`notifyExpiration`, `notifyShopping`, `notifyLowStock`)
- 장보기 완료 트랜잭션 API 스펙 정의 (`POST /api/shopping-list-items/:id/complete`)

**v2.3 변경**:
- HouseholdKindDefinition 신규 엔티티 추가 (사용자별 거점 유형 라벨·순서 관리)

**v2.2 변경**:
- HouseholdInvitation 신규 엔티티 추가 (초대 링크·이메일 초대 플로우)
- HouseholdMember.role을 `'admin' | 'editor' | 'viewer'` 3단계로 확장

**v2.1 변경**:
- Category, Unit, Product에 `householdId` 추가 (카탈로그 Household-scoped)
- NotificationPreference 엔티티 추가
- Purchase.userId 유지 확정

**v2 변경**:
- Consumption, WasteRecord 엔티티 제거 → InventoryLog로 통합
- ShoppingList 엔티티 제거 → ShoppingListItem이 Household에 직접 연결
- Household에 `kind` 속성 추가
- HouseStructure에 `diagramLayout` 속성 추가
- FurniturePlacement에 `anchorDirectStorageId` 추가
- Purchase.inventoryItemId nullable, supplierName 추가, 스냅샷 3컬럼 추가
- ShoppingListItem에 `targetStorageLocationId` 추가
- Notification에 `householdId` 추가
- 변경 근거: [frontend-backend-alignment.md](../../alignment/frontend-backend-alignment.md) §1~§4 참조

**v1 원본**: [v1/er-diagram.md](../v1/er-diagram.md)
상세 필드는 [엔티티 논리적 설계 v2](./entity-logical-design.md), 개념만 보려면 [개념적 설계 v2](./entity-conceptual-design.md)를 참고하세요.

---

## 1. 엔티티 목록

| 순번 | 엔티티              | 핵심 역할                                                                  | 주요 관계                            | 우선순위 | v2 변경 |
| ---- | ------------------- | -------------------------------------------------------------------------- | ------------------------------------ | -------- | ------- |
| 1    | User                | 사용자 계정                                                                | — (Household과 N:N)                  | P0       | — |
| 2    | Household           | 거점                                                             | User ↔ ManyToMany                    | P0       | `kind` 추가 |
| 3    | Category            | 대분류 (식료품, 생활용품, 의약품 등) — 플랫(1단계)                         | **Household**, Product               | P0       | `householdId` 추가 **(v2.1)** |
| 4    | StorageLocation     | 보관 슬롯(방·가구 아래 최종 칸)                                            | Household, Room·FurniturePlacement   | P0       | — |
| 5    | Unit                | 단위 마스터 (ml, g, 개…)                                                   | **Household**                        | P1       | `householdId` 추가 **(v2.1)** |
| 6    | Product             | 상품 마스터 (소모품·비소모품)                                              | **Household**, Category              | P0       | `householdId` 추가 **(v2.1)** |
| 7    | ProductVariant      | 용량/포장 단위별 정보                                                      | Product                              | P0       | — |
| 8    | InventoryItem       | 실제 보유 재고                                                       | ProductVariant, StorageLocation      | P0       | — |
| 9    | Purchase            | 구매 기록                                                                  | **Household**, InventoryItem (nullable) | P0       | `householdId` 추가 **(v2.2)**, `inventoryItemId` nullable, `supplierName` 추가, 스냅샷 3컬럼 추가, `quantity`·`totalPrice` 제거 **(v2.5)** |
| 10   | PurchaseBatch       | 로트별 유통기한                                                            | Purchase                             | P0       | — |
| 11   | InventoryLog        | 재고 변경 이력 (**소비·폐기 통합**)                                        | InventoryItem                        | P0       | **Consumption·WasteRecord 통합**, `reason`·`itemLabel` 추가 |
| 12   | ShoppingListItem    | 장보기 항목 (**Household 직접 연결**)                                      | Household, Category (nullable)       | P1       | **ShoppingList 제거**, `householdId` FK, `targetStorageLocationId` 추가, `categoryId` nullable |
| 13   | Notification        | 알림                                                                       | User, Household                      | P1       | `householdId` 추가 |
| 14   | ExpirationAlertRule | 만료 알림 설정(품목별 일수)                                                | User 또는 Household, Product         | P1       | — |
| 19   | NotificationPreference | 알림 상세 설정(사용자별·거점별)                                         | User, Household (nullable)           | P1       | **신규 (v2.1)** |
| 16   | HouseStructure      | 집 구조 — 방·슬롯 정의(JSONB)                                              | Household 1:1                        | P1       | `diagramLayout` 추가 |
| 17   | Room                | 집 구조 내 방                                                              | HouseStructure                       | P1       | — |
| 18   | FurniturePlacement  | 방 안 가구(인스턴스)                                                  | Room                                 | P1       | `anchorDirectStorageId` 추가 |
| 20   | HouseholdInvitation | 거점 초대 (링크·이메일)                                               | Household, User                      | P1       | **신규 (v2.2)** |
| 21   | HouseholdKindDefinition | 거점 유형 정의 (사용자별 라벨·순서)                               | User                                 | P1       | **신규 (v2.3)** |
| 22   | UserDeviceToken     | FCM 기기 토큰 (푸시 알림용)                                            | User                                 | P1       | **신규 (v2.6)** |

### 사용하지 않음 (P3 — 1차 개발 범위 외)

| 순번 | 엔티티              | 핵심 역할                                                                  | 주요 관계                            | 우선순위 | 비고 |
| ---- | ------------------- | -------------------------------------------------------------------------- | ------------------------------------ | -------- | ------- |
| 15   | ReportPreset        | 리포트 설정 저장                                                           | User                                 | P3       | 프론트 UI 없음. 필요 시 추후 추가 |
| —    | Tag                 | 상품 태그                                                                  | Product                              | P3       | 카테고리로 대체 가능. 프론트 UI 없음 |

### v2에서 제거된 엔티티

| 엔티티 | 사유 | 대체 |
|--------|------|------|
| ~~Consumption~~ | InventoryLog(type='out')로 통합 | InventoryLog §14 |
| ~~WasteRecord~~ | InventoryLog(type='waste' + reason)로 통합 | InventoryLog §14 |
| ~~ShoppingList~~ | 프론트에 부모 리스트 개념 없음. ShoppingListItem이 Household에 직접 연결 | ShoppingListItem §15 |

### User ↔ Household (다대다)

- 중간 테이블 `HouseholdMember`로 멤버십·역할(admin/editor/viewer) 관리. **(v2.2: 3단계로 확장)**
- `HouseholdInvitation`으로 초대 링크·이메일 초대 관리. **(v2.2 신규)**

---

## 2. 관계 요약 (텍스트)

```
Household (거점)
  ├── HouseStructure (1:1, 선택) — 집 구조(방·슬롯 JSON + diagramLayout)
  │     └── Room (1:N) — 방 엔티티(structureRoomKey ↔ JSON)
  │           ├── FurniturePlacement (1:N) — 가구(인스턴스, anchorDirectStorageId)
  │           │     └── StorageLocation (1:N) — 그 가구 위·안 보관 슬롯
  │           └── StorageLocation (1:N) — 방 직속 슬롯(냉장고 등)
  ├── StorageLocation (1:N) — 구조 미연동·레거시 장소도 가능
  ├── Category (1:N) — 거점 카탈로그 (v2.1)
  ├── Unit (1:N) — 거점 카탈로그 (v2.1)
  ├── Product (1:N) — 거점 카탈로그 (v2.1)
  ├── ShoppingListItem (1:N) — 장보기 항목 (v2: Household 직접 연결)
  ├── HouseholdInvitation (1:N) — 초대 (v2.2)
  └── ExpirationAlertRule (1:N, 선택)

User
  ├── Household (N:N)
  ├── HouseholdInvitation (1:N) — 초대한 초대 (v2.2)
  ├── HouseholdKindDefinition (1:N) — 거점 유형 정의 (v2.3)
  ├── UserDeviceToken (1:N) — FCM 기기 토큰 (v2.6)
  ├── Notification (1:N)
  ├── NotificationPreference (1:N) — 알림 설정 (v2.1, 거점별 오버라이드 가능)
  └── ExpirationAlertRule (1:N, 선택, 품목별)

Category (v2.1: Household-scoped)
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
  ├── Purchase (1:N) — v2: nullable FK
  ├── InventoryLog (1:N) — v2: 소비·폐기 통합
  └── ShoppingListItem (선택: 알림 출처 ref)

Purchase
  ├── Household (N:1) — v2.2 추가
  └── PurchaseBatch (1:N)
```

---

## 3. Mermaid ER 다이어그램 (개념도)

```mermaid
erDiagram
    User }o--o{ Household : "members (N:N)"
    Household ||--o{ HouseholdInvitation : "invitations"
    User ||--o{ HouseholdInvitation : "invitedBy"
    User ||--o{ HouseholdKindDefinition : "kind definitions"

    Household ||--o{ Category : "catalog"
    Household ||--o{ Unit : "catalog"
    Household ||--o{ Product : "catalog"
    Household ||--o| HouseStructure : "optional 1:1"
    HouseStructure ||--o{ Room : rooms
    Room ||--o{ FurniturePlacement : placements
    FurniturePlacement ||--o{ StorageLocation : slots_on_furniture
    Room ||--o{ StorageLocation : slots_in_room
    Household ||--o{ StorageLocation : has
    Household ||--o{ ShoppingListItem : has
    Household ||--o{ ExpirationAlertRule : "optional"

    User ||--o{ UserDeviceToken : "device tokens"
    User ||--o{ Notification : receives
    Notification }o--o| Household : "optional householdId"
    User ||--o{ NotificationPreference : "settings"
    NotificationPreference }o--o| Household : "optional override"
    User ||--o{ ExpirationAlertRule : "optional"

    Category ||--o{ Product : classifies

    Unit ||--o{ ProductVariant : unit
    Product ||--o{ ProductVariant : variants
    Product ||--o{ ExpirationAlertRule : "per product"
    ProductVariant ||--o{ InventoryItem : stocked_as
    StorageLocation ||--o{ InventoryItem : stores
    FurniturePlacement }o--o| Product : "optional kind"
    FurniturePlacement }o--o| ProductVariant : "optional variant"

    Household ||--o{ Purchase : "purchases"
    InventoryItem ||--o{ Purchase : "purchases (nullable FK)"
    Purchase ||--o{ PurchaseBatch : batches
    InventoryItem ||--o{ InventoryLog : logs

    Category ||--o{ ShoppingListItem : "category hint"
    ShoppingListItem }o--o| Product : "hint optional"
    ShoppingListItem }o--o| ProductVariant : "hint optional"
    ShoppingListItem }o--o| InventoryItem : "from alert optional"
```

---

## 4. 유지보수

- 엔티티 추가·변경 시 **이 파일**과 [논리적 설계 v2](./entity-logical-design.md)를 함께 수정합니다.
- v1 원본은 [v1/](../v1/) 폴더에 보존되어 있습니다.

---

*본 문서는 [frontend-backend-alignment.md](../../alignment/frontend-backend-alignment.md) §1~§4 결정에 따라 v1에서 갱신되었습니다.*
