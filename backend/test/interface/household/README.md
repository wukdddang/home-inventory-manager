# Household E2E 테스트

**파일**: `household.e2e-spec.ts`
**테스트 대상**: `src/interface/household/household.controller.ts`
**테스트 수**: 12개

## 테스트 환경

Auth E2E와 동일한 BaseE2ETest 인프라 사용. 차이점:

| 관점 | Auth E2E | Household E2E |
|------|----------|---------------|
| 인증 | 대부분 비인증 요청 | **모든 요청**에 JWT 필요 |
| 사전 설정 | 없음 | beforeEach에서 사용자 생성 + accessToken/userId 확보 |
| Guard 체인 | JwtAuthGuard 1개 | JwtAuthGuard + HouseholdMemberGuard + RolesGuard |
| 사용자 수 | 1명 | 테스트당 2~3명 (admin, editor, 비멤버) |

## beforeEach 설정

```typescript
beforeEach(async () => {
  await testSuite.cleanDatabase();          // DB 초기화
  testSuite.mockMailService.sentEmails = []; // 메일 기록 초기화

  // 테스트 사용자 생성 + 토큰/ID 확보
  const signupRes = await testSuite.request()
    .post('/api/auth/signup')
    .send({ email, password, displayName });
  accessToken = signupRes.body.accessToken;

  const meRes = await testSuite.authenticatedRequest(accessToken)
    .get('/api/auth/me');
  userId = meRes.body.id;
});
```

**beforeEach가 Auth E2E보다 무거운 이유**: Household API는 인증이 필수이므로, 매 테스트마다 사용자를 생성하고 accessToken을 확보해야 합니다.

---

## 엔드포인트별 테스트 상세

### POST /api/households (2개)

#### 1. 거점을 생성하고 생성자를 admin으로 등록해야 한다

```
Request:  POST /api/households (Bearer {accessToken})
Body:     { name: '우리 가족', kind: 'home' }
Expected: 201 + { id, name: '우리 가족', kind: 'home' }

추가 검증:
  GET /api/households/{id}/members → 200
  ① members.length === 1
  ② members[0].userId === userId (생성자)
  ③ members[0].role === 'admin'
```

**생성 후 멤버 조회까지 하는 이유**: 단위 테스트의 CreateHouseholdHandler에서는 "멤버를_추가한다가 호출되었는지"만 확인합니다. 하지만 E2E에서는 "실제 DB에 Household 레코드와 HouseholdMember 레코드가 **둘 다** 저장되었는지"를 확인합니다. 만약 트랜잭션이 실패하여 Household만 생성되고 Member가 없으면, 이 테스트의 멤버 조회에서 실패합니다.

#### 2. 인증 없이 접근하면 401을 반환해야 한다

```
Request:  POST /api/households (Authorization 헤더 없음)
Expected: 401
```

JwtAuthGuard 동작 검증.

---

### GET /api/households (1개)

#### 3. 내가 속한 거점 목록을 조회해야 한다

```
사전 조건: 거점 A, 거점 B 생성
Request:  GET /api/households
Expected: 200 + array.length === 2
```

**"내가 속한 거점만"을 검증하는 이유**: 이 API는 모든 거점을 반환하는 것이 아니라, HouseholdMember 테이블에서 현재 사용자의 userId로 필터링합니다. 다른 사용자의 거점이 포함되면 안 됩니다. (현재 테스트에서는 다른 사용자가 없으므로 개수 확인으로 충분합니다.)

---

### GET /api/households/:id (2개)

#### 4. 거점 상세를 조회해야 한다

```
사전 조건: 거점 생성
Request:  GET /api/households/{id}
Expected: 200 + { name: '상세 조회 테스트' }
```

#### 5. 비멤버가 접근하면 403을 반환해야 한다

```
사전 조건:
  ① 현재 사용자가 '비공개 거점' 생성
  ② 다른 사용자 생성 (signup)
Request:  GET /api/households/{id} (다른 사용자의 Bearer 토큰)
Expected: 403 Forbidden
```

