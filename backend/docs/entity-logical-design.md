# 엔티티 논리적 설계 (ERD·구현용)

**역할**: 개념적 설계를 바탕으로 **필드 단위**로 정리합니다.  
식별자(PK), 외래키(FK), 타입, 제약, 관계를 명시합니다.

**상위 문서**: [개념적 설계 — 엔티티와 속성](./entity-conceptual-design.md)

ERD를 그리면서 **추가할 것·줄일 것**을 검토하기 위한 엔티티별 필드·관계 정리입니다.

---

## 논리적 ERD — 엔티티 관계 (카디널리티)

> 구현 시 FK·테이블명은 TypeORM 기준으로 조정 가능합니다.

```mermaid
erDiagram
    User ||--o{ HouseholdMember : "userId"
    Household ||--o{ HouseholdMember : "householdId"

    Category ||--o{ Category : "parentId"
    Category ||--o{ Product : "categoryId"

    Household ||--o| HouseStructure : "householdId"
    Household ||--o{ StorageLocation : "householdId"
    StorageLocation }o--o| HouseStructure : "houseStructureId, roomId"
    Household ||--o{ ExpirationAlertRule : "householdId"
    Household ||--o{ Tag : "householdId"

    Product ||--o{ ProductVariant : "productId"
    Unit ||--o{ ProductVariant : "unitId"

    ProductVariant ||--o{ InventoryItem : "productVariantId"
    StorageLocation ||--o{ InventoryItem : "storageLocationId"

    InventoryItem ||--o{ Purchase : "inventoryItemId"
    Purchase ||--o{ PurchaseBatch : "purchaseId"
    InventoryItem ||--o{ Consumption : "inventoryItemId"
    InventoryItem ||--o{ InventoryLog : "inventoryItemId"
    InventoryItem ||--o{ WasteRecord : "inventoryItemId"

    Purchase }o--o| User : "userId"
    Consumption }o--o| User : "userId"

    ShoppingList }o--o| User : "createdBy"
    ShoppingList ||--o{ ShoppingListItem : "shoppingListId"
    ShoppingListItem }o--o| Product : "productId"
    ShoppingListItem }o--o| ProductVariant : "productVariantId"

    User ||--o{ Notification : "userId"
    User ||--o{ ExpirationAlertRule : "userId"
    User ||--o{ ReportPreset : "userId"

    Product ||--o{ ProductTag : "productId"
    Tag ||--o{ ProductTag : "tagId"
```

---

## 논리적 ERD — 주요 엔티티 속성 (PK·FK)

### 인증·가족·공유 그룹

```mermaid
erDiagram
    User {
        bigint id PK
        string email UK
        string passwordHash
        string displayName
    }
    Household {
        bigint id PK
        string name
    }
    HouseholdMember {
        bigint id PK
        bigint userId FK
        bigint householdId FK
        string role
        timestamp joinedAt
    }
```

### 마스터·재고

```mermaid
erDiagram
    Category {
        bigint id PK
        string name
        bigint parentId FK
        int sortOrder
    }
    Product {
        bigint id PK
        bigint categoryId FK
        string name
        string barcode
        boolean isConsumable
    }
    ProductVariant {
        bigint id PK
        bigint productId FK
        bigint unitId FK
        decimal quantityPerUnit
    }
    InventoryItem {
        bigint id PK
        bigint productVariantId FK
        bigint storageLocationId FK
        decimal quantity
        decimal minStockLevel
    }
    Purchase {
        bigint id PK
        bigint inventoryItemId FK
        decimal quantity
        bigint userId FK
    }
    PurchaseBatch {
        bigint id PK
        bigint purchaseId FK
        decimal quantity
        date expirationDate
    }
```

### 장보기·알림·태그

```mermaid
erDiagram
    ShoppingList {
        bigint id PK
        bigint householdId FK
        string name
        bigint createdBy FK
    }
    ShoppingListItem {
        bigint id PK
        bigint shoppingListId FK
        bigint productId FK
        bigint productVariantId FK
        boolean checked
    }
    Notification {
        bigint id PK
        bigint userId FK
        string type
        string title
        timestamp readAt
    }
    ProductTag {
        bigint productId FK
        bigint tagId FK
    }
```

- **ExpirationAlertRule**: `userId`와 `householdId`는 **둘 중 하나만** 채우는 정책(개인 vs 가족·공유 그룹 소유).
- **ShoppingListItem**: `productId`와 `productVariantId`는 정책에 따라 **하나만** 필수로 둘 수 있음.

