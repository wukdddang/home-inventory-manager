# Auth Context 단위 테스트

**파일**: `auth-context.service.spec.ts`, `handlers/*.spec.ts` (7개 파일)
**테스트 대상**: `src/context/auth-context/`
**테스트 수**: 23개 (핸들러 16 + Context Service 7)

Auth Context는 인증 관련 비즈니스 규칙의 실제 구현체입니다. 가장 많은 분기 로직이 집중되어 있어 테스트도 가장 세밀합니다.

---

## 핸들러 테스트

### SignupHandler (2개) — `handlers/signup.handler.spec.ts`

#### Mock 구성
```typescript
mockUserService     = { 이메일로_사용자를_조회한다, 사용자를_생성한다, 사용자를_저장한다 }
mockJwtService      = { sign }
mockConfigService   = { get: (key) => configMap[key] }
mockMailService     = { 인증_이메일을_발송한다 }
```

#### 1. 회원가입을 처리하고 토큰을 반환해야 한다 (Happy Path)

```
Given: 이메일 중복 체크 → null (중복 없음)
       사용자 생성 → mockUser
       jwtService.sign → 첫 호출 'access-token', 두번째 'refresh-token'
       메일 발송 → void
When:  handler.execute(SignupCommand('test@example.com', 'password123', '테스트'))
Then:  ① 이메일로_사용자를_조회한다('test@example.com') 호출됨
       ② 사용자를_생성한다({ email, passwordHash(해시됨), displayName, emailVerificationToken }) 호출됨
       ③ sign이 2번 호출됨 (access + refresh)
       ④ 사용자를_저장한다 호출 (refreshTokenHash 저장)
       ⑤ 인증_이메일을_발송한다(email, token) 호출됨
       ⑥ { accessToken: 'access-token', refreshToken: 'refresh-token' } 반환
```

**`mockReturnValueOnce`를 2번 체이닝하는 이유**: `jwtService.sign`이 access token용과 refresh token용으로 2번 호출됩니다. 첫 호출에는 `{ sub: userId, email }` payload, 두번째에는 `{ sub: userId, type: 'refresh' }` + 다른 secret/expiry를 사용합니다. 같은 함수의 호출 순서별로 다른 반환값을 설정해야 합니다.

#### 2. 이미 존재하는 이메일이면 ConflictException

```
Given: 이메일로_사용자를_조회한다 → mockUser (이미 존재)
When:  handler.execute(SignupCommand)
Then:  ConflictException 던짐
```

**왜 DB UNIQUE 제약조건에 의존하지 않는가**: DB 에러는 `QueryFailedError`로 올라오며 에러 메시지가 영어 + SQL 구문입니다. 서비스 레벨에서 먼저 체크하면 "이미 사용 중인 이메일입니다"라는 명확한 한국어 메시지를 줄 수 있습니다.

---

### LoginHandler (3개) — `handlers/login.handler.spec.ts`

#### Mock 구성
```typescript
mockUserService   = { 이메일로_사용자를_조회한다, 사용자를_저장한다 }
mockJwtService    = { sign }
mockConfigService = { get }
```

#### 1. 올바른 자격증명으로 로그인 (Happy Path)

```
Given: passwordHash = await bcrypt.hash('password123', 10)  ← 실제 bcrypt 사용
       이메일로 조회 → { passwordHash, lastLoginAt: null, ... }
       sign → 'access-token', 'refresh-token'
When:  handler.execute(LoginCommand('test@example.com', 'password123'))
Then:  ① accessToken, refreshToken 반환
       ② mockUser.lastLoginAt이 Date 인스턴스 (부수효과 검증)
```

**테스트에서 실제 bcrypt.hash를 사용하는 이유**: mock 해시값으로는 `bcrypt.compare`가 작동하지 않습니다. 핸들러 내부에서 `bcrypt.compare(입력비밀번호, 저장된해시)`를 호출하므로, Given 단계에서 실제 해시를 만들어야 compare가 true를 반환합니다.

**`mockUser.lastLoginAt` 부수효과 검증**: 핸들러가 `user.lastLoginAt = new Date()`를 실행하면 mock 객체에도 반영됩니다. 반환값뿐 아니라 전달된 객체의 상태 변화도 테스트합니다.

#### 2. 존재하지 않는 이메일 → UnauthorizedException

#### 3. 비밀번호 틀림 → UnauthorizedException

```
Given: passwordHash = bcrypt.hash('correct-password', 10)
When:  handler.execute(LoginCommand(email, 'wrong-password'))
Then:  UnauthorizedException
```

**두 에러 케이스가 같은 예외를 던지는 이유**: "이 이메일은 가입되어 있지만 비밀번호가 틀렸다"라는 정보를 노출하면 **계정 열거 공격(account enumeration)**에 취약해집니다. 공격자가 이메일 목록을 돌려 "어떤 이메일이 가입되어 있는지" 알아낼 수 있습니다. 두 경우 모두 동일한 에러 메시지를 반환합니다.

---

### RefreshTokenHandler (4개) — `handlers/refresh-token.handler.spec.ts`

#### Mock 구성
```typescript
mockUserService   = { ID로_사용자를_조회한다, 사용자를_저장한다 }
mockJwtService    = { sign }
mockConfigService = { get }
```

#### 1. 유효한 Refresh Token → 새 토큰 발급

```
Given: refreshTokenHash = bcrypt.hash('valid-refresh-token', 10)
       ID로 조회 → { refreshTokenHash, email, ... }
       sign → 'new-access', 'new-refresh'
When:  handler.execute(RefreshTokenCommand('user-1', 'valid-refresh-token'))
Then:  ① 새 accessToken, refreshToken 반환
       ② user.refreshTokenHash가 새 값으로 갱신됨 (rotation)
```

