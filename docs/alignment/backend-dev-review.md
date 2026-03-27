# 백엔드 개발 전 검토 사항

**목적**: 프론트엔드 UI 구현(타입·mock 데이터·화면 흐름)과 백엔드 설계 문서(ERD·논리 설계·정합성 문서)를 전수 교차 검토하여, 백엔드 개발 착수 전에 해결해야 할 간극·누락·불일치를 정리한 문서입니다.

**검토 기준**:
- 프론트엔드: `types/domain.ts`, `_context/` 서비스, `lib/` 헬퍼, mock 시드, UI 화면 전체
- 백엔드 설계: `docs/design/v2/` (논리 설계·ER·개념 설계·체크리스트), `docs/alignment/frontend-backend-alignment.md` v1.4

**작성일**: 2026-03-27

---

## 체크리스트

### P0 — 치명

- [x] **#1** Purchase.householdId 누락 → 컬럼 추가 완료 **(v2.2)**
- [x] **#3** 카탈로그 전역 vs Household-scoped 불일치 → 프론트 카탈로그를 거점별로 분리 완료

### P1 — 높음

- [x] **#4** HouseholdKindDefinition 저장소 결정 → 테이블 추가 완료 **(v2.3)**
- [x] **#5** 알림 마스터 토글 필드 누락 → NotificationPreference에 추가 완료 **(v2.4)**
- [x] **#11** 장보기 완료 트랜잭션 API 정의 → API 스펙에 추가 완료 **(v2.4)**

### P2 — 보통

- [x] **#6** ID 타입 (string vs bigint) 결정 → **UUID 확정** **(v2.5)**
- [~] **#7** InventoryRow.roomId DTO 매핑 → 확인됨, API 설계 시 반영 예정
- [~] **#8** ShoppingListEntry 필드명 불일치 → 확인됨, DTO 매핑 레이어에서 처리 예정
- [x] **#10** InventoryLog.householdId 비정규화 → **비정규화 안 함, join으로 충분** **(v2.5)**
- [x] **#12** Purchase.quantity/totalPrice 제거 + 카탈로그 추가 시 단가 입력 UI 추가 **(v2.5)**

### P3 — 낮음

- [ ] **#2** ShoppingListItem.label → 현재 UI에서는 join으로 충분. 자유 텍스트 장보기 지원 시 추가
- [ ] **#9** StructureRoom 좌표 저장 스펙 명확화 → API 문서에 JSONB 파싱 규칙 명시

---

## 상세

### ~~#1. Purchase에 `householdId` 누락~~ — 해결 (v2.2)

**해결**: `Purchase`에 `householdId bigint FK NOT NULL` 추가 완료. v2 설계 문서(논리 설계·ER·개념 설계) 반영됨.

**배경**: `inventoryItemId`가 nullable이므로, 재고 미연결 구매의 거점 귀속을 위해 필수. 프론트엔드 `/purchases` 화면에서 거점 탭으로 구매를 필터링하고, `/dashboard` 재고 상세 서랍에서 거점+품목 기준으로 구매 이력을 조회한다.

---

### #2. ShoppingListItem에 `label` 필드 누락 — P3 낮음 (하향 조정)

**현상**: 프론트엔드 `ShoppingListEntry`에 `label` 필드가 있으나, 실제 UI에서 사용자가 직접 입력하는 경로는 없다.

**분석 결과**: label은 세 가지 경로 모두에서 자동 파생된다:
1. **장보기 제안 "담기"**: 기존 재고의 `item.name`에서 복사
2. **"장보기에만 담기"**: 카탈로그 선택 후 `inventoryDisplayLine()`으로 자동 생성
3. **소진 품목 표시**: 기존 재고의 `item.name`에서 표시

**결론**: 현재 UI 기준으로는 `productId` → Product.name join으로 충분하다. 프론트엔드 타입도 `label`을 optional로 변경 완료. 향후 자유 텍스트 장보기("우유 사야 함") 지원 시 `label` 컬럼 추가 검토.

---

### ~~#3. 프론트엔드 카탈로그는 전역, 백엔드는 Household-scoped~~ — 해결

**해결**: 프론트엔드 카탈로그를 거점별(`Household.catalog`)로 분리 완료. (2026-03-27)

- `DashboardContext`에서 전역 `productCatalog` 상태를 제거하고, `거점_카탈로그를_가져온다(householdId)` / `카탈로그를_갱신_한다(householdId, updater)` API로 교체
- localStorage 전역 키 `him-product-catalog`에서 각 거점 내부 `catalog` 필드로 마이그레이션 (기존 데이터 자동 이전)
- 설정 화면 카탈로그 관리에 거점 선택 드롭다운 추가
- API 연동 시 `GET /api/households/:id/catalog` 형태로 거점별 로드 예정

