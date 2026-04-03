# 페이지별 API 호출 맵 (Page → API Call Map)

**목적**: 프론트엔드 각 페이지(데스크탑/모바일)가 초기 렌더링을 완료하기 위해 필요한 API 호출 횟수·순서·의존 관계를 정리하여, 응답 최적화 대상을 식별하는 문서.

**현재 버전**: **v1.1** (2026-04-03)

| 버전 | 날짜 | 요약 |
|------|------|------|
| v1.0 | 2026-04-03 | 초안 작성. 8개 페이지 분석, 대시보드 최대 46회 호출 식별 |
| v1.1 | 2026-04-03 | aggregate 엔드포인트 적용. 대시보드 44→4회, 재고이력 23→3회, 구매 4→2회 |

**참조 문서**:
- [API 응답 계약서](./api-response-contract.md)
- [프론트엔드-백엔드 정합성 정리](./frontend-backend-alignment.md)
- [화면 설계 개요](../../frontend/docs/screen/screens-overview.md)

---

## 페이지 목록 및 데스크탑/모바일 구분

| 페이지 | 라우트 | 데스크탑 컴포넌트 | 모바일 컴포넌트 | 렌더링 분기 |
|--------|--------|------------------|----------------|------------|
| **대시보드** | `/dashboard` | `DashboardScreen` | `DashboardMobile.panel` | `useDeviceLayout()` < 1024px |
| **구매 내역** | `/purchases` | `PurchasesScreen` | (반응형 단일 구현) | — |
| **재고 이력** | `/inventory-history` | `InventoryHistoryScreen` | `InventoryHistoryMobile.panel` | `useDeviceLayout()` < 1024px |
| **설정** | `/settings` | `SettingsPanel` | `SettingsMobile.panel` | `useDeviceLayout()` < 1024px |
| **로그인** | `/login` | `LoginPanel` | (반응형) | — |
| **회원가입** | `/signup` | `SignupPanel` | (반응형) | — |
| **이메일 인증** | `/verify-email` | `VerifyEmailResultSection` | (반응형) | — |
| **초대 수락** | `/invite/[token]` | `InvitePanel` | (반응형) | — |

> 모바일 전용 컴포넌트가 있는 페이지: **대시보드, 재고 이력, 설정** (3개)
> 데스크탑과 모바일이 **동일한 API 데이터를 사용**하므로, API 호출 패턴은 뷰포트와 무관합니다.

---

## 상태 기호

- 🔴 **다단계 호출** — 초기 렌더에 API 3회 이상, 순차 의존 있음
- 🟡 **복수 호출** — 초기 렌더에 API 2~3회, 병렬 가능
- 🟢 **단일 호출** — API 1회로 렌더링 완료
- ⚪ **API 불필요** — localStorage 또는 사용자 입력만으로 렌더링

---

## 1. 대시보드 (`/dashboard`) 🔴

**가장 복잡한 페이지**. 거점 전체 데이터를 한 번에 조립해야 합니다.

### 초기 렌더링 API 호출 시퀀스

```
Phase 0 ─ 독립 호출 (병렬)
│
├─ GET /household-kind-definitions                          ← 거점 유형 라벨
│
Phase 1 ─ 거점 목록
│
├─ GET /households                                          ← 거점 목록
│
Phase 2 ─ 거점별 기본 데이터 (Phase 1 완료 후, 거점별 병렬)
│  ┌─────────────────────────────────────────────────────────┐
│  │  GET /households/{id}/members                           │
│  │  GET /households/{id}/categories          ┐             │
│  │  GET /households/{id}/units               ├─ 카탈로그   │
│  │  GET /households/{id}/products            ┘             │
│  │  GET /households/{id}/storage-locations                  │
│  │  GET /households/{id}/rooms               ┐             │
│  │  GET /households/{id}/house-structure      ├─ 공간 구조 │
│  └─────────────────────────────────────────────────────────┘
│
Phase 3 ─ 카탈로그 variant + 가구/재고 (Phase 2 완료 후)
│  ┌─────────────────────────────────────────────────────────┐
│  │  GET /households/{id}/products/{pid}/variants  × N개    │ ← 상품 수만큼
│  │  GET /households/{id}/rooms/{rid}/furniture-placements   │ ← 방 수만큼
│  │  GET /households/{id}/inventory-items                    │
│  └─────────────────────────────────────────────────────────┘
│
Phase 4 ─ 구매/유통기한 (Phase 3 완료 후)
│  ┌─────────────────────────────────────────────────────────┐
│  │  GET /households/{id}/purchases            ┐            │
│  │  GET /households/{id}/batches              ├─ 구매 데이터│
│  │  GET /households/{id}/batches/expiring     ┐            │
│  │  GET /households/{id}/batches/expired      ├─ 유통기한  │
│  └─────────────────────────────────────────────────────────┘
```

