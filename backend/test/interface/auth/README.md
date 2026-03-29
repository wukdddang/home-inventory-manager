# Auth E2E 테스트

**파일**: `auth.e2e-spec.ts`
**테스트 대상**: `src/interface/auth/auth.controller.ts`
**테스트 수**: 16개

## 테스트 환경

- **실제 PostgreSQL**: Docker Testcontainers로 `postgres:16-alpine` 컨테이너 실행
- **실제 NestJS 앱**: AppModule 전체 로드 (ValidationPipe, Global Prefix 포함)
- **유일한 Mock**: `MailService` → `MockMailService` (실제 이메일 발송 불가)
- **테스트 간 격리**: 매 테스트마다 `TRUNCATE TABLE ... CASCADE`로 전체 DB 초기화

## 엔드포인트별 테스트 상세

### POST /api/auth/signup (5개)

#### 1. 회원가입을 처리하고 토큰을 반환해야 한다

```
Request:  POST /api/auth/signup
Body:     { email: 'newuser@example.com', password: 'password123', displayName: '새 사용자' }
Expected: 201 Created
          { accessToken: string, refreshToken: string }
```

**단위 테스트와의 차이**: 단위 테스트는 Handler의 로직 분기를 검증하지만, E2E는 "HTTP 요청 → Controller → ValidationPipe → Business → Context → Handler → Domain → DB → 응답" 전체 파이프라인이 동작하는지 확인합니다. 실제로 DB에 User 레코드가 생성되고, 실제 bcrypt 해싱이 일어나고, 실제 JWT가 발급됩니다.

#### 2. 인증 이메일을 발송해야 한다

```
Request:  POST /api/auth/signup
Body:     { email: 'verify@example.com', ... }
Expected: 201
검증:     testSuite.mockMailService.sentEmails.length === 1
          sentEmails[0].to === 'verify@example.com'
```

**MockMailService를 사용하는 이유**: 실제 SMTP 서버에 연결할 수 없으므로, 호출 기록만 남기는 가짜 서비스를 주입합니다. "이메일이 발송되었는가"를 `sentEmails` 배열로 검증합니다. 이 배열에 기록된 토큰은 이메일 인증 테스트에서 재사용됩니다.

#### 3. 중복 이메일이면 409를 반환해야 한다

```
Request 1: POST /api/auth/signup { email: 'dup@example.com', ... } → 201
Request 2: POST /api/auth/signup { email: 'dup@example.com', ... } → 409
```

**E2E에서만 확인 가능한 것**: 실제 DB에 User가 저장된 후 같은 이메일로 재가입 시도. 단위 테스트에서는 mock으로 중복을 시뮬레이션하지만, E2E에서는 실제 DB 상태에 의존합니다.

#### 4. 유효하지 않은 이메일이면 400을 반환해야 한다

```
Request:  POST /api/auth/signup { email: 'not-an-email', ... }
Expected: 400 Bad Request
```

**이 테스트가 E2E에서만 의미있는 이유**: `@IsEmail()` 데코레이터는 `ValidationPipe`를 통해 작동합니다. 단위 테스트에서는 Controller를 직접 호출하면 ValidationPipe를 거치지 않으므로 DTO 검증이 실행되지 않습니다. E2E에서만 "실제 HTTP 요청 시 class-validator가 작동하는가"를 확인할 수 있습니다.

#### 5. 비밀번호가 8자 미만이면 400을 반환해야 한다

```
Request:  POST /api/auth/signup { password: 'short', ... }
Expected: 400 Bad Request
```

`@MinLength(8)` 데코레이터 동작 검증.

---

### POST /api/auth/login (3개)

#### 6. 올바른 자격증명으로 로그인해야 한다

```
사전 조건: signup으로 사용자 생성 (beforeEach에서 실행)
Request:  POST /api/auth/login { email, password }
Expected: 200 OK + { accessToken, refreshToken }
```

