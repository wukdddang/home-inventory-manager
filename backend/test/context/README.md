# Context 단위 테스트

Context 레이어는 **CQRS 핸들러(비즈니스 규칙 구현체)**와 **CommandBus/QueryBus 디스패처(Context Service)**로 나뉩니다. 가장 많은 로직이 집중되어 있어 테스트도 가장 세밀합니다.

각 핸들러 테스트는 Domain Service를 mock하고, Context Service 테스트는 CommandBus/QueryBus를 mock합니다.

---

## Auth Context

### SignupHandler (2개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 회원가입을 처리하고 토큰을 반환해야 한다 | ① 이메일 중복 체크 ② bcrypt 해싱 ③ 사용자 생성 ④ JWT 2회 발급 ⑤ 인증 이메일 발송 ⑥ 토큰 쌍 반환 |
| 이미 존재하는 이메일이면 ConflictException | 중복 이메일 가입 방지 (보안 + 데이터 무결성) |

### LoginHandler (3개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 올바른 자격증명으로 로그인 | ① bcrypt.compare 비밀번호 비교 ② lastLoginAt 갱신 ③ refreshTokenHash 저장 ④ 토큰 쌍 반환 |
| 존재하지 않는 이메일 → UnauthorizedException | 계정 열거 공격 방지 |
| 비밀번호 틀림 → UnauthorizedException | 동일한 에러 메시지로 이메일 존재 여부를 노출하지 않음 |

> 이메일 없음과 비밀번호 틀림 모두 같은 UnauthorizedException인 이유: "이 이메일은 가입되어 있지만 비밀번호가 틀렸다"라는 정보를 노출하면 계정 열거 공격(account enumeration)에 취약해집니다.

### RefreshTokenHandler (4개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 유효한 Refresh Token → 새 토큰 발급 | bcrypt.compare 검증 후 토큰 rotation |
| 사용자 없음 → UnauthorizedException | 탈퇴한 사용자의 토큰 방어 |
| refreshTokenHash가 null → UnauthorizedException | 로그아웃/비밀번호 변경 후 기존 토큰 무효화 확인 |
| Refresh Token 불일치 → UnauthorizedException | 이미 rotation된 구 토큰 재사용 감지 (토큰 탈취 방어) |

> 4개 케이스가 필요한 이유: Refresh Token은 인증의 마지막 방어선입니다. 사용자 없음, 토큰 null, 토큰 불일치 — 이 세 가지 에러 경로 중 하나라도 빠지면 보안 취약점이 됩니다.

### VerifyEmailHandler (2개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 이메일 인증 완료 | emailVerifiedAt = now(), emailVerificationToken = null (재사용 방지) |
| 유효하지 않은 토큰 → NotFoundException | 존재하지 않는/만료된 토큰 |

### ChangePasswordHandler (3개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 비밀번호 변경 성공 | ① 새 해시 저장 (bcrypt.compare 검증) ② refreshTokenHash = null (강제 재로그인) |
| 현재 비밀번호 틀림 → UnauthorizedException | 비밀번호 검증 |
| 사용자 없음 → UnauthorizedException | 존재하지 않는 사용자 |

> refreshTokenHash = null을 검증하는 이유: 비밀번호 변경 시 다른 기기의 세션을 모두 무효화해야 합니다. 비밀번호가 유출된 상황에서 다른 기기의 접근을 차단하는 보안 메커니즘입니다.

### LogoutHandler (2개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| refreshTokenHash를 null로 설정 | 토큰 무효화 |
| 사용자가 없어도 에러를 던지지 않아야 한다 | 로그아웃은 멱등(idempotent) 연산 |

### GetMyProfileHandler (2개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 사용자 프로필 반환 | UserProfileResult DTO 구조로 반환 (passwordHash 등 민감 필드 제외) |
| 사용자 없음 → NotFoundException | 존재하지 않는 사용자 |

### AuthContextService (7개)

