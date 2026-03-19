# `(mock)/mock` — 목(기획) 화면 구현본 + `/mock/...` 라우트

- **`(current)`** → 실제 URL (`/`, `/dashboard`, `/login` …). 각 `page.tsx`는 **여기 동일 경로 `page`를 re-export**만 합니다.
- **`(mock)/mock`** → Provider·`_ui`·`_context` 등 **구현본**. URL `/mock/...`로도 그대로 노출됩니다.

## 대시보드 `dataMode`

`dashboard/page.tsx`는 `usePathname()`으로 `/mock` 접두 여부를 보고 `DashboardScreen`에 `mock` / `api`를 넘깁니다.

## 레이아웃

- **`/mock/*` 전체** — **AuthGuard 없음**. 비로그인 접근 허용.
- `dashboard`·`settings` — `AppShell`만 (`dashboard/layout.tsx`, `settings/layout.tsx`).
- 로그인·가입·홈 — `mock/layout.tsx` 최소 래퍼.
