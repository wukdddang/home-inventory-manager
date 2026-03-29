# HouseholdService + HouseholdMemberService 단위 테스트

**파일**: `household.service.spec.ts`, `household-member.service.spec.ts`
**테스트 대상**: `src/domain/household/household.service.ts`, `src/domain/household/household-member.service.ts`
**테스트 수**: 14개 (5 + 9)

---

## HouseholdService (5개)

### Mock 구성

```typescript
const mockHouseholdRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};
```

### 테스트 케이스 상세

#### 1. 거점을_생성한다 — 거점을 생성해야 한다

```
Given: create → mockHousehold, save → mockHousehold
When:  service.거점을_생성한다({ name: '우리 가족', kind: 'home' })
Then:  ① create가 { name, kind }로 호출
       ② save가 create 결과로 호출
       ③ 반환값 확인
```

#### 2-3. ID로_거점을_조회한다 — 존재/부재

```
[존재] findOne → mockHousehold → 결과 반환
[부재] findOne → null → null 반환
```

UserService의 조회 메서드와 동일한 패턴입니다.

#### 4-5. 거점을_수정한다 — 존재/부재

```
[존재]
  Given: ID로 조회 → mockHousehold 반환
  When:  service.거점을_수정한다(id, { name: '변경된 이름' })
  Then:  ① 내부적으로 findOne 호출
         ② Object.assign으로 필드 병합
         ③ save 호출
         ④ 수정된 객체 반환

[부재]
  Given: ID로 조회 → null
  When:  service.거점을_수정한다(id, data)
  Then:  null 반환 (예외 던지지 않음)
```

**수정 메서드가 null을 반환하는 이유**: Domain 레이어는 "데이터가 없다"는 사실만 전달합니다. 이것을 404 에러로 변환할지, 새로 생성할지(upsert), 무시할지는 상위 레이어(Handler)가 비즈니스 규칙에 따라 결정합니다. Domain에서 예외를 던져버리면 Handler의 선택지가 줄어듭니다.

#### 6-7. 거점을_삭제한다 — affected 체크

```
[삭제됨]  delete → { affected: 1 } → true
[없음]    delete → { affected: 0 } → false
```

---

## HouseholdMemberService (9개)

### Mock 구성

```typescript
const mockMemberRepository = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};
```

### 테스트 케이스 상세

#### 1. 멤버를_조회한다 — userId + householdId로 조회

```
Given: findOne → mockMember
When:  service.멤버를_조회한다('user-1', 'household-1')
Then:  findOne이 { where: { userId: 'user-1', householdId: 'household-1' } }로 호출됨
```

**이 메서드의 핵심 사용처**: `HouseholdMemberGuard`. 모든 거점 관련 API 요청 시 이 메서드로 "요청자가 해당 거점의 멤버인지" 확인합니다. 두 필드(userId, householdId)가 모두 정확하게 전달되는지 검증하는 것이 중요합니다.

#### 2. ID로_멤버를_조회한다 — id로 조회

```
Given: findOne → mockMember
When:  service.ID로_멤버를_조회한다('member-1')
Then:  findOne이 { where: { id: 'member-1' } }로 호출됨
```

역할 변경, 멤버 제거 시 대상 멤버를 특정하는 데 사용됩니다. URL의 `:memberId` 파라미터에서 받은 값을 그대로 전달합니다.

#### 3. 거점의_멤버_목록을_조회한다 — relations 포함 조회

```
Given: find → [mockMember1, mockMember2]
When:  service.거점의_멤버_목록을_조회한다('household-1')
Then:  find가 {
         where: { householdId: 'household-1' },
         relations: ['user'],
         order: { createdAt: 'ASC' }
       }로 호출됨
```

**`relations: ['user']`를 검증하는 이유**: 멤버 목록 API는 각 멤버의 email, displayName을 반환해야 합니다. `relations`가 빠지면 TypeORM이 user 테이블을 JOIN하지 않아 `member.user`가 `undefined`가 됩니다. 이 실수는 타입 체크에서도 잡히지 않고, 런타임에서 응답의 email/displayName이 `undefined`로 내려가는 사일런트 버그가 됩니다.

#### 4. 사용자의_거점_목록을_조회한다 — relations 포함 조회

```
Given: find → [mockMember1, mockMember2]
When:  service.사용자의_거점_목록을_조회한다('user-1')
Then:  find가 {
         where: { userId: 'user-1' },
         relations: ['household'],
         order: { createdAt: 'ASC' }
       }로 호출됨
```

`GET /api/households` API에서 사용됩니다. HouseholdMember를 통해 Household 정보를 가져오므로 `relations: ['household']`이 필수입니다.

#### 5. 멤버를_추가한다 — create + save

```
Given: create → mockMember, save → mockMember
When:  service.멤버를_추가한다({ userId, householdId, role: 'editor' })
Then:  create + save 체인 호출 확인
```

#### 6. 멤버를_저장한다 — save

역할 변경 시 `member.role = newRole` 후 이 메서드로 저장합니다.

#### 7-8. 멤버를_삭제한다 — affected 체크

HouseholdService.거점을_삭제한다와 동일한 패턴입니다.

#### 9. 거점의_admin_수를_조회한다

```
Given: count → 2
When:  service.거점의_admin_수를_조회한다('household-1')
Then:  count가 { where: { householdId: 'household-1', role: 'admin' } }로 호출됨
```

**이 메서드가 존재하는 이유**: ChangeMemberRoleHandler에서 "마지막 admin의 역할 변경 방지" 로직에 사용됩니다. admin이 1명뿐인데 그 사람의 역할을 변경하면 거점에 admin이 0명이 되어 아무도 멤버 관리를 할 수 없게 됩니다. `count` 쿼리의 조건에 `role: 'admin'`이 정확히 포함되는지 검증합니다.