| 메서드 | 검증 항목 |
|--------|-----------|
| `회원가입을_한다` | `commandBus.execute(SignupCommand)` 호출 |
| `로그인을_한다` | `commandBus.execute(LoginCommand)` 호출 |
| `토큰을_갱신한다` | `commandBus.execute(RefreshTokenCommand)` 호출 |
| `로그아웃을_한다` | `commandBus.execute(LogoutCommand)` 호출 |
| `이메일_인증을_완료한다` | `commandBus.execute(VerifyEmailCommand)` 호출 |
| `비밀번호를_변경한다` | `commandBus.execute(ChangePasswordCommand)` 호출 |
| `내_정보를_조회한다` | `queryBus.execute(GetMyProfileQuery)` 호출 |

> `expect.any(SignupCommand)` 형태로 타입만 확인합니다. Command 내부 필드의 정확성은 Handler 테스트에서 이미 검증하므로, Context Service는 "올바른 타입의 Command를 올바른 Bus에 전달하는 것"만 확인합니다.

---

## Household Context

### CreateHouseholdHandler (1개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 거점 생성 + 생성자 admin 멤버 등록 | ① 거점 생성 호출 ② 멤버 추가(role: 'admin', userId: 생성자) 호출 ③ HouseholdResult 반환 |

> 테스트가 1개뿐인 이유: 분기가 없습니다. 핵심은 "거점 생성"과 "멤버 등록"이 함께 일어나는 2단계 트랜잭션 검증입니다. 멤버 등록이 빠지면 아무도 접근할 수 없는 고아 거점이 됩니다.

### AddMemberHandler (2개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 멤버 추가 성공 | ① 기존 멤버 여부 확인(→ null) ② 멤버 추가 호출 |
| 이미 멤버이면 ConflictException | DB UNIQUE 제약조건의 사전 검증. 명확한 에러 메시지 제공 |

### ChangeMemberRoleHandler (4개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 역할 변경 성공 | member.role 변경 + save 호출 |
| 자기 자신의 역할 변경 → BadRequestException | admin이 자기 역할을 낮추면 거점을 관리할 수 없게 됨 |
| 마지막 admin의 역할 변경 → BadRequestException | admin이 1명뿐인데 역할을 바꾸면 admin 0명 → 거점 잠김 |
| 멤버 없음 → NotFoundException | 잘못된 memberId |

> 마지막 admin 보호 로직: admin이 2명이면 한 명을 viewer로 변경 가능하지만, 1명뿐이면 불가. 테스트에서 `admin_수를_조회한다.mockResolvedValue(1)`로 이 조건을 검증합니다.

### RemoveMemberHandler (3개)

| 테스트 케이스 | 검증 항목 |
|-------------|-----------|
| 멤버 제거 성공 | 멤버를_삭제한다 호출 |
| 자기 자신 제거 → BadRequestException | 자기 자신 제거 금지 |
| 멤버 없음 → NotFoundException | 잘못된 memberId |

> ChangeMemberRole과 달리 "마지막 admin 보호" 케이스가 없는 이유: 자기 자신 제거가 금지되어 있으므로, admin이 1명이면 자기 자신을 제거할 수 없습니다. 다른 admin이 제거하려면 admin이 2명 이상이어야 하므로 마지막 admin 문제가 자동으로 방지됩니다.

### HouseholdContextService (9개)

| 메서드 | 검증 항목 |
|--------|-----------|
| `거점을_생성한다` | `commandBus.execute(CreateHouseholdCommand)` |
| `거점을_수정한다` | `commandBus.execute(UpdateHouseholdCommand)` |
| `거점을_삭제한다` | `commandBus.execute(DeleteHouseholdCommand)` |
| `거점_목록을_조회한다` | `queryBus.execute(GetHouseholdListQuery)` |
| `거점_상세를_조회한다` | `queryBus.execute(GetHouseholdDetailQuery)` |
| `멤버_목록을_조회한다` | `queryBus.execute(GetMemberListQuery)` |
| `멤버를_추가한다` | `commandBus.execute(AddMemberCommand)` |
| `멤버_역할을_변경한다` | `commandBus.execute(ChangeMemberRoleCommand)` |
| `멤버를_제거한다` | `commandBus.execute(RemoveMemberCommand)` |
