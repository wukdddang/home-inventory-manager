# Business 단위 테스트

Business 레이어는 Context Service를 호출하는 위임 계층입니다. 각 메서드가 Context Service를 **올바른 인자**로 호출하는지 `toHaveBeenCalledWith`로 검증합니다.

---

## AuthBusinessService (7개 테스트)

| 메서드 | 검증 항목 |
|--------|-----------|
| `회원가입을_한다` | `authContextService.회원가입을_한다(data)` 호출 + 결과 반환 |
| `로그인을_한다` | `authContextService.로그인을_한다(data)` 호출 + 결과 반환 |
| `토큰을_갱신한다` | `authContextService.토큰을_갱신한다(userId, refreshToken)` 호출 |
| `로그아웃을_한다` | `authContextService.로그아웃을_한다(userId)` 호출 |
| `이메일_인증을_완료한다` | `authContextService.이메일_인증을_완료한다(token)` 호출 |
| `비밀번호를_변경한다` | `authContextService.비밀번호를_변경한다(data)` 호출 |
| `내_정보를_조회한다` | `authContextService.내_정보를_조회한다(userId)` 호출 + 결과 반환 |

---

## HouseholdBusinessService (9개 테스트)

| 메서드 | 검증 항목 |
|--------|-----------|
| `거점을_생성한다` | `householdContextService.거점을_생성한다(data)` 호출 |
| `거점_목록을_조회한다` | `householdContextService.거점_목록을_조회한다(userId)` 호출 |
| `거점_상세를_조회한다` | `householdContextService.거점_상세를_조회한다(id)` 호출 |
| `거점을_수정한다` | `householdContextService.거점을_수정한다(id, data)` 호출 |
| `거점을_삭제한다` | `householdContextService.거점을_삭제한다(id)` 호출 |
| `멤버_목록을_조회한다` | `householdContextService.멤버_목록을_조회한다(householdId)` 호출 |
| `멤버를_추가한다` | `householdContextService.멤버를_추가한다(data)` 호출 |
| `멤버_역할을_변경한다` | `householdContextService.멤버_역할을_변경한다(memberId, requestingUserId, data)` 호출 |
| `멤버를_제거한다` | `householdContextService.멤버를_제거한다(memberId, requestingUserId)` 호출 |

---

## 왜 단순 위임인데도 테스트가 필요한가

1. **향후 비즈니스 로직 추가 시 회귀 방지** — 예: 가입 시 기본 거점 유형 시드, 로그인 시 IP 기록 등
2. **레이어 간 연결 검증** — Context Service의 메서드 시그니처가 바뀌면 이 테스트가 깨져서 즉시 알 수 있음
3. **인자 전달 정확성** — `멤버_역할을_변경한다(memberId, requestingUserId, data)`에서 `memberId`와 `requestingUserId`의 순서가 바뀌면 "다른 사람의 역할을 변경하려 했는데 자기 자신을 변경하는" 버그가 됨. 이 테스트가 인자 순서를 보장함

### Context Service 테스트와의 차이

- **Context Service**: `expect.any(Command)` — **타입만** 확인
- **Business**: `toHaveBeenCalledWith('user-1', 'refresh-token')` — **구체적 인자값**을 확인

Context → Handler 호출은 CQRS Bus를 통한 간접 호출이므로 타입만 확인하고, Business → Context 호출은 일반 메서드 호출이므로 인자 순서와 값을 정확히 확인합니다.
