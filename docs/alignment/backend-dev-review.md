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

- [ ] **#4** HouseholdKindDefinition 저장소 결정 → 테이블 추가 또는 UI 단순화
- [ ] **#5** 알림 마스터 토글 필드 누락 → NotificationPreference에 추가
- [ ] **#11** 장보기 완료 트랜잭션 API 정의 → API 스펙에 추가

### P2 — 보통

- [ ] **#6** ID 타입 (string vs bigint) 결정 → 프로젝트 초기에 확정
- [ ] **#7** InventoryRow.roomId DTO 매핑 → API 응답 설계 시 반영
- [ ] **#8** ShoppingListEntry 필드명 불일치 → DTO 매핑 레이어에서 처리
- [ ] **#10** InventoryLog.householdId 비정규화 → 성능 고려하여 추가 권장
- [ ] **#12** Purchase.quantity 역할 정리 → 제거 또는 용도 명확화

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

### #4. HouseholdKindDefinition의 저장소 부재 — P1 높음

**현상**: 프론트엔드는 `HouseholdKindDefinition[]`을 `him-household-kinds` localStorage에 저장하고, 설정 화면에서 CRUD(추가/수정/삭제/정렬)를 지원한다.

**백엔드 설계**: §2-1에서 "별도 HouseholdKind 마스터 테이블은 과설계 — Household.kind varchar만 사용"으로 결정.

**왜 문제인가**: `kind` varchar만으로는 다음이 불가능하다:
- 사용자 정의 라벨(label) 관리
- 정렬 순서(sortOrder) 저장
- 종류 삭제 시 기존 거점의 fallback 처리 (프론트 `거점_유형_정의를_교체_한다()`에 구현됨)
- 다중 사용자 간 종류 정의 동기화

**프론트엔드 근거**:
- `HouseholdKindDefinition { id, label, sortOrder? }` 타입 정의 (`types/domain.ts`)
- 설정 화면에서 종류 CRUD UI 구현 완료
- 기본 4종 (`home`, `office`, `vehicle`, `other`) + 사용자 추가 지원

**제안**: 두 가지 중 선택 필요:
- **A**: `HouseholdKindDefinition` 테이블 추가 (`id, userId, label, sortOrder`)
- **B**: 프론트엔드 설정 화면에서 종류 관리 UI를 제거하고, 고정 enum으로 단순화

---

### #5. 알림 마스터 토글 필드 누락 — P1 높음

**현상**: 프론트엔드 `AppSettings`에는 세 가지 마스터 토글이 있다:
```typescript
notifyExpiration: boolean   // 유통기한 알림 전체 켜기/끄기
notifyShopping: boolean     // 장보기 알림 전체 켜기/끄기
notifyLowStock: boolean     // 재고 부족 알림 전체 켜기/끄기
```

**백엔드 설계**: `NotificationPreference` 테이블에는 세부 설정만 있고 (`expirationDaysBefore`, `shoppingTripReminder` 등), 카테고리별 마스터 스위치가 없다.

**왜 문제인가**: 사용자가 "유통기한 알림"을 전체 끄면, 세부 설정(며칠 전, 당일 알림, 만료 후 알림)이 모두 무시되어야 한다. 백엔드 스케줄러에서 이 마스터 토글을 참조할 수 없다.

**프론트엔드 근거**:
- 설정 화면의 알림 카드 상단에 마스터 토글 배치
- `DEFAULT_SETTINGS`에서 `notifyExpiration: true`, `notifyShopping: true`, `notifyLowStock: false`

**제안**: `NotificationPreference`에 `notifyExpiration boolean`, `notifyShopping boolean`, `notifyLowStock boolean` 컬럼 추가.

---

### #6. ID 타입 불일치 — string vs bigint — P2 보통

**현상**: 프론트엔드는 모든 엔티티 ID를 `string` (UUID, `crypto.randomUUID()`)으로 생성한다. 백엔드 설계는 `bigint` PK를 사용한다.

**영향**:
- 기존 mock 데이터와의 호환성
- 클라이언트 사이드 ID 생성이 불가능해짐 (낙관적 업데이트 패턴 변경 필요)
- FK 참조 시 타입 변환

**제안**: 백엔드도 UUID를 PK로 사용하거나, 프론트엔드에서 서버 응답의 bigint ID를 string으로 변환하는 레이어 추가. UUID 방식이 오프라인 생성, 병합 충돌 방지에 유리.

---

### #7. InventoryRow.roomId — 백엔드에 없는 직접 필드 — P2 보통

