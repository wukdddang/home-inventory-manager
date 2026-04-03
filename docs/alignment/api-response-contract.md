# API 응답 계약서 (API Response Contract)

**목적**: 백엔드 API 응답값과 프론트엔드 화면 렌더링에 필요한 데이터 형태를 대조하여, 응답 최적화 여부를 점진적으로 검증·갱신하는 문서.

**현재 버전**: **v1.1** (2026-04-03)

| 버전 | 날짜 | 요약 |
|------|------|------|
| v1.0 | 2026-04-03 | 초안 작성. 19개 도메인별 API 응답 계약 정의, 불일치 7건 식별 |
| v1.1 | 2026-04-03 | aggregate 엔드포인트 3개 추가 (dashboard-view, inventory-logs, purchases-full). G-1, G-2, G-4, G-5 해소 |

**참조 문서**:
- [프론트엔드-백엔드 정합성 정리](./frontend-backend-alignment.md)
- [프론트엔드 도메인 타입](../../frontend/types/domain.ts)
- [API 엔드포인트 정의](../../frontend/app/api/_backend/api-endpoints.ts)
- [대시보드 API 서비스](../../frontend/app/(current)/dashboard/_context/dashboard-api.service.ts)

**상태 기호**:
- ✅ 일치 — 백엔드 응답이 프론트 렌더링에 최적화됨
- ⚠️ 변환 필요 — 프론트엔드 어댑터 레이어에서 변환 중 (동작하지만 비최적)
- ❌ 불일치 — 백엔드 응답이 프론트 요구와 맞지 않아 개선 필요

---

## 아키텍처 개요: 데이터 흐름

```
NestJS Backend          Next.js API Routes (Proxy)       Frontend Service         UI Component
─────────────          ─────────────────────────         ─────────────────        ────────────
raw entity data   →    { success, data } 래핑     →     클라이언트 사이드 변환  →  렌더링
(TypeORM entity)       (frontend/app/api/)               (dashboard-api.service)  (React)
```

- 백엔드는 **TypeORM 엔티티를 직접 직렬화**하여 반환 (전역 응답 래퍼 없음)
- Next.js API Routes가 `{ success: boolean, data: T }` 형태로 래핑
- 프론트 서비스 레이어(`dashboard-api.service.ts`)에서 **클라이언트 사이드 조인** 수행

---

## 1. 인증 (Auth)

### `POST /auth/signup`, `POST /auth/login`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 | 프론트 기대 (`TokenResponse`) | 일치 |
|------|------------|-------------------------------|------|
| `accessToken` | `string` | `string` | ✅ |
| `refreshToken` | `string` | `string` | ✅ |

### `GET /auth/me`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 (`UserProfileResult`) | 프론트 기대 (`UserProfile`) | 일치 |
|------|----------------------------------|----------------------------|------|
| `id` | `string (UUID)` | `string` | ✅ |
| `email` | `string` | `string` | ✅ |
| `displayName` | `string` | `string` | ✅ |
| `emailVerifiedAt` | `Date \| null` | `string \| null` | ✅ (JSON 직렬화) |
| `lastLoginAt` | `Date \| null` | `string \| null` | ✅ |
| `createdAt` | `Date` | `string` | ✅ |

---

## 2. 거점 (Household)

### `GET /households`

| 상태 | 비고 |
|------|------|
| ⚠️ | 백엔드는 Household만 반환. 프론트는 rooms, items, catalog 등이 포함된 복합 객체 기대 |

| 필드 | 백엔드 응답 (`HouseholdResult`) | 프론트 기대 (`Household`) | 일치 |
|------|-------------------------------|--------------------------|------|
| `id` | `string` | `string` | ✅ |
| `name` | `string` | `string` | ✅ |
| `kind` | `string \| null` | `string` | ⚠️ null → "home" 기본값 변환 |
| `createdAt` | `Date` | `string` | ✅ |
| `rooms` | ❌ 없음 | `StructureRoom[]` | ❌ 별도 API 호출 필요 |
| `items` | ❌ 없음 | `InventoryRow[]` | ❌ 별도 API 호출 필요 |
| `catalog` | ❌ 없음 | `ProductCatalog` | ❌ 별도 API 4회 호출 필요 |
| `furniturePlacements` | ❌ 없음 | `FurniturePlacement[]` | ❌ 별도 API 호출 필요 |
| `storageLocations` | ❌ 없음 | `StorageLocationRow[]` | ❌ 별도 API 호출 필요 |
| `members` | ❌ 없음 | `GroupMember[]` | ❌ 별도 API 호출 필요 |
| `structureDiagramLayout` | ❌ 없음 | `HouseholdStructureDiagramLayout` | ❌ 별도 API 호출 필요 |

