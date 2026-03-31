# API 연결 현황 체크리스트

**최초 작성**: 2026-03-31
**기준**: feature-checklist.md v2.5

프론트엔드와 백엔드 API 연결 진행 상황을 추적합니다.
범례: ✅ 완료 (context → route handler → backend 모두 연결) | 🚧 route handler 있음, context 미연결 | ⬜ UI 없음 (또는 개발 전)

---

## 인프라 / 공통

| 항목 | 상태 | 비고 |
|------|------|------|
| docker-compose PostgreSQL 구성 | ✅ | `him-postgres` 컨테이너, port 5432 |
| backend `.env` (JWT/Mail 시크릿) | ✅ | `backend/.env` 생성 |
| Next.js API 라우트 기반 구조 | ✅ | `app/api/_base/`, `app/api/_backend/` |
| accessToken 서버 메모리 캐시 | ✅ | `app/api/_base/index.ts` — Map 기반 |
| refreshToken httpOnly 쿠키 | ✅ | 쿠키명: `him_refresh_token` |
| 만료 60초 전 자동 토큰 갱신 | ✅ | `getAccessToken()` 내 자동 처리 |

---

## 사용자

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 회원가입 | `POST /api/auth/signup` | ✅ | `SignupContext` → route handler |
| 이메일 인증 요청 | — (백엔드 자동 발송) | ✅ | 가입 시 백엔드에서 메일 전송 |
| 이메일 인증 완료 | `GET /api/auth/verify-email` | ✅ | 토큰 쿼리 파라미터 |
| 로그인 | `POST /api/auth/login` | ✅ | `LoginContext` → route handler |
| 로그아웃 | `POST /api/auth/logout` | ✅ | `AppShell` → route handler |
| 내 정보 조회 | `GET /api/auth/me` | ✅ | `AuthGuard` 마운트 시 호출 |
| 토큰 갱신 | `POST /api/auth/refresh` | ✅ | 자동 갱신 (클라이언트 직접 호출 없음) |
| 비밀번호 변경 | `PATCH /api/auth/password` | ✅ | route handler 존재, UI 연결 필요 확인 필요 |

---

## 거점

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 거점 목록 조회 | `GET /api/households` | ✅ | `DashboardContext` → `dashboardApiHouseholdsClient` |
| 거점 생성 | `POST /api/households` | ✅ | `거점을_추가_한다` |
| 거점 정보 수정 | `PUT /api/households/[id]` | ✅ | `거점_기본정보를_수정_한다` |
| 거점 삭제 | `DELETE /api/households/[id]` | ✅ | `거점을_삭제_한다` |
| 거점 멤버 목록 조회 | `GET /api/households/[id]/members` | ✅ | 거점 목록 fetch 시 병렬 포함 |
| 거점 멤버 역할 변경 | `PATCH /api/households/[id]/members/[mid]/role` | ✅ | `멤버_역할을_변경_한다` |
| 거점 멤버 제거 | `DELETE /api/households/[id]/members/[mid]` | ✅ | `멤버를_제거_한다` |

---

## 거점 초대

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 초대 링크 생성 | `POST /api/households/[id]/invitations` | ✅ | `초대를_생성_한다` |
| 이메일 초대 전송 | `POST /api/households/[id]/invitations` | ✅ | `inviteeEmail` 파라미터 포함 |
| 초대 목록 조회 | `GET /api/households/[id]/invitations` | ✅ | `초대_목록을_불러온다` |
| 초대 취소(revoke) | `DELETE /api/households/[id]/invitations/[iid]` | ✅ | `초대를_취소_한다` |
| 초대 링크 수락 | `POST /api/invitations/[token]/accept` | ✅ | route handler 존재, 수락 UI 미구현 |
| 초대 토큰 조회 | `GET /api/invitations/[token]` | ✅ | route handler 존재 |

---

## 거점 유형 정의

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 거점 유형 목록 조회 | `GET /api/household-kind-definitions` | ✅ | `DashboardContext` → `listKinds()` |
| 거점 유형 저장 (추가/수정/삭제/정렬) | `PUT /api/household-kind-definitions` | ✅ | `거점_유형_정의를_교체_한다` → `saveKinds()` |

---

