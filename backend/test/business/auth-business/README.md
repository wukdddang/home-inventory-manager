# Auth Business 단위 테스트

**파일**: `auth-business.service.spec.ts`
**테스트 대상**: `src/business/auth-business/auth-business.service.ts`
**테스트 수**: 7개

## Mock 구성

```typescript
const mockAuthContextService = {
  회원가입을_한다: jest.fn(),
  로그인을_한다: jest.fn(),
  토큰을_갱신한다: jest.fn(),
  로그아웃을_한다: jest.fn(),
  이메일_인증을_완료한다: jest.fn(),
  비밀번호를_변경한다: jest.fn(),
  내_정보를_조회한다: jest.fn(),
};
```

## 테스트 케이스 상세

### 7개 메서드 — 각각 1개 테스트

| 메서드 | Given | When | Then |
|--------|-------|------|------|
| `회원가입을_한다` | context → `{ at, rt }` | `service.회원가입을_한다(data)` | context가 `data`로 호출 + 결과 반환 |
| `로그인을_한다` | context → `{ at, rt }` | `service.로그인을_한다(data)` | context가 `data`로 호출 + 결과 반환 |
| `토큰을_갱신한다` | context → `{ at, rt }` | `service.토큰을_갱신한다('user-1', 'rt')` | context가 `('user-1', 'rt')`로 호출 |
| `로그아웃을_한다` | context → void | `service.로그아웃을_한다('user-1')` | context가 `('user-1')`로 호출 |
| `이메일_인증을_완료한다` | context → void | `service.이메일_인증을_완료한다('token')` | context가 `('token')`으로 호출 |
| `비밀번호를_변경한다` | context → void | `service.비밀번호를_변경한다(data)` | context가 `data`로 호출 |
| `내_정보를_조회한다` | context → profile | `service.내_정보를_조회한다('user-1')` | context가 `('user-1')`로 호출 + 결과 반환 |

## 왜 단순 위임인데 테스트가 필요한가

현재 Business 레이어는 Context Service를 그대로 호출하는 위임 역할입니다. 그럼에도 테스트를 두는 이유:

### 1. 레이어 간 연결 계약 검증

Context Service의 메서드 시그니처가 변경되면(예: 파라미터 추가/제거) 이 테스트가 **컴파일 에러 없이도** 즉시 실패합니다. TypeScript의 타입 체크만으로는 `any` 타입이 섞이거나, 선택적 파라미터가 추가된 경우를 잡지 못할 수 있습니다.

### 2. 인자 전달 정확성

`토큰을_갱신한다('user-1', 'refresh-token')`에서 두 string 인자의 순서가 바뀌어도 타입 에러가 나지 않습니다. 테스트에서 `toHaveBeenCalledWith('user-1', 'refresh-token')`로 순서를 명시적으로 검증합니다.

### 3. 향후 비즈니스 로직 추가 시 회귀 방지

예정된 추가 로직:
- 회원가입 시 기본 거점 유형 4종 시드 (HouseholdKindDefinition)
- 로그인 시 마지막 접속 거점 기록
- 비밀번호 변경 시 알림 발송

이런 로직이 추가되면 기존 위임 동작이 깨지지 않았는지 확인하는 회귀 테스트로 작동합니다.

## Context Service 테스트와의 차이

| 관점 | Context Service 테스트 | Business 테스트 |
|------|----------------------|----------------|
| 검증 방식 | `expect.any(Command)` — **타입만** | `toHaveBeenCalledWith(값)` — **구체적 인자** |
| 이유 | CQRS Bus 간접 호출 | 일반 메서드 직접 호출 |
| 잡는 버그 | 잘못된 Command 타입 전달 | 인자 순서/값 오류 |
