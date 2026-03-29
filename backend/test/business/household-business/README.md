# Household Business 단위 테스트

**파일**: `household-business.service.spec.ts`
**테스트 대상**: `src/business/household-business/household-business.service.ts`
**테스트 수**: 9개

## Mock 구성

```typescript
const mockHouseholdContextService = {
  거점을_생성한다: jest.fn(),
  거점_목록을_조회한다: jest.fn(),
  거점_상세를_조회한다: jest.fn(),
  거점을_수정한다: jest.fn(),
  거점을_삭제한다: jest.fn(),
  멤버_목록을_조회한다: jest.fn(),
  멤버를_추가한다: jest.fn(),
  멤버_역할을_변경한다: jest.fn(),
  멤버를_제거한다: jest.fn(),
};
```

## 테스트 케이스 상세

### 9개 메서드 — 각각 1개 테스트

| 메서드 | 검증 |
|--------|------|
| `거점을_생성한다(data)` | context가 `data`로 호출 + 결과 반환 |
| `거점_목록을_조회한다(userId)` | context가 `userId`로 호출 + 결과 반환 |
| `거점_상세를_조회한다(id)` | context가 `id`로 호출 + 결과 반환 |
| `거점을_수정한다(id, data)` | context가 `(id, data)`로 호출 + 결과 반환 |
| `거점을_삭제한다(id)` | context가 `id`로 호출 |
| `멤버_목록을_조회한다(householdId)` | context가 `householdId`로 호출 + 결과 반환 |
| `멤버를_추가한다(data)` | context가 `data`로 호출 + 결과 반환 |
| `멤버_역할을_변경한다(memberId, reqUserId, data)` | context가 `(memberId, reqUserId, data)`로 호출 |
| `멤버를_제거한다(memberId, reqUserId)` | context가 `(memberId, reqUserId)`로 호출 |

## 인자 순서가 특히 중요한 메서드

### 멤버_역할을_변경한다

```typescript
expect(householdContextService.멤버_역할을_변경한다).toHaveBeenCalledWith(
  'member-1',           // memberId — 역할을 변경할 대상
  'requesting-user',    // requestingUserId — 요청한 사람
  { role: 'viewer' },   // data — 새 역할
);
```

이 메서드는 인자가 3개이고, 앞 2개가 모두 `string`(UUID)입니다. 순서가 바뀌면:
- `memberId`와 `requestingUserId`가 뒤바뀜
- Handler에서 "자기 자신 변경 금지" 체크가 오동작
- 다른 사람의 역할을 변경하려 했는데 본인이 차단되거나, 반대로 본인 변경이 허용되는 보안 버그

### 멤버를_제거한다

```typescript
expect(householdContextService.멤버를_제거한다).toHaveBeenCalledWith(
  'member-1',           // memberId
  'requesting-user',    // requestingUserId
);
```

같은 이유로 순서 검증이 필요합니다.