**현상**: 프론트엔드 `InventoryRow`에 `roomId: string`이 필수 필드이다. 대시보드에서 방별로 재고를 그룹핑/필터링한다.

**백엔드 설계**: `InventoryItem`에 `roomId`가 없다. 방 정보는 `StorageLocation → Room` 또는 `StorageLocation → FurniturePlacement → Room` 경로로만 도출 가능하다.

**제안**: API 응답 DTO에서 `StorageLocation`의 `roomId` 또는 `FurniturePlacement.roomId`를 resolve하여 `roomId` 필드로 내려주어야 한다. 쿼리 시 join이 필요하므로 성능 고려.

---

### #8. ShoppingListEntry 필드명 불일치 — P2 보통

| 프론트엔드 | 백엔드 | 비고 |
|-----------|--------|------|
| `inventoryItemId` | `sourceInventoryItemId` | 이름 다름 |
| `restockQuantity` | `quantity` | 이름 다름 |
| `label` | *(없음)* | #2에서 분석 완료 — join으로 해결 |
| `unit` | *(join 도출)* | DTO에서 해결 |
| `variantCaption` | *(join 도출)* | DTO에서 해결 |

DTO 매핑 레이어에서 필드명을 프론트 타입에 맞춰 변환해야 한다.

---

### #9. StructureRoom 좌표 저장 방식 차이 — P3 낮음

**현상**: 프론트엔드 `StructureRoom`은 `x, y, width, height`를 직접 필드로 가진다.

**백엔드 설계**: `Room` 테이블에는 좌표가 없고, `HouseStructure.structurePayload` (JSONB)에 방 정의가 포함된다. 별도로 `HouseStructure.diagramLayout` (JSONB)에 렌더링 좌표가 있다.

**문제**: 프론트엔드의 `StructureRoom.x/y/width/height`가 `structurePayload` 안에 있는 건지, `diagramLayout` 안에 있는 건지 명확하지 않다. API DTO에서 이 두 JSONB를 파싱하여 flat한 `StructureRoom[]`로 변환하는 스펙이 필요하다.

**제안**: API 문서에 JSONB 파싱 규칙 및 DTO 변환 스펙을 명시.

---

### #10. InventoryLog에 `householdId` 비정규화 부재 — P2 보통

**현상**: 프론트엔드 `InventoryLedgerRow`에 `householdId`가 있고, 재고 이력 화면에서 거점별 필터링이 핵심 기능이다.

**백엔드 설계**: `InventoryLog`에 `householdId`가 없다. `InventoryItem → StorageLocation → Household` 경로로 3단 join이 필요하다.

**제안**: 이력 테이블은 행 수가 빠르게 증가하므로 join 비용이 크다. `InventoryLog`에 `householdId bigint FK` 비정규화 추가를 권장.

---

### #11. 장보기 완료 트랜잭션 API 미정의 — P1 높음

**현상**: 프론트엔드 장보기 화면에서 "구매 완료" 시 다음이 한 번에 발생한다:
1. `InventoryItem.quantity` 증가
2. `InventoryLedgerRow` 생성 (type: `"in"`, refType: `"shopping"`)
3. `ShoppingListEntry` 삭제

**백엔드 설계**: §4-5에서 "구매 → 재고 자동 반영"을 언급하지만, 장보기 완료 플로우의 트랜잭션 API는 구체적으로 정의되지 않았다.

**프론트엔드 근거**:
- `DashboardContext.재고_장보기_보충을_기록_한다()` — 재고 증가 + 이력 생성을 동시에 수행
- 장보기 패널에서 "구매 완료" 버튼 클릭 시 장보기 항목 삭제

**제안**: `POST /api/shopping-list-items/:id/complete` 같은 트랜잭션 API를 설계에 명시. 세 작업이 원자적으로 수행되어야 한다.

---

### #12. Purchase.quantity의 역할 모호 — P2 보통

**현상**: 백엔드 `Purchase`에 `quantity` 컬럼이 있지만, 프론트엔드 `PurchaseRecord`에는 top-level `quantity`가 없다. 프론트엔드는 `batches[].quantity`의 합으로 총 수량을 계산한다.

**제안**: `Purchase.quantity`를 제거하거나, `batches` 합계의 비정규화 캐시로 용도를 명확히 정의.

---

*본 문서는 백엔드 개발 착수 전 1회성 검토 목적으로 작성되었으며, 항목이 해결되면 [frontend-backend-alignment.md](./frontend-backend-alignment.md)에 결정 사항을 반영합니다.*
