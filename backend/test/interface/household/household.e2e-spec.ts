import { BaseE2ETest } from '../../base-e2e.spec';

describe('Household (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  }, 60000);

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanDatabase();
    testSuite.mockMailService.sentEmails = [];

    // 테스트 사용자 생성
    const signupRes = await testSuite
      .request()
      .post('/api/auth/signup')
      .send({
        email: 'household-test@example.com',
        password: 'password123',
        displayName: '거점 테스트 사용자',
      });

    accessToken = signupRes.body.accessToken;

    const meRes = await testSuite
      .authenticatedRequest(accessToken)
      .get('/api/auth/me');
    userId = meRes.body.id;
  });

  // ── 거점 CRUD ──

  describe('POST /api/households', () => {
    it('거점을 생성하고 생성자를 admin으로 등록해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '우리 가족', kind: 'home' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('우리 가족');
      expect(res.body.kind).toBe('home');

      // 생성자가 admin 멤버로 등록되었는지 확인
      const membersRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${res.body.id}/members`)
        .expect(200);

      expect(membersRes.body).toHaveLength(1);
      expect(membersRes.body[0].userId).toBe(userId);
      expect(membersRes.body[0].role).toBe('admin');
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post('/api/households')
        .send({ name: '테스트' })
        .expect(401);
    });
  });

  describe('GET /api/households', () => {
    it('내가 속한 거점 목록을 조회해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '거점 A' });

      await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '거점 B' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get('/api/households')
        .expect(200);

      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /api/households/:householdId', () => {
    it('거점 상세를 조회해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '상세 조회 테스트' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${createRes.body.id}`)
        .expect(200);

      expect(res.body.name).toBe('상세 조회 테스트');
    });

    it('비멤버가 접근하면 403을 반환해야 한다', async () => {
      // 다른 사용자 생성
      const otherSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'other@example.com',
          password: 'password123',
          displayName: '다른 사용자',
        });

      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '비공개 거점' });

      await testSuite
        .authenticatedRequest(otherSignup.body.accessToken)
        .get(`/api/households/${createRes.body.id}`)
        .expect(403);
    });
  });

  describe('PUT /api/households/:householdId', () => {
    it('admin이 거점 정보를 수정해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '원래 이름' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${createRes.body.id}`)
        .send({ name: '변경된 이름' })
        .expect(200);

      expect(res.body.name).toBe('변경된 이름');
    });
  });

  describe('DELETE /api/households/:householdId', () => {
    it('admin이 거점을 삭제해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '삭제할 거점' });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(`/api/households/${createRes.body.id}`)
        .expect(204);
    });
  });

  // ── 멤버 관리 ──

  describe('POST /api/households/:householdId/members', () => {
    let householdId: string;
    let otherUserId: string;
    let otherAccessToken: string;

    beforeEach(async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '멤버 테스트 거점' });
      householdId = createRes.body.id;

      const otherSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'member@example.com',
          password: 'password123',
          displayName: '새 멤버',
        });
      otherAccessToken = otherSignup.body.accessToken;

      const otherMe = await testSuite
        .authenticatedRequest(otherAccessToken)
        .get('/api/auth/me');
      otherUserId = otherMe.body.id;
    });

    it('admin이 멤버를 추가해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/members`)
        .send({ userId: otherUserId, role: 'editor' })
        .expect(201);

      expect(res.body.userId).toBe(otherUserId);
      expect(res.body.role).toBe('editor');
    });

    it('이미 멤버이면 409를 반환해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/members`)
        .send({ userId: otherUserId, role: 'editor' });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/members`)
        .send({ userId: otherUserId, role: 'viewer' })
        .expect(409);
    });

    it('비admin이 멤버를 추가하면 403을 반환해야 한다', async () => {
      // editor로 추가
      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/members`)
        .send({ userId: otherUserId, role: 'editor' });

      // editor가 멤버 추가 시도
      const thirdSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'third@example.com',
          password: 'password123',
          displayName: '세번째',
        });
      const thirdMe = await testSuite
        .authenticatedRequest(thirdSignup.body.accessToken)
        .get('/api/auth/me');

      await testSuite
        .authenticatedRequest(otherAccessToken)
        .post(`/api/households/${householdId}/members`)
        .send({ userId: thirdMe.body.id, role: 'viewer' })
        .expect(403);
    });
  });

  describe('PATCH /api/households/:householdId/members/:memberId/role', () => {
    it('admin이 멤버의 역할을 변경해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '역할 변경 테스트' });

      const otherSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'rolechange@example.com',
          password: 'password123',
          displayName: '역할 변경',
        });
      const otherMe = await testSuite
        .authenticatedRequest(otherSignup.body.accessToken)
        .get('/api/auth/me');

      const addRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${createRes.body.id}/members`)
        .send({ userId: otherMe.body.id, role: 'editor' });

      await testSuite
        .authenticatedRequest(accessToken)
        .patch(
          `/api/households/${createRes.body.id}/members/${addRes.body.id}/role`,
        )
        .send({ role: 'viewer' })
        .expect(200);
    });
  });

  describe('DELETE /api/households/:householdId/members/:memberId', () => {
    it('admin이 멤버를 제거해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '멤버 제거 테스트' });

      const otherSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'remove@example.com',
          password: 'password123',
          displayName: '제거 대상',
        });
      const otherMe = await testSuite
        .authenticatedRequest(otherSignup.body.accessToken)
        .get('/api/auth/me');

      const addRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${createRes.body.id}/members`)
        .send({ userId: otherMe.body.id, role: 'editor' });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(
          `/api/households/${createRes.body.id}/members/${addRes.body.id}`,
        )
        .expect(204);
    });
  });
});