**현재 해결 방식**: `dashboard-api.service.ts`의 `list()` 메서드에서 거점별로 7~8개 API를 병렬 호출 후 클라이언트에서 조합
**개선 제안**: 대시보드용 aggregate endpoint `GET /households/:id/dashboard-view` 추가 검토

---

## 3. 거점 멤버 (Household Member)

### `GET /households/:householdId/members`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치. 백엔드가 User join하여 email/displayName 포함 |

| 필드 | 백엔드 응답 (`HouseholdMemberResult`) | 프론트 기대 (`GroupMember`) | 일치 |
|------|-------------------------------------|----------------------------|------|
| `id` | `string` | `string` | ✅ |
| `email` | `string` | `string` | ✅ |
| `displayName` | `string` | → `label` 매핑 | ⚠️ 필드명 차이 (`displayName` → `label`) |
| `role` | `string` | `"admin" \| "editor" \| "viewer"` | ✅ |

---

## 4. 카탈로그 (Category / Unit / Product / ProductVariant)

### `GET /households/:householdId/categories`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 (`CategoryResult`) | 프론트 기대 (`CatalogCategory`) | 일치 |
|------|-------------------------------|--------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `name` | `string` | `string` | ✅ |
| `sortOrder` | `number` | `number` | ✅ |
| `householdId` | `string` | ❌ 사용 안 함 | ✅ (무시) |
| `createdAt` | `Date` | ❌ 사용 안 함 | ✅ (무시) |

### `GET /households/:householdId/units`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 (`UnitResult`) | 프론트 기대 (`CatalogUnit`) | 일치 |
|------|--------------------------|----------------------------|------|
| `id` | `string` | `string` | ✅ |
| `symbol` | `string` | `string` | ✅ |
| `name` | `string \| null` | `string \| undefined` | ⚠️ null → undefined 변환 |
| `sortOrder` | `number` | `number` | ✅ |

### `GET /households/:householdId/products`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 (`ProductResult`) | 프론트 기대 (`CatalogProduct`) | 일치 |
|------|------------------------------|-------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `categoryId` | `string` | `string` | ✅ |
| `name` | `string` | `string` | ✅ |
| `isConsumable` | `boolean` | `boolean` | ✅ |
| `imageUrl` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `description` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |

### `GET /households/:householdId/products/:productId/variants`

| 상태 | 비고 |
|------|------|
| ⚠️ | 상품별로 개별 호출 필요 → N+1 문제 |

| 필드 | 백엔드 응답 (`ProductVariantResult`) | 프론트 기대 (`CatalogProductVariant`) | 일치 |
|------|-------------------------------------|--------------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `productId` | `string` | `string` | ✅ |
| `unitId` | `string` | `string` | ✅ |
| `quantityPerUnit` | `number` | `number` | ✅ |
| `name` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `price` | `number \| null` | `number \| undefined` | ⚠️ null → undefined |
| `sku` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `isDefault` | `boolean` | `boolean` | ✅ |

**개선 제안**: `GET /households/:householdId/variants` (거점 전체 variant 일괄 조회) 엔드포인트 추가 검토. 현재 상품 10개면 variant 조회만 10회 호출 발생.

---

## 5. 재고 품목 (Inventory Item) ❌ 주요 불일치

### `GET /households/:householdId/inventory-items`

| 상태 | 비고 |
|------|------|
| ❌ | **가장 큰 간극**. 백엔드는 flat ID 반환, 프론트는 join된 표시 데이터 기대 |

**백엔드 실제 응답** (`InventoryItemResult`):
```typescript
{
  id: string;
  productVariantId: string;       // FK만 반환
  storageLocationId: string;      // FK만 반환
  quantity: number;
  minStockLevel: number | null;
  createdAt: string;
  updatedAt: string;
  // 백엔드 컨트롤러에 relation 로드 가능하나, 현재 프론트 서비스 DTO에는 flat만 정의
}
```