---

## 1. User (사용자)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK, UUID 또는 bigint | — |
| **필수** | email | string, unique | — |
| **필수** | passwordHash | string (bcrypt 등) | — |
| **선택** | displayName | string | 닉네임/표시 이름 |
| **선택** | createdAt, updatedAt | timestamp | 감사용 |
| **선택** | lastLoginAt | timestamp | — |

**관계**: Household (N:N), Notification (1:N), ExpirationAlertRule (1:N), ReportPreset (1:N)

**추가 검토**: `role`(전역 역할), `avatarUrl`, `emailVerifiedAt`  
**줄일 것**: 초기에는 email + passwordHash + displayName만으로 시작 가능

---

## 2. Household (가족/공유 그룹)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | name | string | "우리 가족", "1인" 등 (가족·공유 그룹 이름) |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: User (N:N, 연관 테이블 HouseholdMember), StorageLocation (1:N), ShoppingList (1:N), ExpirationAlertRule (1:N, 선택)

**연관 테이블 HouseholdMember** (User–Household N:N)  
| 구분 | 항목 | 비고 |
|------|------|------|
| 필수 | userId, householdId | 복합 PK 또는 PK + unique |
| 선택 | role | 'owner' \| 'member' |
| 선택 | joinedAt | timestamp |

**추가 검토**: `currency`(통화), `timezone`, `maxMembers`

---

## 3. Category (대분류)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | name | string | "식료품", "생활용품", "의약품", "전자제품", "식기류", "가구류" 등 |
| **선택** | parentId | FK → Category, nullable | 계층형(부모-자식) |
| **선택** | sortOrder | int | 표시 순서 |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: Product (1:N), Category (자기참조 1:N, 선택)

**추가 검토**: `icon`, `color`, `description`  
**줄일 것**: 계층 없이 플랫한 1단계만 써도 됨 → `parentId`는 나중에

---

## 4. HouseStructure (집 구조)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | householdId | FK → Household, unique | Household당 1개 |
| **필수** | name | string | "우리 집" 등 |
| **필수** | structurePayload | jsonb | 방·슬롯 정의(rooms, slots 등) |
| **선택** | version | int | 스키마 버전 |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: Household (1:1), StorageLocation(선택: roomId로 방 연결)

→ API·스키마 상세: [house-structure-3d-feature.md](./house-structure-3d-feature.md)

---

## 5. StorageLocation (보관 장소)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | householdId | FK → Household | — |
| **필수** | name | string | "냉장고 문쪽", "선반 2단", "욕실장" |
| **선택** | houseStructureId | FK → HouseStructure, nullable | 집 구조 내 방과 연결 시 |
| **선택** | roomId | string, nullable | structurePayload 내 room id |
| **선택** | sortOrder | int | — |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: Household (N:1), HouseStructure (선택 N:1), InventoryItem (1:N)

**추가 검토**: `type`(냉장/냉동/실온), `description`  
**줄일 것**: name만으로 충분

---

## 6. Unit (단위 마스터)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | symbol | string, unique | "ml", "g", "개", "병", "팩" |
| **선택** | name | string | "밀리리터", "그램" |
| **선택** | sortOrder | int | — |

**관계**: ProductVariant (N:1, 단위 참조)

**추가 검토**: `baseUnitId` + `conversionFactor` (단위 환산용)  
**줄일 것**: symbol(+ name)만으로 시작 가능

---

## 7. Product (상품 마스터)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | categoryId | FK → Category | — |
| **필수** | name | string | "계란", "삼겹살", "샴푸", "노트북", "침대", "책상" 등 (소모품·비소모품) |
| **선택** | barcode | string, nullable, unique | — |
| **선택** | description | text, nullable | — |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: Category (N:1), ProductVariant (1:N), Tag (N:N, 선택), ShoppingListItem (참조 가능)

**추가 검토**: `brandId`, `defaultUnitId`, `imageUrl`, `isConsumable`(소모품 여부 — 전자제품·식기류·가구는 비소모품)  
**줄일 것**: description은 선택

---

## 8. ProductVariant (용량/포장 단위별 정보)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | productId | FK → Product | — |
| **필수** | unitId | FK → Unit | — |
| **필수** | quantityPerUnit | decimal | 1팩=6개 → 6, 1병=500ml → 500 |
| **선택** | name | string | "500ml", "1팩(6개)" (표시용) |
| **선택** | sku | string, nullable | — |
| **선택** | isDefault | boolean | 대표 용량 여부 |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: Product (N:1), Unit (N:1), InventoryItem (1:N), ShoppingListItem (참조 가능)

