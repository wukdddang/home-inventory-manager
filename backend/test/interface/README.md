# E2E 테스트 (Interface)

E2E 테스트는 실제 PostgreSQL(Docker Testcontainers)에 연결하여 **HTTP 요청 → 응답 전체 파이프라인**을 검증합니다. Mock은 MailService만 사용합니다.

단위 테스트에서 검증할 수 없는 것들을 E2E에서 검증합니다:
- **DTO 유효성 검사** — `@IsEmail()`, `@MinLength()` 등 class-validator 데코레이터가 실제로 동작하는지
- **Guard 체인** — `@UseGuards(JwtAuthGuard, HouseholdMemberGuard, RolesGuard)`가 올바른 순서로 적용되는지
- **DB 트랜잭션** — 거점 생성 + 멤버 등록이 실제 DB에 두 레코드로 저장되는지
- **연속 동작** — 비밀번호 변경 후 새 비밀번호로 로그인되는지

---

## 테스트 인프라

### BaseE2ETest (base-e2e.spec.ts)

모든 E2E 테스트가 상속하는 베이스 클래스입니다.

| 메서드 | 역할 |
|--------|------|
| `initializeApp()` | PostgreSQL 컨테이너 시작 → 환경변수 설정 → NestJS 앱 초기화 (MailService만 mock) |
| `closeApp()` | 앱 종료 + 컨테이너 정지 |
| `cleanDatabase()` | 모든 테이블 TRUNCATE CASCADE — 테스트 간 데이터 격리 |
| `request()` | supertest 요청 (인증 없음) |
| `authenticatedRequest(token)` | supertest 요청 (Bearer 토큰 포함) |

### MockMailService

실제 이메일을 보내지 않고 `sentEmails` 배열에 호출 기록을 남깁니다. 회원가입 시 발송된 인증 토큰을 꺼내 이메일 인증 테스트에 사용합니다.

---

## Auth E2E (16개 테스트)

### POST /api/auth/signup (5개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 회원가입 성공 | 201 | accessToken, refreshToken 반환 |
| 인증 이메일 발송 확인 | 201 | MockMailService.sentEmails에 기록됨 |
| 중복 이메일 | 409 | 데이터 무결성 |
| 유효하지 않은 이메일 형식 | 400 | class-validator `@IsEmail()` 동작 확인 |
| 비밀번호 8자 미만 | 400 | class-validator `@MinLength(8)` 동작 확인 |

### POST /api/auth/login (3개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 정상 로그인 | 200 | accessToken, refreshToken 반환 |
| 잘못된 비밀번호 | 401 | 인증 실패 |
| 존재하지 않는 이메일 | 401 | 인증 실패 (동일한 에러로 계정 열거 방지) |

### GET /api/auth/me (2개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 인증된 사용자 정보 반환 | 200 | email, displayName 반환. passwordHash/refreshTokenHash 미포함 |
| 인증 없이 접근 | 401 | JwtAuthGuard 동작 확인 |

### POST /api/auth/logout (1개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 로그아웃 성공 | 200 | 메시지 반환 |

### GET /api/auth/verify-email (2개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 이메일 인증 완료 | 200 | MockMailService에서 토큰을 꺼내 실제 인증 완료 |
| 유효하지 않은 토큰 | 404 | 존재하지 않는 토큰 |

### PATCH /api/auth/password (2개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 비밀번호 변경 성공 | 200 | 변경 후 새 비밀번호로 로그인 가능 확인 (연속 동작 검증) |
| 현재 비밀번호 틀림 | 401 | 인증 실패 |

### POST /api/auth/refresh (1개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 새 토큰 발급 | 200 | accessToken, refreshToken 반환 |

---

## Household E2E (12개 테스트)

### POST /api/households (2개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 거점 생성 + 생성자 admin 등록 | 201 | 생성 후 GET /members로 admin 멤버 등록 확인 (DB 트랜잭션 검증) |
| 인증 없이 접근 | 401 | JwtAuthGuard |

### GET /api/households (1개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 내가 속한 거점 목록 | 200 | 2개 생성 후 정확히 2개 반환 |

### GET /api/households/:id (2개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| 거점 상세 조회 | 200 | name 확인 |
| 비멤버가 접근 | 403 | HouseholdMemberGuard 동작 확인 (다른 사용자로 요청) |

### PUT /api/households/:id (1개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| admin이 거점 수정 | 200 | 변경된 name 확인 |

### DELETE /api/households/:id (1개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| admin이 거점 삭제 | 204 | 삭제 완료 |

### POST /api/households/:id/members (3개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| admin이 멤버 추가 | 201 | userId, role 반환 |
| 이미 멤버인 경우 | 409 | 중복 가입 방지 |
| 비admin(editor)이 멤버 추가 시도 | 403 | RolesGuard 동작 확인 |

> 403 테스트의 설정: ① admin이 거점 생성 → ② admin이 otherUser를 editor로 추가 → ③ 세번째 사용자 생성 → ④ otherUser(editor)가 세번째 사용자 추가 시도 → 403. 이 테스트는 `JwtAuthGuard → HouseholdMemberGuard → RolesGuard` 3개 Guard 체인을 검증합니다.

### PATCH /api/households/:id/members/:memberId/role (1개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| admin이 멤버 역할 변경 | 200 | 역할 변경 성공 |

### DELETE /api/households/:id/members/:memberId (1개)

| 테스트 케이스 | 상태코드 | 검증 항목 |
|-------------|---------|-----------|
| admin이 멤버 제거 | 204 | 멤버 제거 성공 |

---

## Auth E2E와 Household E2E의 차이

| 관점 | Auth E2E | Household E2E |
|------|----------|---------------|
| 인증 | 대부분 비인증 요청 (signup, login) | 모든 요청에 JWT 필요 |
| 사전 설정 | 없음 | `beforeEach`에서 사용자 + 거점 + 멤버 생성 |
| Guard 테스트 | JwtAuthGuard 1개 | JwtAuthGuard + HouseholdMemberGuard + RolesGuard 체인 |
| 핵심 검증 | 토큰 발급/검증, DTO 유효성 | 권한 체계, 멤버 소속 여부, 역할 기반 접근 제어 |
| 사용자 수 | 1명 | 테스트당 2~3명 (admin, editor, 비멤버) |

Household E2E가 Auth E2E보다 `beforeEach`가 무거운 이유는 **멀티 사용자 시나리오**를 테스트해야 하기 때문입니다. "누가 무엇을 할 수 있고 없는지"를 검증하려면 역할이 다른 여러 사용자가 필요합니다.
