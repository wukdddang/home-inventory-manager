import { BaseE2ETest } from '../../base-e2e.spec';

describe('Auth (e2e)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.beforeAll();
  }, 30000);

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanDatabase();
    testSuite.mockMailService.sentEmails = [];
  });

  describe('POST /api/auth/signup', () => {
    it('회원가입을 처리하고 토큰을 반환해야 한다', async () => {
      const res = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          displayName: '새 사용자',
        })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
    });

    it('인증 이메일을 발송해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'verify@example.com',
          password: 'password123',
          displayName: '인증 테스트',
        })
        .expect(201);

      expect(testSuite.mockMailService.sentEmails).toHaveLength(1);
      expect(testSuite.mockMailService.sentEmails[0].to).toBe(
        'verify@example.com',
      );
    });

    it('중복 이메일이면 409를 반환해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'dup@example.com',
          password: 'password123',
          displayName: '첫번째',
        })
        .expect(201);

      await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'dup@example.com',
          password: 'password456',
          displayName: '두번째',
        })
        .expect(409);
    });

    it('유효하지 않은 이메일이면 400을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'not-an-email',
          password: 'password123',
          displayName: '테스트',
        })
        .expect(400);
    });

    it('비밀번호가 8자 미만이면 400을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'short@example.com',
          password: 'short',
          displayName: '테스트',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'login@example.com',
          password: 'password123',
          displayName: '로그인 테스트',
        });
    });

    it('올바른 자격증명으로 로그인해야 한다', async () => {
      const res = await testSuite
        .request()
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('잘못된 비밀번호이면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });

    it('존재하지 않는 이메일이면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/auth/login')
        .send({
          email: 'notexist@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('인증된 사용자 정보를 반환해야 한다', async () => {
      const signupRes = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'me@example.com',
          password: 'password123',
          displayName: '내 정보',
        });

      const res = await testSuite
        .authenticatedRequest(signupRes.body.accessToken)
        .get('/api/auth/me')
        .expect(200);

      expect(res.body.email).toBe('me@example.com');
      expect(res.body.displayName).toBe('내 정보');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('refreshTokenHash');
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite.request().get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('로그아웃을 처리해야 한다', async () => {
      const signupRes = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'logout@example.com',
          password: 'password123',
          displayName: '로그아웃',
        });

      const res = await testSuite
        .authenticatedRequest(signupRes.body.accessToken)
        .post('/api/auth/logout')
        .expect(200);

      expect(res.body.message).toBe('로그아웃되었습니다');
    });
  });

  describe('GET /api/auth/verify-email', () => {
    it('이메일 인증을 완료해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'verify-e2e@example.com',
          password: 'password123',
          displayName: '인증 테스트',
        });

      const token = testSuite.mockMailService.sentEmails[0].token;

      const res = await testSuite
        .request()
        .get(`/api/auth/verify-email?token=${token}`)
        .expect(200);

      expect(res.body.message).toBe('이메일 인증이 완료되었습니다');
    });

    it('유효하지 않은 토큰이면 404를 반환해야 한다', async () => {
      await testSuite
        .request()
        .get('/api/auth/verify-email?token=invalid-token')
        .expect(404);
    });
  });

  describe('PATCH /api/auth/password', () => {
    let accessToken: string;

    beforeEach(async () => {
      const signupRes = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'pwd@example.com',
          password: 'old-password123',
          displayName: '비밀번호 변경',
        });
      accessToken = signupRes.body.accessToken;
    });

    it('비밀번호를 변경해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .patch('/api/auth/password')
        .send({
          currentPassword: 'old-password123',
          newPassword: 'new-password123',
        })
        .expect(200);

      expect(res.body.message).toContain('비밀번호가 변경되었습니다');

      // 새 비밀번호로 로그인 가능해야 한다
      await testSuite
        .request()
        .post('/api/auth/login')
        .send({
          email: 'pwd@example.com',
          password: 'new-password123',
        })
        .expect(200);
    });

    it('현재 비밀번호가 틀리면 401을 반환해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .patch('/api/auth/password')
        .send({
          currentPassword: 'wrong-password',
          newPassword: 'new-password123',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('새 토큰을 발급해야 한다', async () => {
      const signupRes = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'refresh@example.com',
          password: 'password123',
          displayName: '토큰 갱신',
        });

      const res = await testSuite
        .request()
        .post('/api/auth/refresh')
        .send({ refreshToken: signupRes.body.refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
    });
  });
});