---

### ~~#4. HouseholdKindDefinition의 저장소 부재~~ — 해결 (v2.3)

**해결**: `HouseholdKindDefinition` 테이블 추가 완료 (방안 A 확정). v2.3 설계 문서(논리 설계·ER·개념 설계) 반영됨.

**테이블 스키마**:
- `id` bigint PK
- `userId` bigint FK → User (NOT NULL)
- `kindId` varchar NOT NULL — 유형 식별자 ('home', 'office', 'vehicle', 'other', 사용자 정의)
- `label` varchar NOT NULL — 표시 라벨
- `sortOrder` int default 0
- `(userId, kindId)` UNIQUE
- `createdAt`, `updatedAt`

**설계 결정**:
- **스코프**: 사용자별(per-user) — 각 사용자가 자신의 거점 유형 목록을 관리
- **Household.kind와의 관계**: `Household.kind` varchar는 `kindId` 값을 저장. FK 제약 없이 느슨한 참조 — 유형 삭제 시 기존 거점의 kind 값 유지 (프론트에서 fallback 처리)
- **초기 시드**: 가입 시 기본 4종(home/집, office/사무실, vehicle/차량, other/기타) 생성
- **프론트엔드**: 기존 설정 화면 CRUD UI 유지. localStorage(`him-household-kinds`) → API(`GET/PUT /api/household-kind-definitions`) 전환
- **API**: 목록 조회(GET) + 전체 교체(PUT) 방식으로 프론트의 일괄 저장 패턴에 맞춤

---

### ~~#5. 알림 마스터 토글 필드 누락~~ — 해결 (v2.4)

**해결**: `NotificationPreference`에 마스터 토글 3컬럼 추가 완료. v2.4 설계 문서(논리 설계·ER·개념 설계) 반영됨.

**추가된 컬럼**:
- `notifyExpiration` boolean, default **true** — 유통기한 알림 전체 켜기/끄기
- `notifyShopping` boolean, default **true** — 장보기 알림 전체 켜기/끄기
- `notifyLowStock` boolean, default **false** — 재고 부족 알림 전체 켜기/끄기

**동작**: 마스터 토글이 false이면 해당 카테고리의 세부 설정(expirationDaysBefore, shoppingTripReminder 등)은 모두 무시된다. 백엔드 알림 스케줄러가 마스터 토글을 먼저 확인해야 한다.

**프론트엔드 대응**: `AppSettings`의 `notifyExpiration`/`notifyShopping`/`notifyLowStock` → NotificationPreference API의 동일 필드로 전환. UI 변경 없음.

---

### ~~#6. ID 타입 불일치 — string vs bigint~~ — 해결 (v2.5)

**해결**: 모든 엔티티 PK를 **UUID**로 확정. v2.5 설계 문서 반영됨.

**결정 근거**:
- 프론트엔드가 `crypto.randomUUID()`로 클라이언트 사이드 ID 생성 — 낙관적 업데이트 패턴 유지
- 기존 mock 데이터와의 호환성
- 오프라인 생성·병합 충돌 방지에 유리
- 가정 재고 앱 규모에서 UUID 성능 오버헤드 무시 가능

---

### #7. InventoryRow.roomId — 백엔드에 없는 직접 필드 — P2 보통 (확인됨, API 설계 시 처리)

**현상**: 프론트엔드 `InventoryRow`에 `roomId: string`이 필수 필드이다. 대시보드에서 방별로 재고를 그룹핑/필터링한다.

**백엔드 설계**: `InventoryItem`에 `roomId`가 없다. 방 정보는 `StorageLocation → Room` 또는 `StorageLocation → FurniturePlacement → Room` 경로로만 도출 가능하다.

**처리 방향**: API 응답 DTO에서 `StorageLocation`의 `roomId` 또는 `FurniturePlacement.roomId`를 resolve하여 `roomId` 필드로 내려준다. 테이블 변경 없음, API 설계(v2.1) 단계에서 DTO 매핑으로 처리.

---

### #8. ShoppingListEntry 필드명 불일치 — P2 보통 (확인됨, API 설계 시 처리)

| 프론트엔드 | 백엔드 | 비고 |
|-----------|--------|------|
| `inventoryItemId` | `sourceInventoryItemId` | 이름 다름 |
| `restockQuantity` | `quantity` | 이름 다름 |
| `label` | *(없음)* | #2에서 분석 완료 — join으로 해결 |
| `unit` | *(join 도출)* | DTO에서 해결 |
| `variantCaption` | *(join 도출)* | DTO에서 해결 |

**처리 방향**: DTO 매핑 레이어에서 필드명을 프론트 타입에 맞춰 변환한다. 테이블 변경 없음, API 설계(v2.1) 단계에서 처리.

