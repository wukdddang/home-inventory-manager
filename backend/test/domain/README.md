# Domain 단위 테스트

Domain 레이어의 책임은 **DB와의 직접 통신**(Repository 호출)입니다. 각 메서드가 TypeORM Repository를 올바른 인자로 호출하는지 검증합니다.

---

## UserService (5개 테스트)

| 메서드 | 테스트 케이스 | 검증 항목 |
|--------|-------------|-----------|
| `이메일로_사용자를_조회한다` | 이메일로 사용자를 조회해야 한다 | `findOne({ where: { email } })` 호출 + 결과 반환 |
| | 존재하지 않는 이메일이면 null을 반환해야 한다 | null 전달 시 에러 없이 null 그대로 반환 |
| `ID로_사용자를_조회한다` | ID로 사용자를 조회해야 한다 | `findOne({ where: { id } })` 호출 + 결과 반환 |
| | 존재하지 않는 ID이면 null을 반환해야 한다 | null 반환 |
| `인증토큰으로_사용자를_조회한다` | 인증 토큰으로 사용자를 조회해야 한다 | `findOne({ where: { emailVerificationToken } })` 호출 |
| `사용자를_생성한다` | 사용자를 생성해야 한다 | `create → save` 체인 호출 확인 |
| `사용자를_저장한다` | 사용자를 저장해야 한다 | `save` 호출 확인 |

### 조회 메서드에 존재/부재 두 케이스가 있는 이유

"조회" 메서드의 반환값은 상위 레이어(login, verify-email 등)에서 분기 조건이 됩니다. 있을 때 올바른 객체를 돌려주는가, 없을 때 null을 돌려주는가 — 이 두 경로를 검증해야 상위 레이어의 테스트가 올바른 전제 위에 세워집니다.

---

## HouseholdService (5개 테스트)

| 메서드 | 테스트 케이스 | 검증 항목 |
|--------|-------------|-----------|
| `거점을_생성한다` | 거점을 생성해야 한다 | `create + save` 호출 확인 |
| `ID로_거점을_조회한다` | 존재하는 거점 조회 | `findOne` 호출 + 결과 반환 |
| | 존재하지 않는 거점 → null | null 반환 |
| `거점을_수정한다` | 존재하는 거점 수정 | 조회 → Object.assign 병합 → save |
| | 존재하지 않는 거점 → null | null 반환 (예외를 던지지 않음) |
| `거점을_삭제한다` | affected > 0 → true | delete 결과 boolean 변환 |
| | affected = 0 → false | 삭제 대상 없음 |

### 수정/삭제에서 예외를 던지지 않고 null/false를 반환하는 이유

Domain 레이어는 "데이터가 없다"는 사실만 전달합니다. 그것을 404로 변환할지 무시할지는 상위 레이어(Handler)가 결정합니다.

---

## HouseholdMemberService (9개 테스트)

| 메서드 | 테스트 케이스 | 검증 항목 |
|--------|-------------|-----------|
| `멤버를_조회한다` | userId + householdId로 조회 | `findOne({ where: { userId, householdId } })` |
| `ID로_멤버를_조회한다` | id로 조회 | `findOne({ where: { id } })` |
| `거점의_멤버_목록을_조회한다` | householdId로 목록 조회 | `find` + `relations: ['user']` 호출 확인 |
| `사용자의_거점_목록을_조회한다` | userId로 목록 조회 | `find` + `relations: ['household']` 호출 확인 |
| `멤버를_추가한다` | 멤버 추가 | `create + save` |
| `멤버를_저장한다` | 멤버 저장 | `save` |
| `멤버를_삭제한다` | affected > 0 → true | delete 결과 boolean 변환 |
| | affected = 0 → false | 삭제 대상 없음 |
| `거점의_admin_수를_조회한다` | admin 수 조회 | `count({ where: { householdId, role: 'admin' } })` |

### 조회 메서드가 4개인 이유

| 메서드 | 사용처 |
|--------|--------|
| `멤버를_조회한다(userId, householdId)` | HouseholdMemberGuard — 거점 소속 여부 확인 |
| `ID로_멤버를_조회한다(id)` | 역할 변경, 멤버 제거 — 대상 멤버 특정 |
| `거점의_멤버_목록을_조회한다(householdId)` | 멤버 목록 API — user 관계 로드 필요 |
| `사용자의_거점_목록을_조회한다(userId)` | 거점 목록 API — household 관계 로드 필요 |

### relations 인자를 검증하는 이유

`relations: ['user']`가 빠지면 응답에 `email`, `displayName`이 `undefined`가 됩니다. 이 실수는 런타임에서야 발견되므로 테스트에서 명시적으로 잡아야 합니다.

### admin 수 조회가 필요한 이유

마지막 admin 보호 로직의 핵심입니다. 이 메서드가 없으면 "admin이 자기 역할을 viewer로 바꿔서 거점에 admin이 0명이 되는" 상황이 발생합니다.
