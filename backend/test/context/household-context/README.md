# Household Context 단위 테스트

**파일**: `household-context.service.spec.ts`, `handlers/*.spec.ts` (4개 파일)
**테스트 대상**: `src/context/household-context/`
**테스트 수**: 19개 (핸들러 10 + Context Service 9)

Household Context는 거점 CRUD와 멤버 관리의 비즈니스 규칙을 구현합니다. Auth Context와 달리 **다중 사용자 권한 로직**이 핵심입니다.

---

## 핸들러 테스트

### CreateHouseholdHandler (1개) — `handlers/create-household.handler.spec.ts`

#### Mock 구성
```typescript
mockHouseholdService       = { 거점을_생성한다 }
mockHouseholdMemberService = { 멤버를_추가한다 }
```

#### 1. 거점 생성 + 생성자 admin 멤버 등록

```
Given: 거점 생성 → mockHousehold
       멤버 추가 → mockMember
When:  handler.execute(CreateHouseholdCommand('user-1', '우리 가족', 'home'))
Then:  ① 거점을_생성한다({ name: '우리 가족', kind: 'home' }) 호출
       ② 멤버를_추가한다({ userId: 'user-1', householdId, role: 'admin' }) 호출
       ③ HouseholdResult 반환
```

**테스트가 1개뿐인 이유**: 이 핸들러에는 분기가 없습니다. 거점 이름 중복 체크 같은 규칙이 없고, 생성은 항상 성공합니다.

**하지만 이 1개 테스트가 검증하는 핵심**: "거점 생성"과 "멤버 등록"이 **함께** 일어나는가. 이것은 2단계 트랜잭션입니다. 만약 멤버 등록 호출이 빠지면 거점은 존재하지만 아무도 접근할 수 없는 **고아 거점**이 됩니다. 생성자조차 HouseholdMemberGuard에서 차단됩니다.

---

### AddMemberHandler (2개) — `handlers/add-member.handler.spec.ts`

#### Mock 구성
```typescript
mockHouseholdMemberService = { 멤버를_조회한다, 멤버를_추가한다 }
```

#### 1. 멤버 추가 성공 (Happy Path)

```
Given: 멤버를_조회한다(userId, householdId) → null (기존 멤버 아님)
       멤버를_추가한다 → mockMember
When:  handler.execute(AddMemberCommand('household-1', 'user-2', 'editor'))
Then:  ① 멤버를_조회한다 호출 (중복 체크)
       ② 멤버를_추가한다({ userId, householdId, role }) 호출
```

**중복 체크를 먼저 하는 이유**: DB UNIQUE 제약조건(`userId + householdId`)이 있지만, DB 에러 메시지(`unique violation`)는 클라이언트에게 불친절합니다. 서비스 레벨에서 먼저 체크하면 "이미 해당 거점의 멤버입니다"라는 명확한 메시지를 줄 수 있습니다.

#### 2. 이미 멤버이면 ConflictException

```
Given: 멤버를_조회한다 → mockMember (이미 존재)
When:  handler.execute(AddMemberCommand)
Then:  ConflictException('이미 해당 거점의 멤버입니다')
```

---

### ChangeMemberRoleHandler (4개) — `handlers/change-member-role.handler.spec.ts`

#### Mock 구성
```typescript
mockHouseholdMemberService = { ID로_멤버를_조회한다, 거점의_admin_수를_조회한다, 멤버를_저장한다 }
```

이 핸들러는 4개의 실행 경로가 있으며, 각각 다른 위험을 방지합니다.

#### 1. 역할 변경 성공 (Happy Path)

```
Given: ID로 조회 → { id, userId: 'other-user', householdId, role: 'editor' }
When:  handler.execute(ChangeMemberRoleCommand('member-1', 'requesting-user', 'viewer'))
Then:  ① member.role이 'viewer'로 변경됨
       ② 멤버를_저장한다 호출
```

**`requesting-user`와 `other-user`가 다른 이유**: "자기 자신 변경 금지" 규칙을 우회하기 위해 요청자와 대상이 다른 사용자여야 합니다.

#### 2. 자기 자신의 역할 변경 → BadRequestException

```
Given: ID로 조회 → { userId: 'user-1', ... }
When:  handler.execute(ChangeMemberRoleCommand('member-1', 'user-1', 'viewer'))
       ←── requesting userId와 member.userId가 동일
Then:  BadRequestException('자기 자신의 역할은 변경할 수 없습니다')
```

