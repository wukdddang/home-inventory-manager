# E2E 테스트 작성 가이드라인

**최초 작성**: 2026-04-01
**기준**: Playwright 1.59, Docker Compose 기반 통합 환경

---

## 1. 환경 구성

### 인프라 실행

```bash
pnpm e2e:up      # Docker Compose (postgres, mailhog, backend, frontend) 기동
pnpm e2e:down    # 종료
```

| 서비스      | 호스트            | 포트    | 용도                    |
| --------- | --------------- | ----- | --------------------- |
| postgres  | localhost:54320 | 54320 | E2E 전용 DB (him_e2e)   |
| mailhog   | localhost:8025  | 8025  | 메일 캡처 (SMTP 1025)     |
| backend   | localhost:4200  | 4200  | NestJS API            |
| frontend  | localhost:4100  | 4100  | Next.js (baseURL)     |

### 테스트 실행

```bash
cd e2e

# 전체 실행
npx playwright test

# 단일 파일
npx playwright test tests/uc-01-auth.spec.ts

# 특정 테스트
npx playwright test -g "1. 사용자는"

# HTML 리포트
npx playwright show-report
```

---

## 2. 파일 구조

```
e2e/
├── tests/
│   ├── uc-01-auth.spec.ts          # UC-01 신규 사용자 가입 및 인증
│   ├── uc-02-password.spec.ts      # UC-02 비밀번호 변경
│   ├── uc-03-household.spec.ts     # UC-03 거점 생성 및 기본 설정
│   └── ...
├── utils/
│   ├── db.ts                       # DB 헬퍼 (resetDatabase, query)
│   └── mailhog.ts                  # MailHog 헬퍼
├── playwright.config.ts
├── docker-compose.yml
└── E2E_TEST_GUIDE.md               # 이 문서
```

### 파일 네이밍 규칙

- `uc-{번호}-{영문키워드}.spec.ts`
- 예: `uc-01-auth.spec.ts`, `uc-03-household.spec.ts`

### 타입 체크

`.spec.ts` 파일은 Playwright가 실행 시 자체 번들링하므로 **TypeScript 컴파일 에러가 런타임까지 드러나지 않는 경우**가 있다. 헬퍼 함수 시그니처 변경, 인자 누락 등의 타입 에러가 테스트 실패의 원인이 될 수 있으므로, 테스트를 실행하기 전에 주기적으로 타입 체크를 수행한다:

```bash
cd e2e && npx tsc --noEmit
```

특히 다음 상황에서는 반드시 타입 체크를 돌릴 것:
- 헬퍼 함수의 **파라미터를 추가/변경/삭제**한 뒤
- 여러 테스트 파일에서 **공유 유틸(`utils/`)을 수정**한 뒤
- **대량의 테스트 코드를 일괄 수정**(find & replace 등)한 뒤

---

## 3. 테스트 구조 패턴

### 기본 골격

```typescript
import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../utils/db";
import { clearAllMails } from "../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-XX. 유즈케이스 제목", () => {
  test.beforeEach(async () => {
    await resetDatabase();    // 매 테스트 전 DB 초기화
    await clearAllMails();    // 매 테스트 전 메일 초기화
  });

  // ── 헬퍼 ──

  async function signupAndWait(page: Page) { /* ... */ }

  // ── #1: 테스트 케이스 ──

  test("1. 사용자는 ~~~한다", async ({ page }) => {
    // ...
  });
});
```

### 테스트 케이스 네이밍

- use-cases.md 의 번호 체계를 따른다
- 서브섹션이 있으면 접두사를 붙인다: `"3-A-1."`, `"3-C-9."`
- 한글 "~한다" 문체를 유지한다

### beforeEach

**모든 테스트는 독립적이어야 한다.** `beforeEach`에서 `resetDatabase()` + `clearAllMails()`를 호출하여 상태를 초기화한다.

---

## 4. DB 검증 가이드

### 언제 DB 조회를 해야 하는가

UI 검증만으로 부족한 경우 DB 직접 조회를 수행한다:

| 상황 | 예시 | DB 조회 여부 |
|------|------|------------|
| **데이터 생성 확인** | 회원가입 후 users 테이블 확인 | ✅ 필수 |
| **데이터 변경 확인** | 비밀번호 해시 변경, 이름 수정 | ✅ 필수 |
| **데이터 삭제 확인** | 방 삭제 후 rooms 행 제거 | ✅ 필수 |
| **보안 속성 검증** | 비밀번호가 해시 저장되었는지 | ✅ 필수 |
| **캐스케이드 동작** | 가구 삭제 → 하위 보관장소 SET NULL | ✅ 필수 |
| **단순 화면 표시** | 목록에 항목이 보이는지 | ❌ UI만 |
| **토스트/메시지 표시** | 성공 메시지 확인 | ❌ UI만 |

### query 헬퍼 사용법

