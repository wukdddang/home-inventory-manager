# 집 구조도(2D/3D) 기능 — 프론트엔드 명세

원본: 프로젝트 루트 `docs/feature/house-structure-3d-feature.md`  
이 문서는 **프론트엔드 구현**에 필요한 요구사항·기술·UX만 정리한 것입니다. 백엔드 API·엔티티는 원본을 참고하세요.

---

## 1. 요구사항 요약 (프론트 관점)

| 구분 | 내용 |
|------|------|
| **입력** | 집 구조도가 없을 때 → 프론트에서 2D/3D 형태의 집(방, 구역) 구축 |
| **저장** | 구축한 구조를 API로 전송해 서버 DB에 저장 |
| **조회** | 저장된 구조를 API로 불러와, 그 위에 배치한 재고를 시각적으로 확인 |
| **연동** | 방(또는 슬롯) 클릭 시 해당 StorageLocation의 재고 목록/정보 표시 |

---

## 2. 3D 구현 (선택)

### 2.1 기술 스택

| 기술 | 용도 | 비고 |
|------|------|------|
| **Three.js** | 웹에서 3D 씬 렌더링 (WebGL) | 사실상 표준, 문서/예제 풍부 |
| **React Three Fiber (R3F)** | React 컴포넌트로 Three.js 씬 구성 | React 사용 시 권장 |
| **@react-three/drei** | R3F용 헬퍼(카메라, 컨트롤, 그리드 등) | 3D UI/편집기 구현 시 유용 |

**역할**

- **집 편집 모드**: 방/벽/바닥을 박스(BoxGeometry) 등으로 배치해 “집 구조” 정의
- **뷰 모드**: 저장된 구조 데이터를 불러와 3D로 렌더링하고, 재고 마커/레이블 표시

**대안**: Babylon.js, A-Frame

### 2.2 구조 데이터 (프론트에서 다루는 형식)

서버에서 받아오는/보내는 구조는 **자체 JSON 스키마**를 사용합니다.

- 예: `{ rooms: [{ id, name, bounds, floorZ }], slots: [{ id, roomId, position, storageLocationId }] }`
- 2D만 쓸 경우: `rooms: [{ id, name, x, y, width, height }]`, `slots`는 방–StorageLocation 연결 정보

---

## 3. 2D 집 구조 — 사용자가 만드는 방식

빈 캔버스에 선을 그려서 전부 직접 그리게 할 필요는 없습니다.

### 3.1 블록(방) 추가 방식

- **「방 추가」** → 기본 크기 사각형(방) 생성
- **방 이름 입력** (거실, 주방, 냉장고 옆 등)
- (선택) 방 드래그·리사이즈
- (선택) 방 안에 보관 위치(슬롯) 지정 → StorageLocation과 연결

데이터: `rooms: [{ id, name, x, y, width, height }], slots: [...]`

### 3.2 템플릿에서 시작

- "원룸", "2룸", "주방 분리형 3룸" 등 미리 정의한 `structurePayload` JSON 제공
- 사용자: 템플릿 선택 → 방 이름만 수정 또는 크기만 조정

### 3.3 확정 스코프: ERD 스타일 + 이름 변경 + 방 클릭 시 재고 정보

- **표현**: 큰방, 작은방1, 작은방2, 화장실1 처럼 **방 단위 박스 + 라벨**만 (ERD처럼).
- **편집**: **이름 변경만** 허용 (위치/크기는 템플릿 또는 기본값 고정 가능).
- **연동**: 각 "방"은 하나의 **StorageLocation**(또는 방:장소 1:N)과 연결.
- **UX**: **방 클릭** → 그 방(StorageLocation)에 연결된 **재고 목록/정보**를 패널/모달로 표시.

---

## 4. 2D 구현용 라이브러리 추천

| 라이브러리 | 방식 | 장점 | 단점 | 적합도 |
|------------|------|------|------|--------|
| **라이브러리 없음 (SVG + React)** | `<svg>` 안에 `<rect>` + `<text>` (또는 `<foreignObject>`), state로 `rooms[]` 관리 | 의존성 없음, 구현 단순, 번들 작음 | 드래그/리사이즈는 직접 구현 | ★★★★★ |
| **react-konva** | Canvas, `Stage` > `Layer` > `Rect`, `Text`, `Group` | 드래그·리사이즈·클릭 내장 | Canvas 기반, 접근성 고려 필요 | ★★★★ |
| **React Flow (@xyflow/react)** | 방을 Node로, Edge 없이 사용 | 줌/팬, 노드 클릭/선택 내장 | 플로우 개념과 다름, 커스터마이징 필요 | ★★★ |
| **Fabric.js (react-fabric)** | Canvas, 도형·텍스트·이벤트 | 편집기형 UI에 강함 | 무겁고 React 결합 보조 필요 | ★★ |

### 권장안

- **현재 스코프(이름 변경 + 방 클릭 → 재고 정보)**
  → **SVG + React**로 구현 권장.
  - `rooms: [{ id, name, x, y, width, height }]` 상태로 각 방을 `<rect>` + 라벨 렌더.
  - **클릭** 시 선택 상태 저장 → 우측/하단 패널에 해당 방(StorageLocation)의 **재고 목록** 표시.  
  - **이름 변경**: 방 더블클릭 시 인라인 `<input>` 또는 작은 모달.
- **"방 드래그로 배치 변경" 추가 시**  
  → **react-konva** 도입 검토.

---

## 5. 프론트 구현 순서 제안

1. **구조 뷰어 (2D)**  
   - API에서 `structurePayload` 수신 → SVG로 방 박스 + 라벨 렌더.  
   - 방 클릭 시 선택 상태 저장.
2. **방 클릭 → 재고 목록**  
   - 선택한 방(roomId)에 대응하는 StorageLocation 조회 API 호출 → 해당 장소의 InventoryItem 목록 표시.
3. **이름 변경**  
   - 방 더블클릭(또는 편집 버튼) 시 이름 수정 UI → PATCH 등으로 반영.
4. **(선택) 구조 편집**  
   - 방 추가·위치/크기 조절 → `structurePayload` 생성 → API로 저장.
5. **(선택) 3D 뷰**  
   - Three.js(R3F)로 동일 `structurePayload` 렌더, 방/슬롯 클릭 시 재고 정보 표시.

---

## 6. 필요한 API (참고)

- `GET /households/:id/structure` — 구조 조회 (프론트에서 2D/3D 복원)
- `POST /households/:id/structure` — 구조 생성/덮어쓰기
- `PATCH /households/:id/structure` — (선택) 부분 수정
- StorageLocation·InventoryItem 조회 API — 방(roomId/slotId) 기준 목록 조회

---

## 7. 참고 자료

**2D (ERD 스타일 집 구조)**  
- [MDN SVG](https://developer.mozilla.org/ko/docs/Web/SVG) — rect, text, foreignObject  
- [react-konva](https://konvajs.org/docs/react/) — Canvas 기반 드래그/리사이즈 필요 시  

**3D**  
- [Three.js 공식 문서](https://threejs.org/docs/)  
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)  
- [glTF 스펙](https://www.khronos.org/gltf/) — 고급 3D 연동 시  

---

*원본 문서(docs/feature/house-structure-3d-feature.md)의 백엔드·ERD·전체 플로우는 프로젝트 루트 docs를 참고하세요.*