**추가 검토**: `price`(참고 단가), `barcode`(variant별)  
**줄일 것**: sku, isDefault 없이 quantityPerUnit + unitId만으로도 가능

---

## 9. InventoryItem (실제 보유 재고)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | productVariantId | FK → ProductVariant | — |
| **필수** | storageLocationId | FK → StorageLocation | — |
| **필수** | quantity | decimal | 현재 수량 |
| **선택** | minStockLevel | decimal, nullable | 잔량 부족 알림 기준 |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: ProductVariant (N:1), StorageLocation (N:1), Purchase (1:N), Consumption (1:N), InventoryLog (1:N), WasteRecord (1:N)

**추가 검토**: `householdId`(조회 편의용 중복), `unitId`(variant에서 가져올 수 있음)  
**줄일 것**: minStockLevel은 잔량 부족 알림 구현 시 사용

---

## 10. Purchase (구매 기록)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | inventoryItemId | FK → InventoryItem | — |
| **필수** | quantity | decimal | 구매 수량 |
| **선택** | purchasedAt | timestamp | 구매일 (기본 now) |
| **선택** | unitPrice | decimal, nullable | 단가 (단가 변동 분석용) |
| **선택** | totalPrice | decimal, nullable | — |
| **선택** | memo | string, nullable | — |
| **선택** | createdAt | timestamp | — |

**관계**: InventoryItem (N:1), PurchaseBatch (1:N)

**추가 검토**: `storeName`, `paymentMethod`, `userId`(구매 수행자)  
**줄일 것**: unitPrice/totalPrice 없이 수량만으로도 가능

---

## 11. PurchaseBatch (유통기한 로트)

> **로트(lot)**: 한 번에 구매한 같은 품목 묶음. 같은 유통기한을 공유하는 단위.  
> 예: 우유 2팩을 3월 1일에 구매하고 유통기한이 3월 10일이면, 그 2팩이 한 로트.

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | purchaseId | FK → Purchase | — |
| **필수** | quantity | decimal | 이 로트 수량 |
| **필수** | expirationDate | date | 유통기한 |
| **선택** | createdAt | timestamp | — |

**관계**: Purchase (N:1)

**추가 검토**: `batchCode`(제조로트 등)  
**줄일 것**: quantity + expirationDate만 있으면 됨

---

## 12. Consumption (소비/사용 기록)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | inventoryItemId | FK → InventoryItem | — |
| **필수** | quantity | decimal | 소비 수량 |
| **선택** | consumedAt | timestamp | 사용일 (기본 now) |
| **선택** | memo | string, nullable | — |
| **선택** | createdAt | timestamp | — |

**관계**: InventoryItem (N:1)

**추가 검토**: `recipeId`, `userId`(누가 사용했는지)  
**줄일 것**: quantity + consumedAt만으로도 가능

---

## 13. InventoryLog (재고 변경 이력)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | inventoryItemId | FK → InventoryItem | — |
| **필수** | type | enum | 'in' \| 'out' \| 'adjust' \| 'waste' |
| **필수** | quantityDelta | decimal | + 증가, - 감소 |
| **필수** | quantityAfter | decimal | 변경 후 수량 (스냅샷) |
| **선택** | refType, refId | string, nullable | Purchase/Consumption/WasteRecord 등 참조 |
| **선택** | createdAt | timestamp | — |

**관계**: InventoryItem (N:1)

**추가 검토**: `userId`, `memo`  
**줄일 것**: refType/refId 없이 type + quantityDelta만으로도 추적 가능 (나중에 보강)

---

## 14. WasteRecord (폐기 기록)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | inventoryItemId | FK → InventoryItem | — |
| **필수** | quantity | decimal | 폐기 수량 |
| **선택** | reason | enum/string | 'expired' \| 'damaged' \| 'other' |
| **선택** | wastedAt | timestamp | — |
| **선택** | memo | string, nullable | — |
| **선택** | createdAt | timestamp | — |

**관계**: InventoryItem (N:1)

**추가 검토**: `userId`  
**줄일 것**: reason을 free text로 해도 됨

---

## 15. ShoppingList (장보기 리스트)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | householdId | FK → Household | — |
| **필수** | name | string | "이번 주 장보기", "주말 마트" |
| **선택** | status | enum | 'draft' \| 'active' \| 'done' |
| **선택** | dueDate | date, nullable | — |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: Household (N:1), ShoppingListItem (1:N)

