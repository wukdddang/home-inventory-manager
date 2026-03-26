# 화면·라우트 개요

도메인 참조: [`domain-data-model.md`](./domain-data-model.md), 집 구조 UX: [`house-structure-feature.md`](./house-structure-feature.md).

UI·상태 패턴은 [`.cursor/react-context-use-rule.mdc`](../.cursor/react-context-use-rule.mdc) 를 따릅니다. 페이지별로 `_context/` · `_ui/`(`.panel` / `.section` / `.module` / `.component`) · `_hooks/` 를 사용합니다.

## 앱 구조 (Lumir `(current)` / 목 구현 트리)

| 트리 | URL 역할 |
|------|-----------|
| `app/(current)/…` | **실제** 라우트 (`/login`, `/signup`, `/dashboard`, `/purchases`, `/inventory-history`, `/settings` …). `page.tsx`는 `(mock)/mock`의 동일 경로 `page`를 **re-export**만 함. |
| `app/(mock)/mock/…` | **구현본** + `/mock/…` 라우트 (로그인·회원가입·홈·대시보드·설정 전부). |

공유 UI: `app/(current)/_ui/` (`AppShell`, `AuthGuard`). **`(current)/layout`에는 가드 없음** — `dashboard`·`purchases`·`inventory-history`·`settings` 세그먼트 `layout.tsx`에서만 `AuthGuard` + `AppShell`. **`/mock/*` 전체에는 AuthGuard를 쓰지 않음**(비로그인 허용, 필요 시 `AppShell`만).

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 로그인 여부에 따라 `/login` 또는 `/dashboard`로 이동 (구현: `(mock)/mock/page.tsx`) |
| `/mock` | 위와 동일 규칙, 접두 `/mock` (`/mock/login`, `/mock/dashboard` …) |
| `/login` | 로그인 — 라우트: `(current)/login/page.tsx` → 구현: `(mock)/mock/login/page.tsx` |
| `/mock/login` | 동일 |
| `/signup` | 회원가입 — 라우트: `(current)/signup/page.tsx` → 구현: `(mock)/mock/signup/page.tsx` |
| `/mock/signup` | 동일 |
| `/dashboard` | 거점·방·재고 (`(mock)/mock/dashboard` — `dataMode`는 URL로 판별) |
| `/purchases` | 구매·로트 (`(mock)/mock/purchases`, `him-purchases`; `/mock` 시 거점·구매 시드) |
| `/mock/purchases` | 동일 UI — AuthGuard 없음 |
| `/inventory-history` | 재고 이력 타임라인 (`(mock)/mock/inventory-history`, `him-inventory-ledger`) |
| `/mock/inventory-history` | 동일 UI — AuthGuard 없음 |
| `/mock/...` | 목 트리 전반 **비로그인 접근**(AuthGuard 없음). 대시보드는 인메모리 mock 시드 |
| `/settings` | 설정 (`(mock)/mock/settings`) |
| `/mock/settings` | 동일 UI — `/mock/*`이므로 **AuthGuard 없음** |

## 재고·구매 등록 — 두 가지 경로

같은 집 안 재고를 채우는 데 **화면을 나눠 쓰는 이유**는, 실제로 두 가지 습관이 섞이기 때문입니다.

| 언제 | 어느 화면 | 하는 일 |
|------|-----------|---------|
| **이미 보관 장소에 넣은 뒤** 입력할 때 | **메인** (`/dashboard`) | 방·보관 장소를 고르고 재고·수량·(선택) 유통기한까지 한 흐름으로 맞춤. 카탈로그 품목·용량과 바로 연결됩니다. |
| **장만 하고 정리는 나중**일 때 | **구매·로트** (`/purchases`) | 구매일·금액·로트(유통기한)만 먼저 남깁니다. **재고 행 연결은 선택**이며, 나중에 메인에서 재고를 만들거나 연결해 정리할 수 있습니다. |

두 경로 모두 `him-purchases`·`him-households`에 기록되며, 재고와 구매를 **같은 `inventoryItemId`로 묶으면** 메인 목록의 임박 뱃지 등에 같이 반영됩니다.

## 로컬 저장 (API 전)

| 키 | 용도 |
|----|------|
| `him-user` | `{ email, displayName }` |
| `him-households` | Household 배열 (rooms, items 포함) — **api** 모드에서만 사용 |
| `him-settings` | 알림 플래그, 그룹 멤버 목록 |
| `him-purchases` | 구매 기록·로트 (`PurchaseRecord[]`) |
| `him-inventory-ledger` | 재고 변경 이력 (`InventoryLedgerRow[]` — 소비·폐기 등) |

도메인 타입은 `@/types/domain` 에 정의합니다. 백엔드 연동 시 동일 필드를 API DTO에 매핑하면 됩니다.