### 호출 횟수 계산

| Phase | 호출 수 (거점 1개 기준) | 비고 |
|-------|------------------------|------|
| Phase 0 | 1 | 거점 유형 정의 |
| Phase 1 | 1 | 거점 목록 |
| Phase 2 | 7 | 멤버 + 카탈로그 3 + 보관장소 + 방 + 집구조 |
| Phase 3 | 2 + N(상품) + R(방) | variant(상품별) + 가구(방별) + 재고 |
| Phase 4 | 4 | 구매 + 배치 + 임박 + 만료 |
| **합계** | **15 + N + R** | |

**예시**: 거점 2개, 상품 각 5개, 방 각 3개 → `1 + 1 + 2×(7 + 2 + 5 + 3 + 4)` = **44회**

### 순차 의존 관계 (critical path)

```
households → categories/units/products → products/{pid}/variants → inventory-items
                                                                         ↓
                                                              클라이언트 사이드 조인
                                                         (variant + product + unit 매핑)
```

| 의존 관계 | 이유 |
|-----------|------|
| `households` → Phase 2 전체 | householdId가 필요 |
| `products` → `variants` | productId가 필요 (N+1 문제) |
| `rooms` + `storage-locations` → `furniture-placements` | roomId 목록이 필요 |
| 카탈로그 + 보관장소 + 가구 → `inventory-items` 매핑 | 클라이언트 조인에 필요 |
| `inventory-items` 매핑 완료 → 구매/유통기한 로드 | 데이터 조립 순서 |

### 개선 제안

| # | 제안 | 예상 효과 |
|---|------|-----------|
| D-1 | `GET /households/{id}/variants` 일괄 조회 API | Phase 3의 N+1 제거 → **상품 수만큼 호출 감소** |
| D-2 | `GET /households/{id}/dashboard-view` aggregate API | Phase 2~3을 1회로 → **~15회 → 1회** |
| D-3 | Purchase 응답에 `batches[]` 포함 | Phase 4의 `/batches` 별도 호출 제거 → **2회 감소** |
| D-4 | `GET /households` 응답에 rooms/members 카운트 포함 | 빈 거점은 Phase 2 스킵 가능 |

---

## 2. 구매 내역 (`/purchases`) 🔴

### 초기 렌더링 API 호출 시퀀스

```
Phase 0 ─ localStorage에서 households 로드 (API 호출 없음)
│
Phase 1 ─ 거점별 구매 데이터 (거점별 병렬)
│  ┌────────────────────────────────────────┐
│  │  GET /households/{id}/purchases        │
│  │  GET /households/{id}/batches          │
│  └────────────────────────────────────────┘
```

### 호출 횟수 계산

| Phase | 호출 수 | 비고 |
|-------|---------|------|
| Phase 0 | 0 | localStorage |
| Phase 1 | 2 × 거점 수 | 구매 + 배치 |
| **합계** | **2 × H** | 거점 2개 = 4회 |

### 사용자 액션별 추가 API 호출

| 액션 | API 호출 | 횟수 |
|------|---------|------|
| 구매 등록 | `POST /households/{id}/purchases` → 목록 새로고침 (2×H) | 1 + 2H |
| 재고 연결 | `PATCH /households/{id}/purchases/{pid}/link-inventory` | 1 |

### 개선 제안

| # | 제안 | 예상 효과 |
|---|------|-----------|
| P-1 | Purchase 응답에 `batches[]` 포함 | `/batches` 별도 호출 제거 → **거점당 1회로 축소** |
| P-2 | 구매 등록 후 전체 새로고침 대신 응답값으로 로컬 업데이트 | 등록 시 추가 API 0회 |

---

## 3. 재고 이력 (`/inventory-history`) 🔴

### 초기 렌더링 API 호출 시퀀스