**이 테스트가 E2E에서만 가능한 이유**: `HouseholdMemberGuard`는 컨트롤러의 `@UseGuards()` 데코레이터로 적용됩니다. 단위 테스트에서는 Guard가 실제로 연결되어 있는지 확인할 수 없습니다. E2E에서 다른 사용자로 요청을 보내야 Guard → DB 조회 → 403 반환의 전체 흐름을 검증합니다.

**테스트 설정이 복잡한 이유**: "비멤버"를 만들려면 다른 사용자를 별도로 생성해야 합니다. 이 사용자는 인증은 되지만(JwtAuthGuard 통과) 해당 거점의 멤버가 아니므로(HouseholdMemberGuard에서 차단) 403이 반환됩니다.

---

### PUT /api/households/:id (1개)

#### 6. admin이 거점 정보를 수정해야 한다

```
사전 조건: 거점 생성 (생성자 = admin)
Request:  PUT /api/households/{id} { name: '변경된 이름' }
Expected: 200 + { name: '변경된 이름' }
```

---

### DELETE /api/households/:id (1개)

#### 7. admin이 거점을 삭제해야 한다

```
사전 조건: 거점 생성
Request:  DELETE /api/households/{id}
Expected: 204 No Content
```

---

### POST /api/households/:id/members (3개)

#### 8. admin이 멤버를 추가해야 한다

```
사전 조건:
  ① 거점 생성
  ② 다른 사용자 생성 → otherUserId 확보
Request:  POST /api/households/{id}/members { userId: otherUserId, role: 'editor' }
Expected: 201 + { userId: otherUserId, role: 'editor' }
```

#### 9. 이미 멤버이면 409를 반환해야 한다

```
사전 조건: 같은 사용자를 editor로 이미 추가
Request:  POST /api/households/{id}/members { userId: same, role: 'viewer' }
Expected: 409 Conflict
```

#### 10. 비admin(editor)이 멤버를 추가하면 403을 반환해야 한다

```
사전 조건:
  ① admin이 거점 생성
  ② admin이 otherUser를 editor로 추가
  ③ 세번째 사용자 생성
Request:  POST /api/households/{id}/members (otherUser의 Bearer 토큰)
Body:     { userId: thirdUserId, role: 'viewer' }
Expected: 403 Forbidden
```

**이 테스트가 검증하는 Guard 체인**:

```
otherUser의 요청:
  ① JwtAuthGuard    → 통과 (유효한 JWT)
  ② HouseholdMemberGuard → 통과 (editor로 거점 소속)
  ③ RolesGuard      → 차단 (@Roles('admin')인데 role이 'editor')
  → 403 Forbidden
```

3개 Guard가 올바른 순서로 체인되어 작동하는지 확인합니다. 만약 Guard 순서가 잘못되어 RolesGuard가 HouseholdMemberGuard보다 먼저 실행되면 `req.householdMember`가 없어서 다른 에러가 발생합니다.

---

### PATCH /api/households/:id/members/:memberId/role (1개)

#### 11. admin이 멤버의 역할을 변경해야 한다

```
사전 조건:
  ① 거점 생성
  ② 다른 사용자를 editor로 추가 → memberId 확보
Request:  PATCH /api/households/{id}/members/{memberId}/role { role: 'viewer' }
Expected: 200
```

---

### DELETE /api/households/:id/members/:memberId (1개)

#### 12. admin이 멤버를 제거해야 한다

```
사전 조건:
  ① 거점 생성
  ② 다른 사용자를 editor로 추가 → memberId 확보
Request:  DELETE /api/households/{id}/members/{memberId}
Expected: 204 No Content
```

---

## E2E 테스트에서만 검증 가능한 것들 정리

| 검증 항목 | 단위 테스트 | E2E |
|-----------|:---------:|:---:|
| Handler 로직 분기 (if/else) | O | - |
| DTO 유효성 검사 (@IsEmail 등) | - | O |
| JwtAuthGuard 적용 여부 | - | O |
| HouseholdMemberGuard 적용 여부 | - | O |
| RolesGuard + @Roles 적용 여부 | - | O |
| Guard 3개의 실행 순서 | - | O |
| DB 트랜잭션 (거점 + 멤버 동시 생성) | - | O |
| 연속 동작 (비밀번호 변경 → 재로그인) | - | O |
| 응답에 민감 필드 미포함 | 간접 | O |