## 카테고리

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 카테고리 목록 조회 | `GET /api/households/[id]/categories` | ✅ | `dashboard-api.service.ts` `loadCatalogFromApi`에서 API 호출 |
| 카테고리 단건 조회 | `GET /api/households/[id]/categories/[cid]` | ⬜ | 단건 조회 UI 없음 (목록 기반 운영) |
| 카테고리 생성 | `POST /api/households/[id]/categories` | ✅ | `DashboardContext` `syncCatalogDiff`에서 diff 감지 시 POST |
| 카테고리 수정 | `PUT /api/households/[id]/categories/[cid]` | ✅ | `DashboardContext` `syncCatalogDiff`에서 diff 감지 시 PUT |
| 카테고리 삭제 | `DELETE /api/households/[id]/categories/[cid]` | ✅ | `DashboardContext` `syncCatalogDiff`에서 diff 감지 시 DELETE |
| 다른 거점 카테고리 가져오기 | `POST /api/households/[id]/categories/copy` | ⬜ | 가져오기 UI 없음 (1차 범위 외) |

---

## 방 / 집 구조

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 방 목록 조회 | `GET /api/households/[id]/rooms` | 🚧 | `dashboard-api.service`가 rooms를 localStorage에서 가져옴 (공간 데이터 포함 불일치) |
| 방 동기화 | `PUT /api/households/[id]/rooms/sync` | 🚧 | `거점을_갱신_한다` API 미호출 (공간 편집기 UI와 백엔드 모델 불일치) |
| 집 구조 조회 | `GET /api/households/[id]/house-structure` | 🚧 | route handler 있음, context 미연결 (공간 편집기 UI 개발 후 연결 필요) |
| 집 구조 저장 | `PUT /api/households/[id]/house-structure` | 🚧 | route handler 있음, context 미연결 |

---

## 가구 배치

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 가구 목록 조회 | `GET /api/households/[id]/rooms/[rid]/furniture-placements` | ✅ | `dashboard-api.service.ts` `loadFurniturePlacementsFromApi`에서 방별 API 호출 |
| 가구 생성 | `POST /api/households/[id]/rooms/[rid]/furniture-placements` | 🚧 | route handler 있음, 가구 편집 write-through 미구현 |
| 가구 수정 | `PUT /api/households/[id]/furniture-placements/[fid]` | 🚧 | route handler 있음, 가구 편집 write-through 미구현 |
| 가구 삭제 | `DELETE /api/households/[id]/furniture-placements/[fid]` | 🚧 | route handler 있음, 가구 편집 write-through 미구현 |

---

## 보관 장소

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 보관장소 목록 조회 | `GET /api/households/[id]/storage-locations` | ✅ | `dashboard-api.service.ts` `loadStorageLocationsFromApi`에서 API 호출 |
| 보관장소 생성 | `POST /api/households/[id]/storage-locations` | 🚧 | route handler 있음, write-through 미구현 |
| 보관장소 수정 | `PUT /api/households/[id]/storage-locations/[sid]` | 🚧 | route handler 있음, write-through 미구현 |
| 보관장소 삭제 | `DELETE /api/households/[id]/storage-locations/[sid]` | 🚧 | route handler 있음, write-through 미구현 |

---

## 단위

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 단위 목록 조회 | `GET /api/households/[id]/units` | ✅ | `loadCatalogFromApi`에서 API 호출 |
| 단위 단건 조회 | `GET /api/households/[id]/units/[uid]` | ⬜ | 단건 조회 UI 없음 (목록 기반 운영) |
| 단위 생성 | `POST /api/households/[id]/units` | ✅ | `syncCatalogDiff`에서 diff 감지 시 POST |
| 단위 수정 | `PUT /api/households/[id]/units/[uid]` | ✅ | `syncCatalogDiff`에서 diff 감지 시 PUT |
| 단위 삭제 | `DELETE /api/households/[id]/units/[uid]` | ✅ | `syncCatalogDiff`에서 diff 감지 시 DELETE |
| 다른 거점 단위 가져오기 | `POST /api/households/[id]/units/copy` | ⬜ | 가져오기 UI 없음 (1차 범위 외) |

---

## 상품 / 상품 용량·변형

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 상품 목록 조회 | `GET /api/households/[id]/products` | ✅ | `loadCatalogFromApi`에서 API 호출 |
| 상품 단건 조회 | `GET /api/households/[id]/products/[pid]` | ⬜ | 단건 조회 UI 없음 (목록 기반 운영) |
| 상품 생성 | `POST /api/households/[id]/products` | ✅ | `syncCatalogDiff`에서 diff 감지 시 POST |
| 상품 수정 | `PUT /api/households/[id]/products/[pid]` | ✅ | `syncCatalogDiff`에서 diff 감지 시 PUT |
| 상품 삭제 | `DELETE /api/households/[id]/products/[pid]` | ✅ | `syncCatalogDiff`에서 diff 감지 시 DELETE |
| 다른 거점 상품 가져오기 | `POST /api/households/[id]/products/copy` | ⬜ | 가져오기 UI 없음 (1차 범위 외) |
| 상품 변형 목록 조회 | `GET /api/households/[id]/products/[pid]/variants` | ✅ | `loadCatalogFromApi`에서 상품별 variant API 병렬 호출 |
| 상품 변형 단건 조회 | `GET /api/households/[id]/products/[pid]/variants/[vid]` | ⬜ | 단건 조회 UI 없음 (목록 기반 운영) |
| 상품 변형 생성 | `POST /api/households/[id]/products/[pid]/variants` | ✅ | `syncCatalogDiff`에서 diff 감지 시 POST |
| 상품 변형 수정 | `PUT /api/households/[id]/products/[pid]/variants/[vid]` | ✅ | `syncCatalogDiff`에서 diff 감지 시 PUT |
| 상품 변형 삭제 | `DELETE /api/households/[id]/products/[pid]/variants/[vid]` | ✅ | `syncCatalogDiff`에서 diff 감지 시 DELETE |