**프론트 기대값** (`InventoryRow`):
```typescript
{
  id: string;
  name: string;                   // ← Product.name + variant caption 조합 필요
  quantity: number;
  unit: string;                   // ← Unit.symbol (ProductVariant → Unit join)
  roomId: string;                 // ← StorageLocation → Room 또는 FurniturePlacement → Room
  storageLocationId?: string;
  categoryId?: string;            // ← Product → Category join
  productId?: string;             // ← ProductVariant → Product join
  productVariantId?: string;
  variantCaption?: string;        // ← ProductVariant.name 또는 "quantityPerUnit + unit.symbol"
  quantityPerUnit?: number;       // ← ProductVariant.quantityPerUnit
  minStockLevel?: number;
}
```

| 필드 | 백엔드 → 프론트 매핑 경로 | 현재 처리 |
|------|--------------------------|-----------|
| `name` | Product.name + variant display | 클라이언트 사이드 조인 (카탈로그) |
| `unit` | ProductVariant → Unit.symbol | 클라이언트 사이드 조인 (카탈로그) |
| `roomId` | StorageLocation → Room.id 또는 FurniturePlacement → Room.id | 클라이언트 사이드 조인 (보관장소 + 가구배치) |
| `categoryId` | ProductVariant → Product.categoryId | 클라이언트 사이드 조인 (카탈로그) |
| `productId` | ProductVariant → Product.id | 클라이언트 사이드 조인 (카탈로그) |
| `variantCaption` | ProductVariant.name ?? `${quantityPerUnit}${unit.symbol}` | 클라이언트 사이드 조인 (카탈로그) |
| `quantityPerUnit` | ProductVariant.quantityPerUnit | 클라이언트 사이드 조인 (카탈로그) |

**현재 해결 방식**: `dashboard-api.service.ts` → `loadInventoryItemsFromApi()` 에서 카탈로그·보관장소·가구배치 데이터를 미리 로드 후 Map으로 클라이언트 조인
**문제점**: 거점 데이터 로드 시 카탈로그 전체 + 보관장소 전체 + 가구배치 전체를 먼저 로드해야 재고 목록 표시 가능

**개선 방안 (택 1)**:
- **A. 백엔드 DTO 확장**: `GET /inventory-items` 응답에 nested relation 포함 (productVariant.product, productVariant.unit, storageLocation.room)
- **B. 전용 뷰 엔드포인트**: `GET /households/:id/inventory-view` — 프론트 `InventoryRow` 형태로 직접 반환

---

## 6. 구매 (Purchase) ⚠️ 필드명 불일치

### `GET /households/:householdId/purchases`

| 상태 | 비고 |
|------|------|
| ⚠️ | 필드명 매핑 필요 + batch는 별도 API 호출 |

| 필드 | 백엔드 응답 (`PurchaseResult`) | 프론트 기대 (`PurchaseRecord`) | 일치 |
|------|-------------------------------|-------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `householdId` | `string` | `string` | ✅ |
| `inventoryItemId` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `unitPrice` | `number` | `number` | ✅ |
| `purchasedAt` | `Date` (ISO) | → `purchasedOn` (YYYY-MM-DD) | ❌ **필드명 + 형식 불일치** |
| `supplierName` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `itemName` | `string \| null` | `string` (빈 문자열 기본값) | ⚠️ null → "" |
| `variantCaption` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `unitSymbol` | `string \| null` | `string` (빈 문자열 기본값) | ⚠️ null → "" |
| `memo` | `string \| null` | ❌ 프론트 타입에 없음 | ⚠️ 프론트 미사용 |
| `userId` | `string \| null` | ❌ 프론트 타입에 없음 | ✅ (무시) |
| `totalPrice` | ❌ 없음 | `number` (계산 필드) | ⚠️ 프론트에서 계산 |
| `batches` | ❌ 별도 API | `PurchaseBatchLot[]` | ❌ 별도 API 호출 |

**PurchaseBatch 매핑**:

