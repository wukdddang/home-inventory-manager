# UserService 단위 테스트

**파일**: `user.service.spec.ts`
**테스트 대상**: `src/domain/user/user.service.ts`
**테스트 수**: 5개

## Mock 구성

```typescript
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
```

실제 PostgreSQL 대신 가짜 Repository를 주입합니다. `getRepositoryToken(User)`로 NestJS의 `@InjectRepository(User)` 주입 토큰을 교체합니다.

## 테스트 케이스 상세

### 이메일로_사용자를_조회한다

#### 1. 이메일로 사용자를 조회해야 한다

```
Given: mockUserRepository.findOne이 User 객체를 반환하도록 설정
When:  service.이메일로_사용자를_조회한다('test@example.com') 호출
Then:  ① findOne이 { where: { email: 'test@example.com' } }로 호출됨
       ② 반환값이 mock User 객체와 일치
```

**검증하는 것**: 서비스가 Repository에 올바른 쿼리 조건(`email` 필드)을 전달하는가. 만약 실수로 `{ where: { id: email } }`로 작성하면 이 테스트가 실패합니다.

#### 2. 존재하지 않는 이메일이면 null을 반환해야 한다

```
Given: mockUserRepository.findOne이 null을 반환하도록 설정
When:  service.이메일로_사용자를_조회한다('notfound@example.com') 호출
Then:  반환값이 null
```

**왜 이 케이스가 필요한가**: 이 메서드의 null 반환은 LoginHandler에서 "이메일 없음 → UnauthorizedException" 분기의 전제 조건입니다. 만약 서비스가 null 대신 예외를 던지면 상위 레이어의 에러 핸들링이 깨집니다.

### ID로_사용자를_조회한다

#### 3. ID로 사용자를 조회해야 한다

```
Given: findOne이 User 객체 반환
When:  service.ID로_사용자를_조회한다('user-1') 호출
Then:  findOne이 { where: { id: 'user-1' } }로 호출됨
```

#### 4. 존재하지 않는 ID이면 null을 반환해야 한다

이메일 조회와 같은 패턴. RefreshTokenHandler, LogoutHandler, ChangePasswordHandler, GetMyProfileHandler 등 여러 핸들러에서 이 메서드의 null 반환에 의존합니다.

### 인증토큰으로_사용자를_조회한다

#### 5. 인증 토큰으로 사용자를 조회해야 한다

```
Given: findOne이 User 객체 반환
When:  service.인증토큰으로_사용자를_조회한다('token-123') 호출
Then:  findOne이 { where: { emailVerificationToken: 'token-123' } }로 호출됨
```

**이 메서드만 null 케이스가 없는 이유**: VerifyEmailHandler에서 null 체크를 하고 NotFoundException을 던지는데, 그 검증은 핸들러 테스트에서 합니다. Domain 레이어에서는 "올바른 컬럼으로 조회하는지"만 확인하면 충분합니다.

### 사용자를_생성한다

#### 6. 사용자를 생성해야 한다

```
Given: create가 User 객체 반환, save가 같은 객체 반환
When:  service.사용자를_생성한다({ email, passwordHash, displayName, emailVerificationToken }) 호출
Then:  ① create가 입력 데이터로 호출됨
       ② save가 create의 반환값으로 호출됨
       ③ 최종 반환값이 save의 결과와 일치
```

**create → save 2단계를 검증하는 이유**: TypeORM에서 `create`는 엔티티 메타데이터(기본값, 타입 변환 등)를 적용하고, `save`가 실제 DB에 저장합니다. `create` 없이 `save`만 호출하면 엔티티 데코레이터가 적용되지 않을 수 있습니다.

### 사용자를_저장한다

#### 7. 사용자를 저장해야 한다

```
Given: save가 User 객체 반환
When:  service.사용자를_저장한다(mockUser) 호출
Then:  save가 mockUser로 호출됨
```

이 메서드는 User 객체의 필드를 수정한 후 저장하는 용도입니다 (예: `user.refreshTokenHash = hash`, `user.lastLoginAt = new Date()`). 핸들러에서 직접 User 객체를 조작한 후 이 메서드로 저장합니다.