```
Phase 0 ─ localStorage에서 households + ledger 로드 (즉시 렌더 가능)
│
Phase 1 ─ API에서 최신 데이터 동기화 (비동기)
│
├─ GET /households                                          ← 거점 목록
│
Phase 2 ─ 거점별 재고 품목 조회 (Phase 1 완료 후, 거점별 병렬)
│  ┌────────────────────────────────────────┐
│  │  GET /households/{id}/inventory-items  │
│  └────────────────────────────────────────┘
│
Phase 3 ─ 품목별 이력 조회 (Phase 2 완료 후, 품목별 병렬) ⚠️ N+1
│  ┌─────────────────────────────────────────────────────────────────────┐
│  │  GET /households/{id}/inventory-items/{itemId}/logs  × 품목 수만큼 │
│  └─────────────────────────────────────────────────────────────────────┘
```

### 호출 횟수 계산

| Phase | 호출 수 | 비고 |
|-------|---------|------|
| Phase 0 | 0 | localStorage (즉시 렌더) |
| Phase 1 | 1 | 거점 목록 |
| Phase 2 | H | 거점당 재고 품목 목록 |
| Phase 3 | Σ(품목 수) | **N+1 문제** — 품목마다 개별 로그 조회 |
| **합계** | **1 + H + Σ(items)** | |

**예시**: 거점 2개, 재고 품목 각 10개 → `1 + 2 + 20` = **23회**

### 순차 의존 관계

```
households → inventory-items (거점별) → logs (품목별) ← N+1 병목
```

### 사용자 액션별 추가 API 호출

| 액션 | API 호출 | 횟수 |
|------|---------|------|
| 수량 조정 | `POST /households/{id}/inventory-items/{itemId}/logs/adjustment` | 1 |

### 개선 제안

| # | 제안 | 예상 효과 |
|---|------|-----------|
| H-1 | `GET /households/{id}/inventory-logs` (거점 전체 이력 일괄 조회) | Phase 2+3을 1회로 → **N+1 완전 제거** |
| H-2 | 쿼리 파라미터로 기간 필터 지원 (`?from=&to=`) | 전체 이력 대신 필요한 기간만 조회 |
| H-3 | Phase 0 localStorage 즉시 렌더 후, API 데이터는 백그라운드 병합 | 이미 구현됨 (UX 양호) |

---

## 4. 설정 (`/settings`) 🟡

### 초기 렌더링 API 호출 시퀀스

```
Phase 0 ─ 병렬 호출
│  ┌──────────────────────────────────────────────────────────────┐
│  │  GET /notification-preferences                               │
│  │  GET /households/{id}/expiration-alert-rules  (householdId 시)│
│  └──────────────────────────────────────────────────────────────┘
```

### 호출 횟수 계산

| Phase | 호출 수 | 비고 |
|-------|---------|------|
| Phase 0 | 1~2 | 알림 설정 + 유통기한 규칙 (조건부) |
| **합계** | **1~2** | |

### 사용자 액션별 추가 API 호출

| 액션 | API 호출 | 횟수 |
|------|---------|------|
| 설정 변경 (자동 저장) | `PUT /notification-preferences/{id}` 또는 `POST /notification-preferences` | 1 |
| 유통기한 규칙 추가/수정 | `POST` 또는 `PUT /households/{id}/expiration-alert-rules/{ruleId}` | 1 |
| 유통기한 규칙 삭제 | `DELETE /households/{id}/expiration-alert-rules/{ruleId}` | 1 |
| 알림 설정 초기화 | `DELETE /notification-preferences/{id}` | 1 |

> 설정 페이지는 카탈로그 관리 UI도 포함하지만, 카탈로그 데이터는 대시보드에서 이미 localStorage에 캐시된 상태를 사용합니다. 카탈로그 변경 시 `syncCatalogDiff()` 호출은 대시보드 Context에서 처리됩니다.

### 개선 제안

현재 호출 횟수가 적으므로 **추가 최적화 불필요**.

---

## 5. 로그인 (`/login`) 🟢

### 초기 렌더링

| Phase | 호출 수 | 비고 |
|-------|---------|------|
| 초기 렌더 | 0 | 입력 폼만 표시 |

### 사용자 액션: 로그인 제출 (순차)

```
POST /auth/login          ← 토큰 발급
     ↓ (성공 시)
GET  /auth/me             ← 사용자 정보 조회 → localStorage 저장 → /dashboard 리다이렉트
```

| 합계 | 2회 (순차) |
|------|-----------|

---

## 6. 회원가입 (`/signup`) 🟢

### 초기 렌더링

| Phase | 호출 수 | 비고 |
|-------|---------|------|
| 초기 렌더 | 0 | 입력 폼만 표시 |

### 사용자 액션: 가입 제출 (순차)