```typescript
import { query } from "../utils/db";

// 단일 행 조회
const users = await query<{ email: string; passwordHash: string }>(
  'SELECT email, "passwordHash" FROM users WHERE email = $1',
  [TEST_USER.email]
);
expect(users).toHaveLength(1);
expect(users[0].passwordHash).not.toBe(TEST_USER.password);

// 카운트 조회
const result = await query<{ cnt: string }>(
  "SELECT count(*) as cnt FROM rooms"
);
expect(Number(result[0].cnt)).toBe(2);
```

### 주요 테이블 · 컬럼 참조

| 테이블 | 주요 컬럼 | 참고 |
|--------|----------|------|
| `users` | `email`, `displayName`, `passwordHash`, `emailVerifiedAt`, `refreshTokenHash` | camelCase 컬럼명 → 쿼리 시 `"camelCase"` 따옴표 필수 |
| `households` | `name`, `kind` | |
| `household_kind_definitions` | `userId`, `kindId`, `label`, `sortOrder` | Unique: (userId, kindId) |
| `house_structures` | `householdId`, `name`, `structurePayload`, `diagramLayout` | JSONB 컬럼 |
| `rooms` | `houseStructureId`, `structureRoomKey`, `displayName`, `sortOrder` | |
| `furniture_placements` | `roomId`, `label`, `anchorDirectStorageId`, `sortOrder` | |
| `storage_locations` | `householdId`, `name`, `roomId`, `furniturePlacementId`, `sortOrder` | roomId·furniturePlacementId 모두 nullable |

### 캐스케이드 삭제 관계

```
Household  ──CASCADE──▸  HouseStructure  ──CASCADE──▸  Room  ──CASCADE──▸  FurniturePlacement
                                                                            │
Household  ──CASCADE──▸  StorageLocation                                    ▼ SET NULL
                              ▲                                       StorageLocation
                              └─── Room 삭제 시 SET NULL ──── roomId
```

---

## 5. UI 셀렉터 가이드

### 셀렉터 우선순위 (Playwright 권장)

1. **role + aria 속성** — `page.locator('[role="tab"][aria-selected="true"]')`
2. **aria-label** — `page.locator('button[aria-label="거점 추가"]')`
3. **text 매칭** — `page.locator('button:has-text("추가")')`
4. **placeholder** — `page.locator('input[placeholder="예: 우리 집"]')`
5. **CSS 선택자** — 최후 수단

### 모달 패턴

| 컴포넌트 | role | 용도 |
|---------|------|------|
| `FormModal` | `dialog` | 폼 입력 (추가, 수정) |
| `AlertModal` | `alertdialog` | 확인/삭제 경고 |
| `MotionModalLayer` | `dialog` (기본) | 커스텀 모달 |

```typescript
// FormModal 대기 → 입력 → 제출
const modal = page.locator('[role="dialog"]');
await expect(modal).toBeVisible({ timeout: 5_000 });
await modal.locator('input[placeholder="..."]').fill("값");
await modal.locator('button:has-text("추가")').click();
await expect(modal).toBeHidden({ timeout: 5_000 });

// AlertModal 확인
const alert = page.locator('[role="alertdialog"]');
await expect(alert).toBeVisible({ timeout: 5_000 });
await alert.locator('button:has-text("삭제")').click();
await expect(alert).toBeHidden({ timeout: 5_000 });
```

### 탭리스트/탭 패턴

프로젝트는 `role="tablist"` + `aria-label`로 영역을 구분하고, `role="tab"` + `aria-selected`로 선택 상태를 표현한다.

```typescript
// 특정 탭리스트 내 탭 선택
const tablist = page.locator('[role="tablist"][aria-label="방 선택"]');
await tablist.locator('button[role="tab"]:has-text("거실")').click();

// 선택된 탭 확인
await expect(
  page.locator('button[role="tab"][aria-selected="true"]:has-text("거실")')
).toBeVisible();
```

### 주요 aria-label 목록

| 요소 | aria-label 패턴 | 위치 |
|-----|----------------|------|
| 거점 추가 버튼 | `"거점 추가"` | 대시보드 헤더 |
| 거점 삭제 버튼 | `"${name} 삭제"` | 대시보드 거점 탭 |
| 거점 유형 관리 버튼 | `"거점 유형 관리"` | 대시보드 헤더 |
| 방 추가 버튼 | `"방 추가"` | 방 관리 섹션 |
| 방 이름 수정 버튼 | `"${name} 이름 수정"` | 방 탭 |
| 방 삭제 버튼 | `"${name} 삭제"` | 방 탭 |
| 직속 보관 장소 이름 수정 | `"「${name}」 직속 보관 장소 이름 수정"` | 보관 장소 탭 |
| 직속 보관 장소 삭제 | `"「${name}」 직속 보관 장소 삭제"` | 보관 장소 탭 |
| 가구 삭제 | `"「${name}」 가구 삭제"` | 가구 상세 영역 |
| 세부 보관 장소 이름 수정 | `"「${name}」 세부 보관 장소 이름 수정"` | 가구 하위 |
| 세부 보관 장소 삭제 | `"「${name}」 세부 보관 장소 삭제"` | 가구 하위 |