**이 규칙이 존재하는 이유**: admin이 자기 역할을 viewer로 낮추면 거점을 관리할 수 없게 됩니다. "다른 admin이 있으면 허용하고, 마지막 admin이면 거부"하는 복잡한 로직 대신, 단순하게 "자기 자신은 불가"로 정했습니다.

#### 3. 마지막 admin의 역할 변경 → BadRequestException

```
Given: ID로 조회 → { userId: 'other-user', role: 'admin', householdId }
       거점의_admin_수를_조회한다 → 1  ← 딱 1명
When:  handler.execute(ChangeMemberRoleCommand('member-1', 'requesting-user', 'editor'))
Then:  BadRequestException('마지막 관리자의 역할은 변경할 수 없습니다')
```

**이 검증이 `role: 'admin'`인 멤버에게만 적용되는 이유**: editor나 viewer의 역할을 변경할 때는 admin 수가 줄지 않으므로 체크할 필요가 없습니다. 핸들러 코드에서 `member.role === 'admin'`일 때만 admin 수를 조회합니다.

**admin이 2명이면 허용되는 시나리오**: admin A가 admin B를 editor로 변경 → admin이 1명(A)만 남음 → 허용. 이때 admin 수는 2에서 1로 줄지만 0이 되지는 않으므로 안전합니다.

#### 4. 멤버 없음 → NotFoundException

잘못된 `memberId`로 요청 시.

---

### RemoveMemberHandler (3개) — `handlers/remove-member.handler.spec.ts`

#### Mock 구성
```typescript
mockHouseholdMemberService = { ID로_멤버를_조회한다, 멤버를_삭제한다 }
```

#### 1. 멤버 제거 성공

```
Given: ID로 조회 → { userId: 'other-user', ... }
When:  handler.execute(RemoveMemberCommand('member-1', 'requesting-user'))
Then:  멤버를_삭제한다('member-1') 호출
```

#### 2. 자기 자신 제거 → BadRequestException

```
Given: ID로 조회 → { userId: 'user-1', ... }
When:  handler.execute(RemoveMemberCommand('member-1', 'user-1'))
Then:  BadRequestException('자기 자신을 제거할 수 없습니다')
```

#### 3. 멤버 없음 → NotFoundException

**ChangeMemberRole과 달리 "마지막 admin 보호" 케이스가 없는 이유**:

이 핸들러에는 마지막 admin 체크가 불필요합니다. 논리적으로 불가능한 시나리오이기 때문입니다:

1. admin이 1명뿐인 경우:
   - 그 admin이 자기 자신을 제거? → "자기 자신 제거 금지"에서 차단
   - 다른 사람이 그 admin을 제거? → 다른 사람은 admin이 아니므로 RolesGuard에서 차단

2. admin이 2명인 경우:
   - admin A가 admin B를 제거 → admin 1명 남음 → 허용 (0명이 되지 않음)

따라서 "자기 자신 제거 금지" 규칙 하나로 마지막 admin 보호가 자동으로 달성됩니다.

---

## Context Service 테스트 — `household-context.service.spec.ts`

### 9개 메서드 × 1개 테스트

| 메서드 | 검증 |
|--------|------|
| `거점을_생성한다` | `commandBus.execute(expect.any(CreateHouseholdCommand))` |
| `거점을_수정한다` | `commandBus.execute(expect.any(UpdateHouseholdCommand))` |
| `거점을_삭제한다` | `commandBus.execute(expect.any(DeleteHouseholdCommand))` |
| `거점_목록을_조회한다` | `queryBus.execute(expect.any(GetHouseholdListQuery))` |
| `거점_상세를_조회한다` | `queryBus.execute(expect.any(GetHouseholdDetailQuery))` |
| `멤버_목록을_조회한다` | `queryBus.execute(expect.any(GetMemberListQuery))` |
| `멤버를_추가한다` | `commandBus.execute(expect.any(AddMemberCommand))` |
| `멤버_역할을_변경한다` | `commandBus.execute(expect.any(ChangeMemberRoleCommand))` |
| `멤버를_제거한다` | `commandBus.execute(expect.any(RemoveMemberCommand))` |

Auth Context Service와 동일한 패턴입니다.