---

## 재고 품목

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 재고 품목 목록 조회 | `GET /api/households/[id]/inventory-items` | 🚧 | `dashboard-api.service`가 items를 여전히 localStorage에서 가져옴 (API 연결 필요) |
| 재고 품목 등록 | `POST /api/households/[id]/inventory-items` | 🚧 | route handler 있음, `DashboardContext`에서 미호출 |
| 재고 수량 수정 | `PATCH /api/households/[id]/inventory-items/[iid]/quantity` | 🚧 | route handler 있음, context 미연결 |

---

## 구매 기록

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 구매 목록 조회 | `GET /api/households/[id]/purchases` | ✅ | `PurchasesContext` api 모드에서 `loadPurchasesFromApi` 호출 |
| 구매 등록 (로트 포함) | `POST /api/households/[id]/purchases` | ✅ | `구매를_추가_한다`에서 api 모드 시 POST |
| 재고 나중에 연결 | `PATCH /api/households/[id]/purchases/[pid]/link-inventory` | 🚧 | route handler 있음, context 미연결 |

---

## 로트

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 로트 목록 조회 | `GET /api/households/[id]/batches` | 🚧 | route handler 있음, context 미연결 |
| 유통기한 임박 목록 | `GET /api/households/[id]/batches/expiring` | 🚧 | route handler 있음, context 미연결 |
| 만료된 목록 | `GET /api/households/[id]/batches/expired` | 🚧 | route handler 있음, context 미연결 |

---

## 재고 변경 이력

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 재고 변경 이력 조회 | `GET /api/households/[id]/inventory-items/[iid]/logs` | 🚧 | route handler 있음, `InventoryHistoryContext`가 mock 고정 데이터 사용 |
| 소비 기록 등록 | `POST /api/households/[id]/inventory-items/[iid]/logs/consumption` | ✅ | `재고_소비를_기록_한다`에서 api 모드 시 POST |
| 폐기 기록 등록 | `POST /api/households/[id]/inventory-items/[iid]/logs/waste` | ✅ | `재고_폐기를_기록_한다`에서 api 모드 시 POST |
| 수량 수동 조정 | `POST /api/households/[id]/inventory-items/[iid]/logs/adjustment` | 🚧 | route handler 있음, context 미연결 |

---

## 장보기 항목

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 장보기 항목 목록 조회 | `GET /api/households/[id]/shopping-list-items` | ✅ | api 모드 시 `syncShoppingListFromApi` 호출, localStorage 동기화 |
| 장보기 항목 추가 | `POST /api/households/[id]/shopping-list-items` | ✅ | `ShoppingListQuickAddFromCatalogModal.handleAdd`에서 api 모드 시 POST |
| 장보기 항목 수정 | `PUT /api/households/[id]/shopping-list-items/[sid]` | ✅ | `updateSavedRestock`에서 api 모드 시 PUT |
| 장보기 항목 삭제 | `DELETE /api/households/[id]/shopping-list-items/[sid]` | ✅ | `removeSaved`에서 api 모드 시 DELETE |
| 장보기 항목 구매 완료 처리 | `POST /api/households/[id]/shopping-list-items/[sid]/complete` | ✅ | `completeSaved`에서 api 모드 시 POST |
| 부족 품목 자동 제안 | — | ✅ | 프론트에서 재고 API 응답값 기준으로 토스트/모달 처리 (별도 API 불필요) |
| 유통기한 임박 품목 자동 제안 | — | ✅ | 프론트에서 배치 API 응답값 기준으로 토스트/모달 처리 (별도 API 불필요) |

---