**추가 검토**: `createdBy`(userId)  
**줄일 것**: status 없이 단일 "현재 리스트"만 써도 됨

---

## 16. ShoppingListItem (리스트 항목)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | shoppingListId | FK → ShoppingList | — |
| **필수(택1)** | productId **또는** productVariantId | FK | 정책 확정 필요 |
| **선택** | quantity | decimal | 1 이상 |
| **선택** | sortOrder | int | — |
| **선택** | checked | boolean | 체크 여부 |
| **선택** | memo | string, nullable | — |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: ShoppingList (N:1), Product 또는 ProductVariant (N:1, 택1)

**추가 검토**: productId만 쓰고 수량/단위는 텍스트(memo)로 → 구조 단순화  
**줄일 것**: Product만 참조하고 "수량/단위"는 memo로 처리하면 ProductVariant 불필요

---

## 17. Notification (알림)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | userId | FK → User | — |
| **필수** | type | enum | 'expiration_soon' \| 'low_stock' \| 'expired' 등 |
| **필수** | title | string | — |
| **선택** | body | text, nullable | — |
| **선택** | readAt | timestamp, nullable | 읽음 여부 |
| **선택** | refType, refId | string, nullable | InventoryItem, PurchaseBatch 등 |
| **선택** | createdAt | timestamp | — |

**관계**: User (N:1)

**추가 검토**: `channel`(push/email/in-app)  
**줄일 것**: type + title + readAt만으로도 가능

---

## 18. ExpirationAlertRule (만료 알림 설정)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수(택1)** | userId **또는** householdId | FK | 개인/가족·공유 그룹 단위 |
| **필수** | daysBefore | int | 유통기한 N일 전 알림 |
| **선택** | isActive | boolean | 기본 true |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: User (N:1) 또는 Household (N:1)

**추가 검토**: 카테고리별/품목별 다른 일수  
**줄일 것**: 전역 1개 규칙(예: 3일 전)만 있어도 됨

---

## 19. Tag (태그)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | name | string | "유기농", "저염", "매운맛" |
| **선택** | createdAt | timestamp | — |

**관계**: Product (N:N, 중간테이블 ProductTag)

**추가 검토**: `color`, `householdId`(가족·공유 그룹별 태그)  
**줄일 것**: Tag는 필요 시 추가 (우선순위 낮음)

---

## 20. ReportPreset (리포트 설정 저장)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | id | PK | — |
| **필수** | userId | FK → User | — |
| **필수** | name | string | "지난 30일 TOP10" |
| **선택** | config | jsonb | 필터, 기간, 정렬 등 |
| **선택** | sortOrder | int | — |
| **선택** | createdAt, updatedAt | timestamp | — |

**관계**: User (N:1)

**추가 검토**: config 스키마 버전 관리  
**줄일 것**: 필요 시 추가 (우선순위 낮음)

---

## 21. ProductTag (상품–태그 연결, N:N 중간)

| 구분 | 항목 | 타입/비고 | 검토 |
|------|------|-----------|------|
| **필수** | productId | FK → Product | 복합 PK 또는 PK + unique |
| **필수** | tagId | FK → Tag | — |

**관계**: Product (N:1), Tag (N:1)

---

## 요약: ERD 그릴 때 체크 포인트

| 구분 | 내용 |
|------|------|
| **추가 검토** | HouseholdMember 역할(owner/member), Purchase/Consumption의 userId, ShoppingListItem의 Product vs ProductVariant 정책, Category 계층(parentId), Notification refType/refId, ExpirationAlertRule 소유 주체(User vs Household) |
| **줄이기/미루기** | Tag·ReportPreset·ExpirationAlertRule 단순화, barcode/sku 등은 선택 |
| **정책 결정** | ShoppingListItem은 Product만 참조할지 ProductVariant까지 쓸지, ExpirationAlertRule은 User vs Household 중 어디에 둘지 |

**기타 추가 예정(참고)**: [policy/considerations.md](./policy/considerations.md) — Recipe, Brand, Supplier, Photo, Integration, AuditLog 등. 필요 시 순차 반영. (가계부·구독·예산은 본 프로젝트 범위 외, 별도 프로젝트 권장.)

이 문서를 ERD 옆에 두고, 엔티티별로 "지금 넣을 필드"와 "나중에 넣을 필드"를 구분해 가며 그리면 됩니다.