```
POST /auth/signup         ← 계정 생성 + 토큰 발급
     ↓ (성공 시)
GET  /auth/me             ← 사용자 정보 조회 → localStorage 저장 → /dashboard 리다이렉트
```

| 합계 | 2회 (순차) |
|------|-----------|

---

## 7. 이메일 인증 (`/verify-email`) 🟢

### 초기 렌더링

```
GET /auth/verify-email?token={token}    ← URL 쿼리에서 토큰 추출, 인증 처리
```

| 합계 | 1회 |
|------|-----|

---

## 8. 초대 수락 (`/invite/[token]`) 🟡

### 초기 렌더링

```
GET /invitations/{token}                ← 초대 정보 조회 (거점명, 역할, 초대자)
```

### 사용자 액션: 수락

```
POST /invitations/{token}/accept        ← 초대 수락
```

| 합계 | 초기 1회 + 수락 1회 |
|------|-------------------|

---

## 전체 요약

### 초기 렌더링 API 호출 횟수 비교 (v1.1 — aggregate 적용 후)

| 페이지 | 상태 | v1.0 호출 수 | **v1.1 호출 수** | 순차 단계 | 비고 |
|--------|------|-------------|-----------------|----------|------|
| **대시보드** | 🟡 | ~44회 | **1 + 1×H = ~3회** | 1단계 | `households` → `dashboard-view` × H |
| **재고 이력** | 🟡 | ~23회 | **1 + H = ~3회** | 1단계 | `households` → `inventory-logs` × H |
| **구매 내역** | 🟢 | ~4회 | **H = ~2회** | 0단계 (병렬) | `purchases-full` × H |
| **설정** | 🟡 | 2회 | **2회** | 0단계 (병렬) | 변경 없음 |
| **초대 수락** | 🟡 | 1회 | **1회** | 0단계 | 변경 없음 |
| **이메일 인증** | 🟢 | 1회 | **1회** | 0단계 | 변경 없음 |
| **로그인** | 🟢 | 0회 | **0회** | — | 변경 없음 |
| **회원가입** | 🟢 | 0회 | **0회** | — | 변경 없음 |

> H = 거점 수 (보통 1~3개)

### 순차 의존 깊이 (Critical Path) — v1.1

```
대시보드 (1단계):
  GET /households → GET /households/{id}/dashboard-view × H (병렬)

재고 이력 (1단계):
  GET /households → GET /households/{id}/inventory-logs × H (병렬)

구매 내역 (0단계):
  localStorage(households) → GET /households/{id}/purchases-full × H (병렬)

설정 (0단계):
  notification-preferences ∥ expiration-alert-rules
```

### v1.0 → v1.1 개선 결과

| 페이지 | v1.0 | v1.1 | **감소율** |
|--------|------|------|-----------|
| **대시보드** (거점 2) | ~44회 | **~3회** | **93% ↓** |
| **재고 이력** (거점 2, 품목 20) | ~23회 | **~3회** | **87% ↓** |
| **구매 내역** (거점 2) | ~4회 | **~2회** | **50% ↓** |

---

## 적용된 개선 사항 (v1.1)

| 제안 ID | 대상 | 적용 내용 | 상태 |
|---------|------|-----------|------|
| D-1 | 대시보드 | `dashboard-view` aggregate가 variants 일괄 포함 | ✅ 적용 |
| D-2 | 대시보드 | `GET /households/{id}/dashboard-view` 엔드포인트 | ✅ 적용 |
| D-3 | 대시보드 | `dashboard-view`에 purchases + batches 포함 | ✅ 적용 |
| H-1 | 재고 이력 | `GET /households/{id}/inventory-logs` 일괄 조회 | ✅ 적용 |
| H-2 | 재고 이력 | `?from=&to=` 기간 필터 쿼리 파라미터 | ✅ 적용 |
| P-1 | 구매 내역 | `GET /households/{id}/purchases-full` (batches 포함) | ✅ 적용 |

### 미적용 (향후 검토)

| 제안 ID | 대상 | 내용 | 비고 |
|---------|------|------|------|
| D-4 | 대시보드 | Household 응답에 하위 카운트 포함 | 거점 수가 적어 효과 미미 |
| P-2 | 구매 내역 | 등록 후 낙관적 업데이트 | 구매 등록은 저빈도 작업 |

---

*본 문서는 프론트엔드 코드 분석 기준으로 작성되었으며, API 최적화 진행에 따라 갱신합니다.*