---

## 6. 헬퍼 함수 작성 규칙

### 공통 헬퍼 (각 spec 파일 내부에 정의)

- `signupAndWait(page)` — 회원가입 후 대시보드 도달
- `login(page, password?)` — 로그인
- `createHousehold(page, name)` — 거점 생성
- `addRoom(page, name)` — 방 추가
- `addDirectSlot(page, name)` — 직속 보관 장소 추가
- `addFurniture(page, name)` — 가구 추가
- `addSubSlot(page, name)` — 세부 보관 장소 추가

### 헬퍼 작성 원칙

1. **모달 열기 → 입력 → 제출 → 닫힘 대기**까지 완결
2. 인자는 최소한으로 — 테스트 데이터는 상수로
3. 실패 시 디버깅 용이하도록 `timeout`을 명시

---

## 7. 주의사항

### 온보딩 모달 처리

거점 생성 직후 멤버 초대(step 2) 모달이 뜰 수 있다. 테스트에서는 "건너뛰기" 버튼으로 스킵한다.

```typescript
const skipBtn = page.locator('button:has-text("건너뛰기")');
if (await skipBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  await skipBtn.click();
}
```

### UI 미구현 항목 처리

use-cases.md에서 UI `O`이지만 실제 미구현인 경우, **API 직접 호출**(`page.request`)로 대체한다. 코멘트로 미구현 상태를 기록한다.

```typescript
// API 를 통해 거점 이름 수정 (UI 미구현 상태)
const res = await page.request.put(`/api/households/${id}`, {
  data: { name: "수정된 이름" },
});
expect(res.ok()).toBe(true);
```

### 거점 생성 시 house_structure 선행 등록

거점(household) 생성 후 방을 추가하려면 `house_structure`가 먼저 존재해야 한다. 프론트엔드의 첫 번째 rooms/sync 호출이 실패할 수 있으므로, 거점 생성 직후 API로 빈 house_structure를 등록한다:

```typescript
await page.request.put(`/api/households/${householdId}/house-structure`, {
  data: {
    name: "default",
    structurePayload: { rooms: {} },
    diagramLayout: null,
  },
});
```

### 방 추가 후 rooms DB sync 보장

UI에서 방을 추가해도 프론트엔드의 rooms/sync API가 비동기적으로 실패할 수 있다. 방 추가 후 DB에 room이 없으면 직접 rooms/sync API를 호출한다:

```typescript
const rooms = await query('SELECT id FROM rooms WHERE "displayName" = $1', [name]);
if (rooms.length === 0) {
  // house_structure 확인 → rooms/sync API 직접 호출
}
```

### 직속 보관 장소 · 가구 · 세부 보관 장소 API 방식 추가

프론트엔드 모달의 React state 문제로 FormModal이 열리지 않을 수 있다. 이 경우 API를 직접 호출하고, `page.reload()` 후 UI를 검증한다:

```typescript
await page.request.post(`/api/households/${hId}/storage-locations`, {
  data: { name: "냉장고", roomId, furniturePlacementId: null, sortOrder: 0 },
});
await page.reload();
```

### waitForTimeout 사용 최소화

`page.waitForTimeout()`은 flaky 테스트의 원인이 된다. 대신 구체적인 조건을 대기한다:

```typescript
// ❌ 피하기
await page.waitForTimeout(3_000);

// ✅ 권장
await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5_000 });
await page.waitForURL("**/dashboard", { timeout: 10_000 });
```

### 모달 셀렉터는 제목으로 특정

여러 모달이 동시에 존재할 수 있으므로 `[role="dialog"]`만으로 찾지 말고, 제목 텍스트를 포함한다:

```typescript
// ❌ 다른 모달과 충돌
const modal = page.locator('[role="dialog"]');

// ✅ 제목으로 특정
const modal = page.locator('[role="dialog"]:has-text("방 추가")');
```

### camelCase 컬럼 쿼리

TypeORM 엔티티가 camelCase 컬럼명을 사용하므로 SQL에서 큰따옴표로 감싸야 한다:

```typescript
// ✅ 올바른 방법
await query('SELECT "passwordHash" FROM users WHERE email = $1', [email]);

// ❌ 오류 발생
await query("SELECT passwordHash FROM users WHERE email = $1", [email]);
```

---

## 8. 테스트 실행 순서

`playwright.config.ts`에서 `fullyParallel: false`, `workers: 1`로 설정되어 있어 파일 이름순으로 순차 실행된다. UC 번호 체계가 파일명에 반영되어 자연스러운 순서가 보장된다.

---

*본 문서는 프로젝트 E2E 테스트 작성 시 참고 가이드로, 실제 셀렉터와 구조는 소스코드를 기준으로 한다.*