---

### #9. StructureRoom 좌표 저장 방식 차이 — P3 낮음

**현상**: 프론트엔드 `StructureRoom`은 `x, y, width, height`를 직접 필드로 가진다.

**백엔드 설계**: `Room` 테이블에는 좌표가 없고, `HouseStructure.structurePayload` (JSONB)에 방 정의가 포함된다. 별도로 `HouseStructure.diagramLayout` (JSONB)에 렌더링 좌표가 있다.

**문제**: 프론트엔드의 `StructureRoom.x/y/width/height`가 `structurePayload` 안에 있는 건지, `diagramLayout` 안에 있는 건지 명확하지 않다. API DTO에서 이 두 JSONB를 파싱하여 flat한 `StructureRoom[]`로 변환하는 스펙이 필요하다.

**제안**: API 문서에 JSONB 파싱 규칙 및 DTO 변환 스펙을 명시.

---

### ~~#10. InventoryLog에 `householdId` 비정규화 부재~~ — 해결 (v2.5)

**해결**: 비정규화하지 않음. join 또는 서브쿼리로 충분.

**결정 근거**:
- 가정 재고 앱의 데이터 규모에서 3단 join(`InventoryLog → InventoryItem → StorageLocation → Household`)은 성능 이슈가 될 가능성이 극히 낮음
- 적절한 인덱스(`inventoryItemId`, `storageLocationId`, `householdId`)로 충분히 커버
- 프론트엔드가 `householdId`를 직접 들고 있는 건 localStorage 기반이라 join 비용이 없어서이고, 백엔드에서는 인덱스가 그 역할을 수행
- 비정규화 시 데이터 불일치(재고 이동 시 householdId 미갱신) 위험 회피

**API 쿼리 패턴** (예시):
```sql
SELECT il.* FROM inventory_log il
  JOIN inventory_item ii ON il.inventoryItemId = ii.id
  JOIN storage_location sl ON ii.storageLocationId = sl.id
  WHERE sl.householdId = :householdId
  ORDER BY il.createdAt DESC
```

---

### ~~#11. 장보기 완료 트랜잭션 API 미정의~~ — 해결 (v2.4)

**해결**: `POST /api/shopping-list-items/:id/complete` 트랜잭션 API 스펙 정의 완료. v2.4 설계 문서(논리 설계 ShoppingListItem 섹션) 반영됨.

**API 스펙**:
- **엔드포인트**: `POST /api/shopping-list-items/:id/complete`
- **Body**: `{ inventoryItemId, quantity, memo? }`
- **트랜잭션** (원자적):
  1. `InventoryItem.quantity` 증가
  2. `InventoryLog` 생성 (type: `'in'`, refType: `'shopping'`, refId: shoppingListItemId)
  3. `ShoppingListItem` 삭제
- **응답**: 갱신된 InventoryItem + 생성된 InventoryLog

**프론트엔드 대응**:
- `DashboardContext.재고_장보기_보충을_기록_한다()` → 이 API 호출로 전환
- `DashboardShoppingList.module.tsx`의 `completeLinked()` / `completeSaved()` / `completeDepleted()` 함수가 이 API를 사용
- 매칭 재고가 없는 경우: `DELETE /api/shopping-list-items/:id`로 목록에서만 제거 (기존 동작 유지)

---

### ~~#12. Purchase.quantity/totalPrice 파생값 제거 + 카탈로그 추가 시 단가 입력 누락~~ — 해결 (v2.5)

**해결**: `Purchase.quantity`와 `Purchase.totalPrice` 제거. 카탈로그 추가 UI에 단가 입력 필드 추가.

**제거 대상 (파생값)**:
- `Purchase.quantity` — `SUM(PurchaseBatch.quantity)`로 항상 계산 가능. 프론트에도 없음
- `Purchase.totalPrice` — `unitPrice × SUM(batch.quantity)`로 계산 가능

**유지 대상 (원본값)**:
- `Purchase.unitPrice` — 사용자가 직접 입력하는 단가. 다른 곳에서 구할 수 없음

**프론트엔드 수정**:
- 카탈로그에서 재고 추가 시 자동 생성되는 PurchaseRecord에 `unitPrice: 0`, `totalPrice: 0`이 하드코딩되어 있었음
- 5단계(수량·유통기한) 영역에 **단가 입력 필드** 추가 (`DashboardItemForm.section/index.tsx`)
- `totalPrice`를 `unitPrice × qty`로 자동 계산하여 저장

---

*본 문서는 백엔드 개발 착수 전 1회성 검토 목적으로 작성되었으며, 항목이 해결되면 [frontend-backend-alignment.md](./frontend-backend-alignment.md)에 결정 사항을 반영합니다.*
