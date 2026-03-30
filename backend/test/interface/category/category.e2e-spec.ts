import { BaseE2ETest } from '../../base-e2e.spec';

describe('Category (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;
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

    const signupRes = await testSuite
      .request()
      .post('/api/auth/signup')
      .send({
        email: 'category-test@example.com',
        password: 'password123',
        displayName: '카테고리 테스트',
      });
    accessToken = signupRes.body.accessToken;

    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '카테고리 테스트 거점', kind: 'home' });
    householdId = householdRes.body.id;
  });

  // ── CRUD ──

  describe('POST /api/households/:householdId/categories', () => {
    it('카테고리를 생성해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '식료품', sortOrder: 0 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('식료품');
      expect(res.body.householdId).toBe(householdId);
      expect(res.body.sortOrder).toBe(0);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '식료품' })
        .expect(401);
    });

    it('비멤버가 접근하면 403을 반환해야 한다', async () => {
      const otherSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'other@example.com',
          password: 'password123',
          displayName: '다른 사용자',
        });

      await testSuite
        .authenticatedRequest(otherSignup.body.accessToken)
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '식료품' })
        .expect(403);
    });
  });

  describe('GET /api/households/:householdId/categories', () => {
    it('카테고리 목록을 조회해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '식료품', sortOrder: 0 });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '생활용품', sortOrder: 1 });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/categories`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('식료품');
      expect(res.body[1].name).toBe('생활용품');
    });
  });

  describe('GET /api/households/:householdId/categories/:id', () => {
    it('카테고리를 단건 조회해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '식료품' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/categories/${createRes.body.id}`)
        .expect(200);

      expect(res.body.name).toBe('식료품');
    });
  });

  describe('PUT /api/households/:householdId/categories/:id', () => {
    it('카테고리를 수정해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '식료품' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(
          `/api/households/${householdId}/categories/${createRes.body.id}`,
        )
        .send({ name: '음식', sortOrder: 5 })
        .expect(200);

      expect(res.body.name).toBe('음식');
      expect(res.body.sortOrder).toBe(5);
    });
  });

  describe('DELETE /api/households/:householdId/categories/:id', () => {
    it('카테고리를 삭제해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories`)
        .send({ name: '삭제할 카테고리' });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(
          `/api/households/${householdId}/categories/${createRes.body.id}`,
        )
        .expect(204);

      const listRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/categories`)
        .expect(200);

      expect(listRes.body).toHaveLength(0);
    });
  });

  // ── 다른 거점에서 가져오기 ──

  describe('POST /api/households/:householdId/categories/copy', () => {
    it('다른 거점의 카테고리를 복사해야 한다', async () => {
      // 원본 거점에 카테고리 생성
      const sourceHousehold = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '원본 거점' });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${sourceHousehold.body.id}/categories`)
        .send({ name: '식료품', sortOrder: 0 });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${sourceHousehold.body.id}/categories`)
        .send({ name: '생활용품', sortOrder: 1 });

      // 대상 거점으로 복사
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories/copy`)
        .send({ sourceHouseholdId: sourceHousehold.body.id })
        .expect(201);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].householdId).toBe(householdId);
      expect(res.body[0].name).toBe('식료품');
      expect(res.body[1].name).toBe('생활용품');

      // 원본은 그대로 유지
      const sourceList = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${sourceHousehold.body.id}/categories`)
        .expect(200);
      expect(sourceList.body).toHaveLength(2);
    });

    it('원본 거점에 카테고리가 없으면 빈 배열을 반환해야 한다', async () => {
      const emptyHousehold = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '빈 거점' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/categories/copy`)
        .send({ sourceHouseholdId: emptyHousehold.body.id })
        .expect(201);

      expect(res.body).toHaveLength(0);
    });
  });
});