| 필드 | 백엔드 (`ApiPurchaseBatchRaw`) | 프론트 (`PurchaseBatchLot`) | 일치 |
|------|-------------------------------|----------------------------|------|
| `id` | `string` | `string` | ✅ |
| `purchaseId` | `string` | ❌ 없음 (상위에서 필터) | ✅ |
| `quantity` | `number` | `number` | ✅ |
| `expirationDate` | `string \| null` | → `expiresOn` (YYYY-MM-DD) | ❌ **필드명 불일치** |

**현재 해결 방식**: `mapApiToPurchaseRecord()` 에서:
- `purchasedAt` → `.slice(0, 10)` → `purchasedOn`
- `expirationDate` → `.slice(0, 10)` → `expiresOn`
- `totalPrice` = `unitPrice × totalBatchQuantity`
- batch는 `GET /batches` 별도 호출 후 `purchaseId`로 클라이언트 조인

**개선 제안**: Purchase 응답에 `batches[]` relation 포함하여 반환

---

## 7. 장보기 (Shopping List) ❌ 필드명 불일치

### `GET /households/:householdId/shopping-list-items`

| 상태 | 비고 |
|------|------|
| ❌ | 필드명 3개 불일치. 어댑터 레이어에서 양방향 호환 처리 중 |

| 필드 | 백엔드 응답 (`ShoppingListItemResult`) | 프론트 기대 (`ShoppingListEntry`) | 일치 |
|------|--------------------------------------|----------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `householdId` | `string` | `string` | ✅ |
| `sourceInventoryItemId` | `string \| null` | → `inventoryItemId` | ❌ **필드명 불일치** |
| `memo` | `string \| null` | → `label` | ❌ **필드명 불일치** |
| `quantity` | `number \| null` | → `restockQuantity` (기본값 1) | ❌ **필드명 불일치** |
| `categoryId` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `productId` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `productVariantId` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `targetStorageLocationId` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `createdAt` | `Date` | `string` | ✅ |
| `sortOrder` | `number` | ❌ 프론트 타입에 없음 | ✅ (무시) |
| `unit` | ❌ 없음 | `string \| undefined` | ❌ relation 필요 |
| `variantCaption` | ❌ 없음 | `string \| undefined` | ❌ relation 필요 |

**현재 해결 방식**: `route.adapter.ts` → `mapApiToShoppingEntry()` 에서:
- `sourceInventoryItemId` ↔ `inventoryItemId` 양방향 지원
- `memo` ↔ `label` 양방향 지원
- `quantity` ↔ `restockQuantity` 양방향 지원
- `unit` ← `productVariant?.unit?.symbol` (백엔드 relation이 있을 경우)
- `variantCaption` ← `productVariant?.name` (백엔드 relation이 있을 경우)

**개선 제안**: 백엔드에서 `product`, `productVariant.unit` relation을 eager load하여 반환

---

## 8. 재고 이력 (Inventory Log)

### `GET /households/:householdId/inventory-items/:inventoryItemId/logs`

| 상태 | 비고 |
|------|------|
| ⚠️ | householdId가 응답에 없음. 프론트에서 별도 주입 |

| 필드 | 백엔드 응답 (`InventoryLogResult`) | 프론트 기대 (`InventoryLedgerRow`) | 일치 |
|------|----------------------------------|-----------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `inventoryItemId` | `string` | `string` | ✅ |
| `type` | `string` | `"in" \| "out" \| "adjust" \| "waste"` | ✅ |
| `quantityDelta` | `number` | `number` | ✅ |
| `quantityAfter` | `number` | `number` | ✅ |
| `reason` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `itemLabel` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `memo` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `refType` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `refId` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `createdAt` | `Date` | `string` | ✅ |
| `householdId` | ❌ 없음 | `string` | ⚠️ URL 파라미터에서 주입 가능 |
| `userId` | `string \| null` | ❌ 프론트 타입에 없음 | ✅ (무시) |

---

## 9. 공간 구조 (Space / Room / Furniture / Storage)

### `GET /households/:householdId/rooms`

| 상태 | 비고 |
|------|------|
| ⚠️ | 백엔드 Room에 2D 좌표 없음. house-structure에서 보완 필요 |