## 알림 설정

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 알림 설정 목록 조회 | `GET /api/notification-preferences` | ✅ | `SettingsContext` api 모드 시 `loadSettingsFromApi` 호출 |
| 알림 설정 저장 | `POST /api/notification-preferences` | ✅ | `settings` 변경 감지 시 api 모드에서 POST/PUT |
| 알림 설정 수정 | `PUT /api/notification-preferences/[id]` | ✅ | `settings` 변경 감지 시 api 모드에서 notificationPrefIdRef 기반 PUT |
| 알림 설정 삭제 | `DELETE /api/notification-preferences/[id]` | ⬜ | 설정 삭제 UI 없음 (설정 수정만 지원) |

---

## 알림

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 유통기한 임박 알림 (스케줄러) | — | ✅ | 백엔드 `NotificationScheduler` 구현됨 (매일 오전 9시). 프론트는 `GET /api/notifications`로 조회만 |
| 부족 재고 알림 (스케줄러) | — | ✅ | 백엔드 `NotificationScheduler` 구현됨 (매일 오전 9시). 프론트는 `GET /api/notifications`로 조회만 |
| 알림 목록 조회 | `GET /api/notifications` | ✅ | `NotificationCenterModal`이 열릴 때 api 모드 시 `loadNotificationsFromApi` 호출 |
| 알림 읽음 처리 | `PATCH /api/notifications/[id]/read` | ✅ | `읽음_처리_한다`에서 api 모드 시 PATCH |

---

## 만료 알림 설정

| 기능 | API 라우트 | 상태 | 비고 |
|------|-----------|------|------|
| 만료 알림 규칙 목록 조회 | `GET /api/households/[id]/expiration-alert-rules` | ✅ | `SettingsContext` api 모드 시 `loadSettingsFromApi`에서 규칙 조회 |
| 만료 알림 규칙 저장 | `POST /api/households/[id]/expiration-alert-rules` | ✅ | `만료_규칙을_저장한다`에서 api 모드 시 POST |
| 만료 알림 규칙 수정 | `PUT /api/households/[id]/expiration-alert-rules/[rid]` | ✅ | `만료_규칙을_저장한다`에서 id 있을 때 api 모드에서 PUT |
| 만료 알림 규칙 삭제 | `DELETE /api/households/[id]/expiration-alert-rules/[rid]` | ✅ | `만료_규칙을_삭제한다`에서 api 모드 시 DELETE |

---

## 연결 제외 (P3)

| 기능 | 상태 | 비고 |
|------|------|------|
| 태그 CRUD / 상품 태그 | ⬜ | 1차 개발 범위 외 |
| 리포트 설정 CRUD | ⬜ | 1차 개발 범위 외 |

---

## 연결 현황 요약

| 상태 | 항목 수 | 내용 |
|------|---------|------|
| ✅ 완료 | 인프라 6, 사용자 8, 거점 7, 거점초대 6, 거점유형 2, 카테고리 4, 단위 4, 상품 4, 변형 4, 가구조회 1, 보관장소조회 1, 구매 2, 소비/폐기이력 2, 장보기 5, 알림 2, 알림설정 3, 만료규칙 4, 장보기자동제안 2, 스케줄러 2 | **총 73항목** |
| 🚧 미연결 | 방/구조 4, 가구CUD 3, 보관장소CUD 3, 재고품목 3, 로트 3, 재고이력조회 1, 이력수동조정 1, 구매재고연결 1, 알림설정삭제 없음→⬜ | **총 ~15항목** |
| ⬜ 개발 전 | 태그, 리포트 설정, 단건조회 UI, copy UI, 알림설정삭제 UI | **~7항목** |

### 잔여 미연결 원인

| 원인 | 해당 기능 |
|------|-----------|
| 방/공간 편집기와 백엔드 모델 불일치 | 방 목록 조회·동기화, 집 구조 조회·저장 (4항목) |
| 가구·보관장소 write-through 미구현 | 가구 CUD, 보관장소 CUD (6항목) |
| 재고 품목 API 연결 미완료 | 재고 품목 목록·등록·수량수정 (3항목) |
| 로트 별도 조회 미연결 | 로트 목록·유통기한임박·만료 (3항목) |
| 이력 조회 API 미연결 | 재고 이력 조회·수동조정 (2항목) |

---

## 다음 연결 우선순위

1. **재고 품목** — `dashboard-api.service.ts`에서 inventory-items API 로드 추가
2. **로트** — `PurchasesContext` 또는 별도 컨텍스트에서 batches API 연결
3. **이력 조회** — `InventoryHistoryContext`에서 API 기반 로드 추가
4. **방/구조** — 공간 편집기 UI와 백엔드 Room 모델 정합성 해결 후 연결
5. **가구·보관장소 CUD** — 공간 편집기에서 write-through 추가

---

*본 문서는 API 연결 작업 진행에 따라 수동으로 업데이트합니다.*