**beforeEach에서 사용자를 생성하는 이유**: 로그인은 기존 사용자가 필요합니다. `beforeEach`에서 `cleanDatabase()` 후 signup을 실행하여 매 테스트마다 깨끗한 상태에서 시작합니다.

#### 7. 잘못된 비밀번호이면 401을 반환해야 한다
#### 8. 존재하지 않는 이메일이면 401을 반환해야 한다

두 경우 모두 동일한 401 반환. 계정 열거 공격 방지.

---

### GET /api/auth/me (2개)

#### 9. 인증된 사용자 정보를 반환해야 한다

```
사전 조건: signup으로 accessToken 획득
Request:  GET /api/auth/me (Authorization: Bearer {accessToken})
Expected: 200 + { email, displayName, ... }
검증:     ① email, displayName 일치
          ② passwordHash, refreshTokenHash 미포함 (민감 정보 노출 방지)
```

**`res.body`에 passwordHash가 없는지 확인하는 이유**: Handler가 UserProfileResult DTO로 매핑할 때 민감 필드를 제외하지만, 실수로 User 엔티티를 그대로 반환하면 비밀번호 해시가 노출됩니다. E2E에서 응답 구조를 직접 확인합니다.

#### 10. 인증 없이 접근하면 401을 반환해야 한다

```
Request:  GET /api/auth/me (Authorization 헤더 없음)
Expected: 401 Unauthorized
```

**JwtAuthGuard 동작 검증**: `@UseGuards(JwtAuthGuard)`가 컨트롤러에 실제로 적용되어 있는지 확인하는 유일한 방법입니다. 단위 테스트에서는 데코레이터의 존재를 검증할 수 없습니다.

---

### POST /api/auth/logout (1개)

#### 11. 로그아웃을 처리해야 한다

```
사전 조건: signup으로 accessToken 획득
Request:  POST /api/auth/logout (Bearer {accessToken})
Expected: 200 + { message: '로그아웃되었습니다' }
```

---

### GET /api/auth/verify-email (2개)

#### 12. 이메일 인증을 완료해야 한다

```
사전 조건: signup → MockMailService.sentEmails[0].token 추출
Request:  GET /api/auth/verify-email?token={token}
Expected: 200 + { message: '이메일 인증이 완료되었습니다' }
```

**E2E만의 가치**: signup → 이메일 발송 → 토큰 추출 → 인증 완료까지의 **전체 흐름**을 검증합니다. 단위 테스트에서는 각 단계를 개별로 테스트하지만, 단계 간 데이터(토큰)가 실제로 연결되는지는 E2E에서만 확인 가능합니다.

#### 13. 유효하지 않은 토큰이면 404를 반환해야 한다

---

### PATCH /api/auth/password (2개)

#### 14. 비밀번호를 변경해야 한다

```
사전 조건: signup으로 accessToken 획득
Request:  PATCH /api/auth/password (Bearer {accessToken})
Body:     { currentPassword: 'old-password123', newPassword: 'new-password123' }
Expected: 200

추가 검증: 새 비밀번호로 로그인 가능 확인
  POST /api/auth/login { email, password: 'new-password123' } → 200
```

**"변경 후 로그인" 검증이 E2E만의 가치인 이유**: 단위 테스트에서는 `bcrypt.hash`가 호출되었다는 것만 확인하지만, E2E에서는 "DB에 올바른 해시가 저장되고, 그 해시로 로그인이 되는가"까지 검증합니다. 해시 저장 → 조회 → 비교 전체 사이클을 확인합니다.

#### 15. 현재 비밀번호가 틀리면 401을 반환해야 한다

---

### POST /api/auth/refresh (1개)

#### 16. 새 토큰을 발급해야 한다

```
사전 조건: signup으로 refreshToken 획득
Request:  POST /api/auth/refresh
Body:     { refreshToken }
Expected: 200 + { accessToken: string, refreshToken: string }
```