| 필드 | 백엔드 응답 (`RoomResult`) | 프론트 기대 (`StructureRoom`) | 일치 |
|------|--------------------------|------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `displayName` | `string` | → `name` | ⚠️ 필드명 차이 |
| `x`, `y`, `width`, `height` | ❌ 없음 | `number` (각각) | ❌ house-structure에서 보완 |
| `structureRoomKey` | `string` | ❌ 프론트에서 미사용 | ✅ (무시) |
| `sortOrder` | `number` | ❌ 프론트에서 미사용 | ✅ (무시) |

**현재 해결 방식**: `dashboard-api.service.ts`에서 rooms API + house-structure API를 병렬 호출 후 `structurePayload.rooms`의 2D 좌표를 병합

### `GET /households/:householdId/storage-locations`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 | 프론트 기대 (`StorageLocationRow`) | 일치 |
|------|------------|----------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `name` | `string` | `string` | ✅ |
| `roomId` | `string \| null` | `string \| null` | ✅ |
| `furniturePlacementId` | `string \| null` | `string \| null` | ✅ |
| `sortOrder` | `number` | `number` | ✅ |

---

## 10. 초대 (Invitation)

### `GET /households/:householdId/invitations`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 (`InvitationResult`) | 프론트 기대 (`MockInvitation`) | 일치 |
|------|--------------------------------|-------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `householdId` | `string` | `string` | ✅ |
| `role` | `string` | `MemberRole` | ✅ |
| `token` | `string` | `string` | ✅ |
| `createdAt` | `Date` | `string` | ✅ |

---

## 11. 알림 (Notification)

### `GET /notifications`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

| 필드 | 백엔드 응답 | 프론트 기대 (`NotificationItem`) | 일치 |
|------|------------|--------------------------------|------|
| `id` | `string` | `string` | ✅ |
| `householdId` | `string` | `string` | ✅ |
| `type` | `string` | notification type union | ✅ |
| `title` | `string` | `string` | ✅ |
| `body` | `string \| null` | `string \| undefined` | ⚠️ null → undefined |
| `readAt` | `Date \| null` | `string \| null` | ✅ |
| `refType` | `string \| null` | `string \| undefined` | ⚠️ |
| `refId` | `string \| null` | `string \| undefined` | ⚠️ |
| `createdAt` | `Date` | `string` | ✅ |

---

## 12. 알림 설정 (Notification Preference)

### `GET /notification-preferences`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

---

## 13. 유통기한 알림 규칙 (Expiration Alert Rule)

### `GET /households/:householdId/expiration-alert-rules`

| 상태 | 비고 |
|------|------|
| ✅ | 응답 일치 |

---

## 14. 거점 유형 정의 (Household Kind Definition)

### `GET /household-kind-definitions`

| 상태 | 비고 |
|------|------|
| ⚠️ | 필드명 매핑 필요 |

| 필드 | 백엔드 응답 | 프론트 기대 (`HouseholdKindDefinition`) | 일치 |
|------|------------|---------------------------------------|------|
| `kindId` | `string` | → `id` | ❌ **필드명 불일치** |
| `label` | `string` | `string` | ✅ |
| `sortOrder` | `number` | `number` | ✅ |

**현재 해결 방식**: `mapKind()` 에서 `kindId` → `id` 변환

---

## 15. Aggregate 엔드포인트 (v1.1 추가)

### `GET /households/:householdId/dashboard-view` ✅ NEW

| 상태 | 비고 |
|------|------|
| ✅ | 대시보드 초기 렌더에 필요한 모든 데이터를 1회 응답으로 반환. G-1, G-4, G-5 해소 |

**응답 구조**:
```typescript
{
  members: HouseholdMemberResult[];
  catalog: { categories, units, products, variants };
  houseStructure: HouseStructureResult | null;
  rooms: RoomResult[];
  furniturePlacements: FurniturePlacementResult[];
  storageLocations: StorageLocationResult[];
  inventoryItems: InventoryItemResult[];  // relation 포함 (productVariant.product, .unit, storageLocation)
  purchases: PurchaseResult[];
  allBatches: PurchaseBatchWithPurchaseResult[];
  expiringBatches: PurchaseBatchWithPurchaseResult[];
  expiredBatches: PurchaseBatchWithPurchaseResult[];
}
```

### `GET /households/:householdId/inventory-logs` ✅ NEW

