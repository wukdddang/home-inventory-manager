# 집 구조도(2D/3D) 기능 — 백엔드 명세

집 구조(방·구역)를 서버에 저장하고, 보관 장소(StorageLocation)와 연결해 “어느 방에 어떤 물품이 있는지” 조회할 수 있게 하는 **백엔드** 요구사항·엔티티·API 정리입니다.  
프론트 관련(2D/3D 렌더링, 라이브러리, UX)은 [frontend/docs/house-structure-feature.md](../../frontend/docs/house-structure-feature.md)를 참고하세요.

---

## 1. 요구사항 요약 (백엔드 관점)

| 구분     | 내용                                                                                       |
| -------- | ------------------------------------------------------------------------------------------ |
| **저장** | Household당 “집 구조” 한 건을 JSON(방·슬롯 정의)으로 저장                                  |
| **조회** | 구조 조회 API로 클라이언트에 structurePayload 전달                                         |
| **연동** | StorageLocation을 “집 구조 내 방/슬롯”과 연결해, 방 기준으로 물품(InventoryItem) 조회 가능 |

---

## 2. 구조 데이터 포맷 (DB 저장용)

집 구조는 **자체 JSON 스키마**로 저장하는 것을 권장합니다.

- **2D 기준 예시**: `{ "rooms": [{ "id", "name", "x", "y", "width", "height" }], "slots": [{ "id", "roomId", "storageLocationId" }] }`
- **3D 확장 시**: rooms에 `floorZ`, bounds 등 추가 가능.
- DB에는 **JSONB** 컬럼 하나로 저장 (예: `HouseStructure.structurePayload`).

---

## 3. 백엔드 엔티티 및 API

### 3.1 추가/변경 엔티티

| 엔티티                              | 역할                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **HouseStructure** (또는 FloorPlan) | Household당 1개. 집 구조 한 채. `structurePayload`(JSONB) 보관.                                         |
| **HouseStructureRoom**              | (선택) 방 단위를 별도 테이블로 두는 경우. HouseStructure 1:N.                                           |
| **StorageLocation 확장**            | 기존 엔티티에 `houseStructureId` + `roomId`(또는 `slotId`) 추가 → “어느 집 구조의 어느 방/슬롯”과 연결. |

**HouseStructure 예시 필드**

- `id` (PK)
- `householdId` (FK → Household)
- `name` (예: "우리 집")
- `structurePayload` (JSONB): 위 JSON 스키마
- `version` (스키마 버전 관리, 선택)
- `createdAt`, `updatedAt` (선택)

### 3.2 물품–위치 연결

- **StorageLocation**이 “집 구조 내 방/슬롯”과 연결되어야, “이 방에 어떤 물품이 있는지” 조회 가능.
- **InventoryItem**은 이미 `StorageLocation`을 갖고 있으므로, StorageLocation ↔ 방(roomId/slotId)만 정해지면 됨.

**구현 옵션**

1. **StorageLocation 확장**: `houseStructureId`, `roomId`(또는 `slotId`) 컬럼 추가.
2. **별도 엔티티 ItemPlacement**: `houseStructureId`, `storageLocationId`, `roomId`/위치 정보. 한 장소를 여러 표시 위치에 매핑할 때 유연.

초기에는 **1번(StorageLocation 확장)**으로 시작하고, 필요 시 2번으로 분리해도 됩니다.

### 3.3 API

- `GET /households/:id/structure` — 구조 조회 (structurePayload 반환)
- `POST /households/:id/structure` — 구조 생성/덮어쓰기
- `PATCH /households/:id/structure` — (선택) 부분 수정

StorageLocation CRUD 시 `roomId`/`slotId`(또는 구조 내 식별자)를 받아서 저장하면, “방별 물품 목록” 조회는 기존 InventoryItem + StorageLocation 쿼리로 가능합니다.

---

## 4. 구현 순서 제안 (백엔드)

1. **HouseStructure 엔티티** 추가 (householdId, name, structurePayload JSONB). Household과 1:1.
2. **구조 CRUD API** (생성/조회/수정).
3. **StorageLocation 확장**: houseStructureId, roomId(또는 slotId) 필드 추가 및 API 요청/응답 반영.
4. **방(roomId) 기준 물품 목록 조회** API (선택): 해당 Household의 StorageLocation 중 roomId가 일치하는 것들의 InventoryItem 목록 반환.

---

## 5. 참고

- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html) — structurePayload 저장.
- ERD·엔티티 상세: [er-diagram.md](./er-diagram.md), [entity-logical-design.md](./entity-logical-design.md).
