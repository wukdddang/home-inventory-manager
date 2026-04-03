# 백엔드 API E2E 유즈케이스 시나리오

**최초 작성**: 2026-04-01
**갱신**: 2026-04-03 — v2.7 가전/설비 관리 유즈케이스 추가
**기준**: feature-checklist.md v2.7, api-connection-checklist.md, entity-logical-design.md

백엔드 API 단위 E2E 테스트를 위한 유즈케이스 시나리오입니다.
각 항목은 HTTP 요청 → 응답 검증 관점에서 작성했으며, 테스트 케이스명으로 바로 사용할 수 있도록 "~한다" 형태입니다.

범례:

- **검증**: `[ ]` 미검증 | `[x]` 검증 완료 | `[!]` 이슈 발견
- **구현**: `O` 엔드포인트 구현됨 | `X` 미구현

---

## BUC-01. 인증 및 사용자 관리

> **목적**: 회원가입 → 이메일 인증 → 로그인 → 토큰 갱신 → 비밀번호 변경 → 로그아웃 흐름 검증
> **엔드포인트**: `POST /auth/signup`, `GET /auth/verify-email`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`, `PATCH /auth/password`, `POST /auth/logout`

**사전 조건**: 없음

### 1-A. 회원가입 및 이메일 인증


| #   | 테스트 케이스                                                         | 구현  | 검증  |
| --- | --------------------------------------------------------------- | --- | --- |
| 1   | `POST /auth/signup` — 이메일·비밀번호·이름으로 가입하면 201과 사용자 정보를 반환한다      | O   | [ ] |
| 2   | `POST /auth/signup` — 이미 등록된 이메일로 가입하면 409 Conflict를 반환한다        | O   | [ ] |
| 3   | `POST /auth/signup` — 필수 필드 누락 시 400 Bad Request를 반환한다          | O   | [ ] |
| 4   | `GET /auth/verify-email?token=` — 유효한 토큰으로 인증하면 이메일 인증이 완료된다    | O   | [ ] |
| 5   | `GET /auth/verify-email?token=` — 만료된 토큰으로 인증하면 실패 응답을 반환한다     | O   | [ ] |
| 6   | `GET /auth/verify-email` — 토큰 없이 요청하면 400을 반환한다                 | O   | [ ] |


### 1-B. 로그인 및 토큰 관리


| #   | 테스트 케이스                                                                    | 구현  | 검증  |
| --- | ---------------------------------------------------------------------------- | --- | --- |
| 7   | `POST /auth/login` — 올바른 자격 증명으로 로그인하면 accessToken과 refreshToken을 반환한다       | O   | [ ] |
| 8   | `POST /auth/login` — 잘못된 비밀번호로 로그인하면 401 Unauthorized를 반환한다                  | O   | [ ] |
| 9   | `POST /auth/login` — 존재하지 않는 이메일로 로그인하면 401을 반환한다                            | O   | [ ] |
| 10  | `POST /auth/refresh` — 유효한 refreshToken으로 새 accessToken을 발급한다               | O   | [ ] |
| 11  | `POST /auth/refresh` — 만료된 refreshToken으로 요청하면 401을 반환한다                    | O   | [ ] |
| 12  | `GET /auth/me` — 유효한 accessToken으로 사용자 프로필(이름, 이메일)을 반환한다                  | O   | [ ] |
| 13  | `GET /auth/me` — accessToken 없이 요청하면 401을 반환한다                              | O   | [ ] |


### 1-C. 비밀번호 변경 및 로그아웃


| #   | 테스트 케이스                                                        | 구현  | 검증  |
| --- | -------------------------------------------------------------- | --- | --- |
| 14  | `PATCH /auth/password` — 현재 비밀번호와 새 비밀번호를 제출하면 비밀번호가 변경된다       | O   | [ ] |
| 15  | `PATCH /auth/password` — 현재 비밀번호가 틀리면 400/401을 반환한다             | O   | [ ] |
| 16  | 비밀번호 변경 후 기존 비밀번호로 로그인하면 실패한다                                  | O   | [ ] |
| 17  | `POST /auth/logout` — 로그아웃하면 세션이 무효화된다                           | O   | [ ] |


---

## BUC-02. 거점(Household) 관리

> **목적**: 거점 CRUD 및 멤버십 기본 검증
> **엔드포인트**: `POST/GET/PUT/DELETE /households`, `GET /households/:id`
> **가드**: `JwtAuthGuard`, `HouseholdMemberGuard`

**사전 조건**: BUC-01 완료 (인증된 사용자)


| #   | 테스트 케이스                                                                   | 구현  | 검증  |
| --- | --------------------------------------------------------------------------- | --- | --- |
| 1   | `POST /households` — 이름과 유형을 지정하여 거점을 생성하면 201과 거점 정보를 반환한다                | O   | [ ] |
| 2   | `POST /households` — 생성자는 자동으로 admin 역할의 멤버로 등록된다                           | O   | [ ] |
| 3   | `GET /households` — 현재 사용자의 거점 목록을 반환한다                                     | O   | [ ] |
| 4   | `GET /households/:id` — 거점 상세 정보를 반환한다                                      | O   | [ ] |
| 5   | `GET /households/:id` — 멤버가 아닌 거점에 접근하면 403 Forbidden을 반환한다                 | O   | [ ] |
| 6   | `PUT /households/:id` — 거점 이름과 유형을 수정한다                                     | O   | [ ] |
| 7   | `PUT /households/:id` — admin이 아닌 멤버가 수정하면 403을 반환한다                        | O   | [ ] |
| 8   | `DELETE /households/:id` — admin이 거점을 삭제하면 하위 데이터가 정리된다                     | O   | [ ] |
| 9   | `DELETE /households/:id` — admin이 아닌 멤버가 삭제하면 403을 반환한다                     | O   | [ ] |


---

## BUC-03. 거점 유형 정의(HouseholdKindDefinition)

> **목적**: 사용자별 거점 유형 라벨·정렬 CRUD 검증
> **엔드포인트**: `GET/PUT /household-kind-definitions`
> **가드**: `JwtAuthGuard`

**사전 조건**: BUC-01 완료


| #   | 테스트 케이스                                                                    | 구현  | 검증  |
| --- | ---------------------------------------------------------------------------- | --- | --- |
| 1   | `GET /household-kind-definitions` — 기본 4종(home, office, vehicle, other)을 반환한다 | O   | [ ] |
| 2   | `PUT /household-kind-definitions` — 사용자 정의 유형을 추가하여 저장한다                    | O   | [ ] |
| 3   | `PUT /household-kind-definitions` — 기존 유형의 라벨·정렬 순서를 변경하여 저장한다              | O   | [ ] |
| 4   | `PUT /household-kind-definitions` — 유형을 삭제(목록에서 제외)하여 저장한다                  | O   | [ ] |


---

## BUC-04. 거점 초대 및 멤버 관리

> **목적**: 초대 링크 생성 → 수락 → 멤버 역할 변경 → 멤버 제거 흐름 검증
> **엔드포인트**: `/households/:id/invitations`, `/invitations/:token`, `/households/:id/members`
> **가드**: `JwtAuthGuard`, `HouseholdMemberGuard`, `RolesGuard`

**사전 조건**: BUC-02 완료 (거점 존재, 2명의 사용자)

### 4-A. 초대


| #   | 테스트 케이스                                                                     | 구현  | 검증  |
| --- | ----------------------------------------------------------------------------- | --- | --- |
| 1   | `POST /households/:id/invitations` — 역할과 만료 시각을 지정하여 초대를 생성하면 토큰을 반환한다       | O   | [ ] |
| 2   | `GET /households/:id/invitations` — 보낸 초대 목록을 조회한다                              | O   | [ ] |
| 3   | `GET /invitations/:token` — 초대 토큰으로 초대 정보(거점명, 역할)를 확인한다                      | O   | [ ] |
| 4   | `POST /invitations/:token/accept` — 초대를 수락하면 거점 멤버로 가입된다                      | O   | [ ] |
| 5   | `POST /invitations/:token/accept` — 이미 수락한 초대를 다시 수락하면 400을 반환한다              | O   | [ ] |
| 6   | `POST /invitations/:token/accept` — 만료된 초대를 수락하면 400/410을 반환한다                | O   | [ ] |
| 7   | `DELETE /households/:id/invitations/:invId` — 초대를 취소(revoke)한다                 | O   | [ ] |


### 4-B. 멤버 역할 및 제거


| #   | 테스트 케이스                                                                         | 구현  | 검증  |
| --- | --------------------------------------------------------------------------------- | --- | --- |
| 8   | `GET /households/:id/members` — 멤버 목록과 각 역할을 반환한다                                 | O   | [ ] |
| 9   | `PATCH /households/:id/members/:memberId/role` — admin이 멤버의 역할을 변경한다(editor→viewer) | O   | [ ] |
| 10  | `PATCH /households/:id/members/:memberId/role` — admin이 아닌 멤버가 역할 변경을 시도하면 403을 반환한다 | O   | [ ] |
| 11  | `DELETE /households/:id/members/:memberId` — admin이 멤버를 거점에서 제거한다                  | O   | [ ] |
| 12  | 제거된 멤버가 해당 거점 API에 접근하면 403을 반환한다                                                | O   | [ ] |


---

## BUC-05. 집 구조 관리 (방 · 가구 · 보관장소)

> **목적**: 방 동기화 → 집 구조도 저장/조회 → 가구 배치 → 보관장소 등록 흐름 검증
> **엔드포인트**: `/households/:id/rooms`, `/households/:id/house-structure`, `/households/:id/rooms/:roomId/furniture-placements`, `/households/:id/storage-locations`

**사전 조건**: BUC-02 완료 (거점 존재)

### 5-A. 방 및 집 구조


| #   | 테스트 케이스                                                                      | 구현  | 검증  |
| --- | ------------------------------------------------------------------------------ | --- | --- |
| 1   | `PUT /households/:id/rooms/sync` — 방 목록을 동기화하면 추가·수정·삭제가 반영된다                  | O   | [ ] |
| 2   | `GET /households/:id/rooms` — 방 목록을 조회한다                                       | O   | [ ] |
| 3   | `PUT /households/:id/house-structure` — 구조도(레이아웃 JSON)를 저장한다                    | O   | [ ] |
| 4   | `GET /households/:id/house-structure` — 구조도를 조회하면 저장된 레이아웃이 반환된다               | O   | [ ] |


### 5-B. 가구 배치


| #   | 테스트 케이스                                                                        | 구현  | 검증  |
| --- | -------------------------------------------------------------------------------- | --- | --- |
| 5   | `POST /households/:id/rooms/:roomId/furniture-placements` — 방에 가구를 추가한다          | O   | [ ] |
| 6   | `GET /households/:id/rooms/:roomId/furniture-placements` — 방별 가구 목록을 조회한다        | O   | [ ] |
| 7   | `PUT /households/:id/furniture-placements/:fpId` — 가구의 앵커(소속 방)를 변경한다            | O   | [ ] |
| 8   | `DELETE /households/:id/furniture-placements/:fpId` — 가구를 삭제하면 하위 보관장소도 정리된다     | O   | [ ] |


### 5-C. 보관장소


| #   | 테스트 케이스                                                                        | 구현  | 검증  |
| --- | -------------------------------------------------------------------------------- | --- | --- |
| 9   | `POST /households/:id/storage-locations` — 가구 아래 또는 방 직속 보관장소를 생성한다              | O   | [ ] |
| 10  | `GET /households/:id/storage-locations` — 전체 보관장소 목록을 조회한다                        | O   | [ ] |
| 11  | `PUT /households/:id/storage-locations/:slId` — 보관장소 이름을 수정한다                     | O   | [ ] |
| 12  | `DELETE /households/:id/storage-locations/:slId` — 보관장소를 삭제한다                     | O   | [ ] |


---

## BUC-06. 카탈로그 관리 (카테고리 · 단위 · 품목 · 변형)

> **목적**: 거점별 카탈로그 CRUD 검증. 각 엔티티는 `householdId`로 스코핑된다.
> **엔드포인트**: `/households/:id/categories`, `/households/:id/units`, `/households/:id/products`, `/households/:id/products/:pId/variants`

**사전 조건**: BUC-02 완료 (거점 존재)

### 6-A. 카테고리


| #   | 테스트 케이스                                                              | 구현  | 검증  |
| --- | -------------------------------------------------------------------- | --- | --- |
| 1   | `POST /households/:id/categories` — 카테고리를 생성하면 201을 반환한다              | O   | [ ] |
| 2   | `GET /households/:id/categories` — 카테고리 목록을 조회한다                       | O   | [ ] |
| 3   | `PUT /households/:id/categories/:catId` — 카테고리 이름을 수정한다                | O   | [ ] |
| 4   | `DELETE /households/:id/categories/:catId` — 카테고리를 삭제한다                | O   | [ ] |
| 5   | 삭제된 카테고리에 속한 품목의 처리를 확인한다 (cascade 또는 orphan)                        | O   | [ ] |


### 6-B. 단위


| #   | 테스트 케이스                                                        | 구현  | 검증  |
| --- | -------------------------------------------------------------- | --- | --- |
| 6   | `POST /households/:id/units` — 기호·이름으로 단위를 생성한다                 | O   | [ ] |
| 7   | `GET /households/:id/units` — 단위 목록을 조회한다                        | O   | [ ] |
| 8   | `PUT /households/:id/units/:unitId` — 단위 기호·이름을 수정한다             | O   | [ ] |
| 9   | `DELETE /households/:id/units/:unitId` — 단위를 삭제한다                | O   | [ ] |


### 6-C. 품목


| #   | 테스트 케이스                                                                   | 구현  | 검증  |
| --- | --------------------------------------------------------------------------- | --- | --- |
| 10  | `POST /households/:id/products` — 카테고리·이름·소비재 여부를 입력하여 품목을 생성한다            | O   | [ ] |
| 11  | `GET /households/:id/products` — 품목 목록을 조회한다                                 | O   | [ ] |
| 12  | `PUT /households/:id/products/:prodId` — 품목 정보(이름, 카테고리, 설명, 이미지)를 수정한다     | O   | [ ] |
| 13  | `DELETE /households/:id/products/:prodId` — 품목을 삭제하면 하위 변형도 함께 삭제된다          | O   | [ ] |


### 6-D. 변형(용량·포장)


| #   | 테스트 케이스                                                                               | 구현  | 검증  |
| --- | ------------------------------------------------------------------------------------- | --- | --- |
| 14  | `POST /households/:id/products/:pId/variants` — 단위·용량·라벨을 입력하여 변형을 생성한다               | O   | [ ] |
| 15  | `GET /households/:id/products/:pId/variants` — 품목별 변형 목록을 조회한다                           | O   | [ ] |
| 16  | `PUT /households/:id/products/:pId/variants/:vId` — 변형 정보(단위, 용량, 라벨)를 수정한다             | O   | [ ] |
| 17  | `DELETE /households/:id/products/:pId/variants/:vId` — 변형을 삭제한다                          | O   | [ ] |


---

## BUC-07. 재고 등록 및 수량 관리

> **목적**: 재고 품목 등록 → 수량 직접 설정 → 재고 이력 자동 생성 검증
> **엔드포인트**: `/households/:id/inventory-items`, `PATCH .../inventory-items/:id/quantity`

**사전 조건**: BUC-05 + BUC-06 완료 (보관장소, 품목·변형 존재)


| #   | 테스트 케이스                                                                              | 구현  | 검증  |
| --- | ------------------------------------------------------------------------------------ | --- | --- |
| 1   | `POST /households/:id/inventory-items` — 변형·보관장소·최소 재고 기준을 지정하여 재고를 등록한다              | O   | [ ] |
| 2   | `GET /households/:id/inventory-items` — 재고 품목 목록을 조회한다                                  | O   | [ ] |
| 3   | `PATCH /households/:id/inventory-items/:itemId/quantity` — 수량을 직접 설정하면 현재 수량이 변경된다      | O   | [ ] |
| 4   | 수량 직접 설정 시 InventoryLog에 adjustment 레코드가 자동 생성됨을 확인한다                                 | O   | [ ] |


---

## BUC-08. 재고 변경 이력 (소비 · 폐기 · 수동 조정)

> **목적**: 재고 차감/조정 시 이력 기록 및 수량 반영 검증
> **엔드포인트**: `.../inventory-items/:itemId/logs`, `.../logs/consumption`, `.../logs/waste`, `.../logs/adjustment`

**사전 조건**: BUC-07 완료 (재고 존재, 수량 > 0)


| #   | 테스트 케이스                                                                                  | 구현  | 검증  |
| --- | ------------------------------------------------------------------------------------------ | --- | --- |
| 1   | `POST .../logs/consumption` — 소비를 기록하면 수량이 감소하고 type=out 이력이 생성된다                          | O   | [ ] |
| 2   | `POST .../logs/waste` — 폐기 사유와 함께 기록하면 수량이 감소하고 type=waste 이력이 생성된다                       | O   | [ ] |
| 3   | `POST .../logs/adjustment` — 수동 조정을 기록하면 수량이 변경되고 type=adjust 이력이 생성된다                    | O   | [ ] |
| 4   | `GET .../logs` — 재고 변경 이력 목록을 조회하면 type·quantityDelta·reason이 포함된다                         | O   | [ ] |
| 5   | `GET .../logs` — 기간 필터(startDate, endDate)로 이력을 조회한다                                       | O   | [ ] |


---

## BUC-09. 구매 기록 및 재고 연결

> **목적**: 구매 등록(재고 연결/미연결) → 재고 자동 반영 → 나중에 연결 흐름 검증
> **엔드포인트**: `/households/:id/purchases`, `PATCH .../purchases/:id/link-inventory`

**사전 조건**: BUC-07 완료 (재고 존재)

### 9-A. 구매 등록 (재고 연결)


| #   | 테스트 케이스                                                                          | 구현  | 검증  |
| --- | ---------------------------------------------------------------------------------- | --- | --- |
| 1   | `POST /households/:id/purchases` — 재고와 연결하여 구매를 등록하면 201을 반환한다 (단가·구매처·유통기한 포함)  | O   | [ ] |
| 2   | 재고 연결 구매 등록 시 재고 수량이 자동으로 증가하고 type=in 이력이 생성됨을 확인한다                              | O   | [ ] |
| 3   | `GET /households/:id/purchases` — 구매 목록을 조회하면 스냅샷 필드(itemName, variantCaption)가 포함된다 | O   | [ ] |


### 9-B. 구매 등록 (재고 미연결 → 나중에 연결)


| #   | 테스트 케이스                                                                               | 구현  | 검증  |
| --- | ------------------------------------------------------------------------------------- | --- | --- |
| 4   | `POST /households/:id/purchases` — inventoryItemId 없이 구매를 등록한다 (deferred)               | O   | [ ] |
| 5   | 미연결 구매는 inventoryItemId가 null임을 확인한다                                                   | O   | [ ] |
| 6   | `PATCH /households/:id/purchases/:purchaseId/link-inventory` — 구매에 재고를 나중에 연결한다         | O   | [ ] |
| 7   | 재고 연결 후 재고 수량이 증가함을 확인한다                                                               | O   | [ ] |


---

## BUC-10. 구매 로트(PurchaseBatch) 및 유통기한 관리

> **목적**: 로트 조회 및 유통기한 임박/만료 필터 검증
> **엔드포인트**: `/households/:id/batches`, `.../batches/expiring`, `.../batches/expired`

**사전 조건**: BUC-09 완료 (유통기한 포함 구매 기록 존재)


| #   | 테스트 케이스                                                                    | 구현  | 검증  |
| --- | ---------------------------------------------------------------------------- | --- | --- |
| 1   | `GET /households/:id/batches` — 로트 목록을 조회하면 유통기한 정보가 포함된다                     | O   | [ ] |
| 2   | `GET /households/:id/batches/expiring` — 유통기한 임박 로트 목록을 반환한다                   | O   | [ ] |
| 3   | `GET /households/:id/batches/expired` — 이미 만료된 로트 목록을 반환한다                     | O   | [ ] |


---

## BUC-11. 장보기 항목 관리

> **목적**: 장보기 항목 CRUD + 구매 완료(atomic) 처리 검증
> **엔드포인트**: `/households/:id/shopping-list-items`, `.../shopping-list-items/:id/complete`

**사전 조건**: BUC-06 완료 (카탈로그 존재)


| #   | 테스트 케이스                                                                             | 구현  | 검증  |
| --- | ----------------------------------------------------------------------------------- | --- | --- |
| 1   | `POST /households/:id/shopping-list-items` — 장보기 항목을 추가한다                             | O   | [ ] |
| 2   | `GET /households/:id/shopping-list-items` — 장보기 항목 목록을 조회한다                            | O   | [ ] |
| 3   | `PUT /households/:id/shopping-list-items/:itemId` — 항목을 수정한다 (수량 변경)                   | O   | [ ] |
| 4   | `DELETE /households/:id/shopping-list-items/:itemId` — 항목을 삭제한다                        | O   | [ ] |
| 5   | `POST .../shopping-list-items/:itemId/complete` — 구매 완료 처리하면 재고 수량이 증가하고 항목이 처리된다    | O   | [ ] |


---

## BUC-12. 알림 설정 및 알림 조회

> **목적**: 알림 설정(기본/거점별 오버라이드) CRUD + 만료 알림 규칙 + 알림 조회/읽음 처리 검증
> **엔드포인트**: `/notification-preferences`, `/households/:id/expiration-alert-rules`, `/notifications`

**사전 조건**: BUC-01 완료 (인증된 사용자), BUC-02 완료 (거점 존재)

### 12-A. 알림 설정


| #   | 테스트 케이스                                                                           | 구현  | 검증  |
| --- | --------------------------------------------------------------------------------- | --- | --- |
| 1   | `GET /notification-preferences` — 사용자의 알림 설정 목록을 조회한다                               | O   | [ ] |
| 2   | `POST /notification-preferences` — 기본 알림 설정을 생성한다 (householdId=null)                | O   | [ ] |
| 3   | `POST /notification-preferences` — 거점별 오버라이드 설정을 생성한다                               | O   | [ ] |
| 4   | `PUT /notification-preferences/:id` — 알림 설정을 수정한다 (마스터 토글 포함)                       | O   | [ ] |
| 5   | `DELETE /notification-preferences/:id` — 알림 설정을 삭제(초기화)한다                            | O   | [ ] |


### 12-B. 만료 알림 규칙


| #   | 테스트 케이스                                                                    | 구현  | 검증  |
| --- | ---------------------------------------------------------------------------- | --- | --- |
| 6   | `POST /households/:id/expiration-alert-rules` — 만료 알림 규칙을 등록한다                | O   | [ ] |
| 7   | `GET /households/:id/expiration-alert-rules` — 규칙 목록을 조회한다                     | O   | [ ] |
| 8   | `PUT /households/:id/expiration-alert-rules/:ruleId` — 규칙을 수정한다                | O   | [ ] |
| 9   | `DELETE /households/:id/expiration-alert-rules/:ruleId` — 규칙을 삭제한다              | O   | [ ] |


### 12-C. 알림 조회 및 읽음 처리


| #   | 테스트 케이스                                                      | 구현  | 검증  |
| --- | ------------------------------------------------------------ | --- | --- |
| 10  | `GET /notifications` — 사용자의 알림 목록을 조회한다                        | O   | [ ] |
| 11  | `PATCH /notifications/:id/read` — 알림을 읽음 처리한다                  | O   | [ ] |


---

## BUC-13. 인가(Authorization) 및 역할 기반 접근 제어

> **목적**: HouseholdMemberGuard, RolesGuard의 접근 제어 동작 검증
> **가드**: `HouseholdMemberGuard`, `RolesGuard` (admin / editor / viewer)

**사전 조건**: BUC-04 완료 (admin, editor, viewer 역할 멤버 존재)


| #   | 테스트 케이스                                                                         | 구현  | 검증  |
| --- | --------------------------------------------------------------------------------- | --- | --- |
| 1   | 멤버가 아닌 사용자가 거점 하위 API에 접근하면 403을 반환한다                                             | O   | [ ] |
| 2   | viewer 역할 멤버가 조회(GET) 엔드포인트에 접근하면 성공한다                                             | O   | [ ] |
| 3   | viewer 역할 멤버가 생성/수정/삭제 엔드포인트에 접근하면 403을 반환한다                                      | O   | [ ] |
| 4   | editor 역할 멤버가 재고·구매·장보기 등 일반 CRUD 엔드포인트에 접근하면 성공한다                                | O   | [ ] |
| 5   | editor 역할 멤버가 멤버 관리·초대·거점 삭제 엔드포인트에 접근하면 403을 반환한다                                | O   | [ ] |
| 6   | admin 역할 멤버가 모든 엔드포인트에 접근하면 성공한다                                                   | O   | [ ] |


---

## BUC-14. 가전/설비 관리 (Appliance) — v2.7 신규

> **목적**: 가전 등록 → 조회 → 수정 → 폐기 처리 흐름 검증
> **엔드포인트**: `/households/:id/appliances`, `/households/:id/appliances/:appId`
> **가드**: `JwtAuthGuard`, `HouseholdMemberGuard`

**사전 조건**: BUC-02 완료 (거점 존재), BUC-05 완료 (방 존재, 선택)


| #   | 테스트 케이스                                                                                           | 구현  | 검증  |
| --- | --------------------------------------------------------------------------------------------------- | --- | --- |
| 1   | `POST /households/:id/appliances` — 이름·브랜드·모델명·구매일·보증 만료일·설치 위치를 입력하여 가전을 등록하면 201을 반환한다            | X   | [ ] |
| 2   | `POST /households/:id/appliances` — 필수 필드(이름) 누락 시 400을 반환한다                                        | X   | [ ] |
| 3   | `GET /households/:id/appliances` — 거점의 가전 목록을 조회한다 (기본: 활성 가전만)                                      | X   | [ ] |
| 4   | `GET /households/:id/appliances?status=retired` — 폐기된 가전 목록을 조회한다                                    | X   | [ ] |
| 5   | `GET /households/:id/appliances/:appId` — 가전 상세 정보(보증 만료일, 유지보수 스케줄 수 등)를 반환한다                       | X   | [ ] |
| 6   | `PUT /households/:id/appliances/:appId` — 가전 정보(이름, 브랜드, 모델명, 설치 위치 등)를 수정한다                         | X   | [ ] |
| 7   | `PATCH /households/:id/appliances/:appId/retire` — 가전을 폐기 처리하면 status가 retired로 변경된다                  | X   | [ ] |
| 8   | `GET /households/:id/appliances/:appId` — 멤버가 아닌 사용자가 접근하면 403을 반환한다                                  | X   | [ ] |


---

## BUC-15. 유지보수 스케줄 관리 (MaintenanceSchedule) — v2.7 신규

> **목적**: 가전별 유지보수 반복 스케줄 등록 → 조회 → 수정 → 비활성화 흐름 검증
> **엔드포인트**: `/households/:id/appliances/:appId/maintenance-schedules`
> **가드**: `JwtAuthGuard`, `HouseholdMemberGuard`

**사전 조건**: BUC-14 완료 (가전 존재)


| #   | 테스트 케이스                                                                                                          | 구현  | 검증  |
| --- | ------------------------------------------------------------------------------------------------------------------ | --- | --- |
| 1   | `POST .../maintenance-schedules` — 작업명·반복 규칙(recurrenceRule)·시작일을 입력하여 스케줄을 생성하면 201을 반환한다                          | X   | [ ] |
| 2   | `POST .../maintenance-schedules` — 잘못된 recurrenceRule(frequency 누락 등)로 생성하면 400을 반환한다                                | X   | [ ] |
| 3   | `GET .../maintenance-schedules` — 가전의 유지보수 스케줄 목록을 조회한다                                                            | X   | [ ] |
| 4   | `PUT .../maintenance-schedules/:schedId` — 스케줄의 작업명·반복 규칙·다음 예정일을 수정한다                                              | X   | [ ] |
| 5   | `PATCH .../maintenance-schedules/:schedId/deactivate` — 스케줄을 비활성화하면 isActive가 false로 변경된다                             | X   | [ ] |
| 6   | 비활성화된 스케줄은 알림 대상에서 제외됨을 확인한다                                                                                      | X   | [ ] |


---

## BUC-16. 유지보수·A/S 이력 관리 (MaintenanceLog) — v2.7 신규

> **목적**: 유지보수 이력 등록(정기/비정기) → 조회 → 정기 완료 시 nextOccurrenceAt 갱신 검증
> **엔드포인트**: `/households/:id/appliances/:appId/maintenance-logs`
> **가드**: `JwtAuthGuard`, `HouseholdMemberGuard`

**사전 조건**: BUC-14 + BUC-15 완료 (가전·스케줄 존재)


| #   | 테스트 케이스                                                                                                                     | 구현  | 검증  |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| 1   | `POST .../maintenance-logs` — 정기 유지보수를 완료 기록하면 201을 반환하고 maintenanceScheduleId가 연결된다                                            | X   | [ ] |
| 2   | 정기 유지보수 완료 시 해당 스케줄의 nextOccurrenceAt이 recurrenceRule에 따라 갱신됨을 확인한다                                                           | X   | [ ] |
| 3   | `POST .../maintenance-logs` — 비정기 수리를 기록한다 (type=repair, maintenanceScheduleId=null, 업체명·비용 포함)                                 | X   | [ ] |
| 4   | `POST .../maintenance-logs` — 점검을 기록한다 (type=inspection)                                                                      | X   | [ ] |
| 5   | `GET .../maintenance-logs` — 가전의 유지보수 이력을 시간순으로 조회한다                                                                           | X   | [ ] |
| 6   | `GET .../maintenance-logs` — 유형(type) 필터로 이력을 조회한다                                                                             | X   | [ ] |


---

## BUC-17. 보증 만료 알림 — v2.7 신규

> **목적**: 보증 만료 임박·만료 알림 생성 스케줄러 검증
> **관련**: `@nestjs/schedule` 기반, Notification 엔티티 재활용

**사전 조건**: BUC-14 완료 (보증 만료일이 설정된 가전 존재)


| #   | 테스트 케이스                                                                              | 구현  | 검증  |
| --- | ------------------------------------------------------------------------------------ | --- | --- |
| 1   | 보증 만료 30일 전인 가전에 대해 warranty_expiring_soon 알림이 생성된다                                    | X   | [ ] |
| 2   | 보증 만료 7일 전인 가전에 대해 warranty_expiring_soon 알림이 생성된다                                     | X   | [ ] |
| 3   | 보증 만료일 당일인 가전에 대해 warranty_expired 알림이 생성된다                                             | X   | [ ] |
| 4   | 유지보수 예정일(nextOccurrenceAt)이 오늘인 스케줄에 대해 maintenance_due 알림이 생성된다                        | X   | [ ] |
| 5   | 유지보수 예정일이 N일 초과된 미완료 스케줄에 대해 maintenance_overdue 알림이 생성된다                               | X   | [ ] |
| 6   | status=retired인 가전의 보증·유지보수 알림은 생성되지 않는다                                               | X   | [ ] |


---

## BUC-18. 데이터 무결성 및 에지 케이스

> **목적**: cascade 삭제, 참조 무결성, 경계값 등 백엔드 고유 검증

**사전 조건**: 전체 데이터 세팅 완료


| #   | 테스트 케이스                                                              | 구현  | 검증  |
| --- | -------------------------------------------------------------------- | --- | --- |
| 1   | 카테고리 삭제 시 하위 품목의 처리(cascade/orphan)를 확인한다                             | O   | [ ] |
| 2   | 품목 삭제 시 하위 변형이 cascade 삭제됨을 확인한다                                     | O   | [ ] |
| 3   | 보관장소 삭제 시 연결된 재고 품목의 처리를 확인한다                                        | O   | [ ] |
| 4   | 거점 삭제 시 모든 하위 데이터(방, 가구, 보관장소, 재고, 구매, 로트, 가전, 유지보수)가 정리됨을 확인한다     | O   | [ ] |
| 5   | 이미 삭제된 품목의 구매 기록에서 스냅샷 필드(itemName, variantCaption, unitSymbol)가 유지된다 | O   | [ ] |
| 6   | 동일 이메일로 중복 가입 시 409를 반환한다                                            | O   | [ ] |
| 7   | 재고 수량이 0 미만으로 내려가는 소비 요청의 처리를 확인한다                                    | O   | [ ] |
| 8   | 가전 삭제(또는 폐기) 시 하위 MaintenanceSchedule·MaintenanceLog의 처리를 확인한다       | X   | [ ] |
| 9   | 폐기된 가전에 유지보수 스케줄을 추가하면 400을 반환한다                                     | X   | [ ] |


---

## 시나리오 실행 순서 (권장)

E2E 테스트 시 아래 순서로 진행하면 데이터 의존성이 자연스럽게 충족됩니다:

```
BUC-01 (인증)
  → BUC-02 (거점 생성)
    → BUC-03 (거점 유형)
    → BUC-04 (초대/멤버) — 별도 사용자 계정 필요
    → BUC-05 (집 구조: 방/가구/보관장소)
    → BUC-06 (카탈로그: 카테고리/단위/품목/변형)
      → BUC-07 (재고 등록/수량)
        → BUC-08 (소비/폐기/수동 조정)
        → BUC-09 (구매/재고 연결)
          → BUC-10 (로트/유통기한)
      → BUC-11 (장보기)
    → BUC-12 (알림 설정/조회)
    → BUC-14 (가전/설비) — v2.7
      → BUC-15 (유지보수 스케줄) — v2.7
        → BUC-16 (유지보수 이력) — v2.7
      → BUC-17 (보증/유지보수 알림) — v2.7
  → BUC-13 (인가/역할) — 전체 데이터 기반
  → BUC-18 (데이터 무결성) — 마지막에 실행
```

---

*본 문서는 api-connection-checklist.md, feature-checklist.md v2.7, entity-logical-design.md 기준으로 작성되었습니다.*