| 상태 | 비고 |
|------|------|
| ✅ | 거점의 모든 재고 이력을 1회 응답으로 반환. 품목별 N+1 해소 |

**쿼리 파라미터**: `?from=ISO&to=ISO` (선택적 기간 필터)

### `GET /households/:householdId/purchases-full` ✅ NEW

| 상태 | 비고 |
|------|------|
| ✅ | 구매 + 배치 + 임박/만료를 1회 응답으로 반환. G-2(batch 별도 호출) 해소 |

**응답 구조**:
```typescript
{
  purchases: PurchaseResult[];
  allBatches: PurchaseBatchWithPurchaseResult[];
  expiringBatches: PurchaseBatchWithPurchaseResult[];
  expiredBatches: PurchaseBatchWithPurchaseResult[];
}
```

---

## 불일치 요약 및 우선순위

### ❌ 주요 불일치 (개선 검토 필요)

| # | 도메인 | 불일치 유형 | 현재 해결 방식 | 개선 방안 | 우선순위 | 상태 |
|---|--------|-----------|--------------|-----------|---------|------|
| G-1 | **Inventory Item** | 백엔드 flat ID → 프론트 join된 표시 데이터 | ~~클라이언트 사이드 조인~~ aggregate 응답의 relation 사용 | ~~뷰 엔드포인트~~ | **P0** | ✅ **해소** (v1.1 dashboard-view) |
| G-2 | **Purchase** | `purchasedAt` → `purchasedOn` 변환 + batch 별도 호출 | `mapApiToPurchaseRecord()` 변환 + ~~`/batches` API~~ | ~~Purchase 응답에 batches 포함~~ | **P1** | ⚠️ **부분 해소** (batch 통합됨, 날짜 매핑은 유지) |
| G-3 | **Shopping List** | 필드명 3개 불일치 (`source...` → `inventoryItemId` 등) | `route.adapter.ts` 양방향 호환 | 필드명 통일 (프론트 또는 백엔드) | **P1** | 미해소 |
| G-4 | **Product Variant** | 상품별 개별 호출 (N+1) | ~~`Promise.all()` 병렬 호출~~ aggregate에서 일괄 반환 | ~~거점 전체 variant 일괄 조회 API~~ | **P1** | ✅ **해소** (v1.1 dashboard-view) |
| G-5 | **Household** | 대시보드 로드 시 거점당 7~8개 API 호출 | ~~병렬 호출 후 클라이언트 조합~~ aggregate 1회 호출 | ~~aggregate 엔드포인트~~ | **P2** | ✅ **해소** (v1.1 dashboard-view) |
| G-6 | **Room** | 2D 좌표 없음, `displayName` → `name` | house-structure 병합 + 필드 매핑 (aggregate 내부) | Room에 좌표 포함 또는 통합 응답 | **P2** | ⚠️ aggregate 내에서 처리 |
| G-7 | **Household Kind** | `kindId` → `id` 필드명 | `mapKind()` 변환 | 필드명 통일 | **P3** | 미해소 |

### ⚠️ 경미한 불일치 (어댑터 변환으로 충분)

- `null` → `undefined` 변환: 대부분의 nullable 필드에서 발생. TypeScript 컨벤션 차이이므로 어댑터 유지로 충분
- `Date` → `string` 변환: JSON 직렬화에서 자동 처리
- 미사용 필드 (`userId`, `sortOrder` 등): 프론트에서 무시 가능

---

## 점진적 갱신 가이드

### 새 API 추가 시
1. 이 문서에 해당 도메인 섹션 추가
2. 백엔드 응답 타입 vs 프론트 기대 타입 대조표 작성
3. 불일치 발견 시 요약 테이블에 추가

### 기존 API 수정 시
1. 해당 섹션의 대조표 갱신
2. 불일치가 해소되었으면 상태를 ✅로 변경
3. 변경 이력을 버전 테이블에 기록

### 검증 방법
- **수동 검증**: Postman 등으로 API 호출 후 이 문서의 대조표와 비교
- **자동 검증**: E2E 테스트에서 API 응답 스키마 검증 추가 검토
- **타입 검증**: 프론트 서비스 DTO 타입과 백엔드 응답 타입 일치 여부 TypeScript 레벨에서 확인