#### 2. 사용자 없음 → UnauthorizedException

탈퇴한 사용자의 refresh token이 남아있는 경우를 방어합니다.

#### 3. refreshTokenHash가 null → UnauthorizedException

**이 케이스가 존재하는 시나리오**:
- 사용자가 로그아웃한 후 (LogoutHandler가 null로 설정)
- 비밀번호를 변경한 후 (ChangePasswordHandler가 null로 설정)

두 경우 모두 기존 refresh token을 무효화해야 합니다.

#### 4. Refresh Token 불일치 → UnauthorizedException

```
Given: refreshTokenHash = bcrypt.hash('correct-token', 10)
When:  handler.execute(RefreshTokenCommand('user-1', 'wrong-token'))
Then:  UnauthorizedException
```

**이 케이스가 존재하는 시나리오**: Token rotation에서 이미 사용된 구 토큰으로 재요청하는 경우. 토큰이 탈취되었을 때, 정상 사용자가 먼저 refresh하면 해커의 토큰은 이 케이스에서 차단됩니다.

---

### VerifyEmailHandler (2개) — `handlers/verify-email.handler.spec.ts`

#### 1. 이메일 인증 완료

```
Given: 인증토큰으로 조회 → { emailVerifiedAt: null, emailVerificationToken: 'token-123' }
When:  handler.execute(VerifyEmailCommand('token-123'))
Then:  ① mockUser.emailVerifiedAt이 Date 인스턴스
       ② mockUser.emailVerificationToken이 null (재사용 방지)
       ③ 사용자를_저장한다 호출
```

**토큰을 null로 설정하는 이유**: 같은 토큰으로 반복 인증을 방지합니다. 인증 완료 후 토큰을 그대로 두면 인증 링크가 영구적으로 유효해집니다.

#### 2. 유효하지 않은 토큰 → NotFoundException

---

### ChangePasswordHandler (3개) — `handlers/change-password.handler.spec.ts`

#### 1. 비밀번호 변경 + refreshTokenHash null

```
Given: currentHash = bcrypt.hash('current-password', 10)
       ID로 조회 → { passwordHash: currentHash, refreshTokenHash: 'some-hash' }
When:  handler.execute(ChangePasswordCommand('user-1', 'current-password', 'new-password'))
Then:  ① bcrypt.compare('new-password', mockUser.passwordHash) === true
       ② mockUser.refreshTokenHash === null
       ③ 사용자를_저장한다 호출
```

**refreshTokenHash = null의 의미**: 비밀번호 변경 시 모든 기기의 세션을 강제 만료합니다. 비밀번호가 유출된 상황에서 해커가 이미 확보한 refresh token으로 접근하는 것을 차단합니다.

**bcrypt.compare로 새 해시를 검증하는 이유**: `mockUser.passwordHash`가 실제로 새 비밀번호의 유효한 bcrypt 해시인지 확인합니다. 단순히 "passwordHash가 변경되었다"가 아니라 "새 비밀번호로 compare가 true를 반환한다"를 검증합니다.

#### 2. 현재 비밀번호 틀림 → UnauthorizedException
#### 3. 사용자 없음 → UnauthorizedException

---

### LogoutHandler (2개) — `handlers/logout.handler.spec.ts`

#### 1. refreshTokenHash를 null로 설정

#### 2. 사용자가 없어도 에러를 던지지 않아야 한다

**멱등성(idempotency)**: 로그아웃은 여러 번 호출해도 같은 결과를 보장해야 합니다. 이미 탈퇴하거나 만료된 세션에 대해 에러를 줄 필요가 없습니다. 클라이언트는 로그아웃 요청 후 항상 "성공"을 받아야 합니다.

---

### GetMyProfileHandler (2개) — `handlers/get-my-profile.handler.spec.ts`

#### 1. 사용자 프로필 반환

```
Then: 반환값이 { id, email, displayName, emailVerifiedAt, lastLoginAt, createdAt }
      → passwordHash, refreshTokenHash, emailVerificationToken 미포함
```

**DTO 매핑 검증**: 핸들러가 User 엔티티를 UserProfileResult DTO로 변환할 때 민감한 필드를 제외하는지 간접적으로 확인합니다. DTO에 해당 필드가 없으므로 누락됩니다.

#### 2. 사용자 없음 → NotFoundException

---

## Context Service 테스트 — `auth-context.service.spec.ts`

### Mock 구성
```typescript
mockCommandBus = { execute: jest.fn() }
mockQueryBus   = { execute: jest.fn() }
```

### 7개 메서드 × 1개 테스트

| 메서드 | 검증 |
|--------|------|
| `회원가입을_한다(data)` | `commandBus.execute(expect.any(SignupCommand))` |
| `로그인을_한다(data)` | `commandBus.execute(expect.any(LoginCommand))` |
| `토큰을_갱신한다(userId, token)` | `commandBus.execute(expect.any(RefreshTokenCommand))` |
| `로그아웃을_한다(userId)` | `commandBus.execute(expect.any(LogoutCommand))` |
| `이메일_인증을_완료한다(token)` | `commandBus.execute(expect.any(VerifyEmailCommand))` |
| `비밀번호를_변경한다(data)` | `commandBus.execute(expect.any(ChangePasswordCommand))` |
| `내_정보를_조회한다(userId)` | `queryBus.execute(expect.any(GetMyProfileQuery))` |

**`expect.any(Type)`으로 타입만 확인하는 이유**: Context Service의 책임은 "올바른 Command/Query를 올바른 Bus에 전달하는 것"입니다. Command 내부 필드의 정확성은 이미 Handler 테스트에서 검증합니다. 만약 실수로 `회원가입을_한다`에서 `LoginCommand`를 전달하면 이 테스트가 실패합니다.
