import { BaseE2ETest } from '../../base-e2e.spec';

describe('Invitation (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let adminToken: string;
  let adminUserId: string;
  let householdId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  }, 60000);

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanDatabase();
    testSuite.mockMailService.sentEmails = [];

    // admin 사용자 생성
    const signupRes = await testSuite
      .request()
      .post('/api/auth/signup')
      .send({
        email: 'admin@example.com',
        password: 'password123',
        displayName: '관리자',
      });
    adminToken = signupRes.body.accessToken;

    const meRes = await testSuite
      .authenticatedRequest(adminToken)
      .get('/api/auth/me');
    adminUserId = meRes.body.id;

    // 거점 생성
    const householdRes = await testSuite
      .authenticatedRequest(adminToken)
      .post('/api/households')
      .send({ name: '초대 테스트 거점', kind: 'home' });
    householdId = householdRes.body.id;
  });

  // ── 초대 생성 ──

  describe('POST /api/households/:householdId/invitations', () => {
    it('admin이 링크형 초대를 생성해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('editor');
      expect(res.body.status).toBe('pending');
      expect(res.body.inviteeEmail).toBeNull();
      expect(res.body.householdName).toBe('초대 테스트 거점');
    });

    it('admin이 이메일 지정 초대를 생성해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'viewer', inviteeEmail: 'target@example.com' })
        .expect(201);

      expect(res.body.inviteeEmail).toBe('target@example.com');
      expect(res.body.role).toBe('viewer');
    });

    it('만료 일수를 지정할 수 있어야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor', expiresInDays: 14 })
        .expect(201);

      const expiresAt = new Date(res.body.expiresAt);
      const now = new Date();
      const diffDays =
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(13);
      expect(diffDays).toBeLessThan(15);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' })
        .expect(401);
    });

    it('비admin이 초대를 생성하면 403을 반환해야 한다', async () => {
      // editor 사용자 생성 및 추가
      const editorSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'editor@example.com',
          password: 'password123',
          displayName: '에디터',
        });

      const editorMe = await testSuite
        .authenticatedRequest(editorSignup.body.accessToken)
        .get('/api/auth/me');

      await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/members`)
        .send({ userId: editorMe.body.id, role: 'editor' });

      await testSuite
        .authenticatedRequest(editorSignup.body.accessToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'viewer' })
        .expect(403);
    });

    it('유효하지 않은 role이면 400을 반환해야 한다', async () => {
      await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'superadmin' })
        .expect(400);
    });
  });

  // ── 초대 목록 조회 ──

  describe('GET /api/households/:householdId/invitations', () => {
    it('admin이 대기 중인 초대 목록을 조회해야 한다', async () => {
      // 초대 2개 생성
      await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' });

      await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'viewer', inviteeEmail: 'test@example.com' });

      const res = await testSuite
        .authenticatedRequest(adminToken)
        .get(`/api/households/${householdId}/invitations`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('token');
      expect(res.body[0]).toHaveProperty('role');
    });
  });

  // ── 초대 취소 ──

  describe('DELETE /api/households/:householdId/invitations/:invitationId', () => {
    it('admin이 대기 중인 초대를 취소해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' });

      await testSuite
        .authenticatedRequest(adminToken)
        .delete(
          `/api/households/${householdId}/invitations/${createRes.body.id}`,
        )
        .expect(204);

      // 목록에서 사라졌는지 확인
      const listRes = await testSuite
        .authenticatedRequest(adminToken)
        .get(`/api/households/${householdId}/invitations`)
        .expect(200);

      expect(listRes.body).toHaveLength(0);
    });
  });

  // ── 토큰으로 초대 조회 (비인증) ──

  describe('GET /api/invitations/:token', () => {
    it('토큰으로 초대 정보를 조회할 수 있어야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' });

      const res = await testSuite
        .request()
        .get(`/api/invitations/${createRes.body.token}`)
        .expect(200);

      expect(res.body.householdName).toBe('초대 테스트 거점');
      expect(res.body.role).toBe('editor');
      expect(res.body.status).toBe('pending');
    });

    it('존재하지 않는 토큰이면 404를 반환해야 한다', async () => {
      await testSuite
        .request()
        .get('/api/invitations/nonexistent-token')
        .expect(404);
    });
  });

  // ── 초대 수락 ──

  describe('POST /api/invitations/:token/accept', () => {
    it('초대를 수락하면 거점 멤버로 추가되어야 한다', async () => {
      // 초대 생성
      const createRes = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' });

      // 새 사용자 생성
      const newUserSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          displayName: '새 사용자',
        });

      // 초대 수락
      await testSuite
        .authenticatedRequest(newUserSignup.body.accessToken)
        .post(`/api/invitations/${createRes.body.token}/accept`)
        .expect(200);

      // 멤버로 추가되었는지 확인
      const membersRes = await testSuite
        .authenticatedRequest(adminToken)
        .get(`/api/households/${householdId}/members`)
        .expect(200);

      const newMember = membersRes.body.find(
        (m: any) => m.email === 'newuser@example.com',
      );
      expect(newMember).toBeDefined();
      expect(newMember.role).toBe('editor');
    });

    it('이메일 초대는 지정된 이메일 사용자만 수락할 수 있어야 한다', async () => {
      // 이메일 지정 초대 생성
      const createRes = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'viewer', inviteeEmail: 'specific@example.com' });

      // 다른 이메일 사용자가 수락 시도
      const wrongUser = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
          displayName: '잘못된 사용자',
        });

      await testSuite
        .authenticatedRequest(wrongUser.body.accessToken)
        .post(`/api/invitations/${createRes.body.token}/accept`)
        .expect(403);

      // 올바른 이메일 사용자가 수락
      const correctUser = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'specific@example.com',
          password: 'password123',
          displayName: '올바른 사용자',
        });

      await testSuite
        .authenticatedRequest(correctUser.body.accessToken)
        .post(`/api/invitations/${createRes.body.token}/accept`)
        .expect(200);
    });

    it('이미 멤버인 사용자가 수락하면 409를 반환해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' });

      // admin이 수락 시도 (이미 멤버)
      await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/invitations/${createRes.body.token}/accept`)
        .expect(409);
    });

    it('취소된 초대를 수락하면 400을 반환해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' });

      // 초대 취소
      await testSuite
        .authenticatedRequest(adminToken)
        .delete(
          `/api/households/${householdId}/invitations/${createRes.body.id}`,
        );

      // 수락 시도
      const newUser = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'late@example.com',
          password: 'password123',
          displayName: '늦은 사용자',
        });

      await testSuite
        .authenticatedRequest(newUser.body.accessToken)
        .post(`/api/invitations/${createRes.body.token}/accept`)
        .expect(400);
    });

    it('인증 없이 수락하면 401을 반환해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(adminToken)
        .post(`/api/households/${householdId}/invitations`)
        .send({ role: 'editor' });

      await testSuite
        .request()
        .post(`/api/invitations/${createRes.body.token}/accept`)
        .expect(401);
    });
  });
});
