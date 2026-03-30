import { BaseE2ETest } from '../../base-e2e.spec';

describe('ExpirationAlertRule (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;
  let householdId: string;
  let productId: string;

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
      .send({ email: 'exp-rule@example.com', password: 'password123', displayName: '만료규칙' });
    accessToken = signupRes.body.accessToken;

    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '만료 규칙 거점', kind: 'home' });
    householdId = householdRes.body.id;

    const catRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/categories`)
      .send({ name: '식료품', sortOrder: 0 });

    const productRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/products`)
      .send({ categoryId: catRes.body.id, name: '우유', isConsumable: true });
    productId = productRes.body.id;
  });

  const url = () => `/api/households/${householdId}/expiration-alert-rules`;

  describe('POST .../expiration-alert-rules', () => {
    it('만료 알림 규칙을 생성해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(url())
        .send({ productId, daysBefore: 3 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.productId).toBe(productId);
      expect(res.body.daysBefore).toBe(3);
      expect(res.body.isActive).toBe(true);
      expect(res.body.householdId).toBe(householdId);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite.request().post(url()).send({ productId, daysBefore: 3 }).expect(401);
    });
  });

  describe('GET .../expiration-alert-rules', () => {
    it('만료 알림 규칙 목록을 조회해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(url())
        .send({ productId, daysBefore: 3 });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(url())
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].daysBefore).toBe(3);
    });
  });

  describe('PUT .../expiration-alert-rules/:id', () => {
    it('만료 알림 규칙을 수정해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(url())
        .send({ productId, daysBefore: 3 });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`${url()}/${createRes.body.id}`)
        .send({ daysBefore: 7, isActive: false })
        .expect(200);

      expect(res.body.daysBefore).toBe(7);
      expect(res.body.isActive).toBe(false);
    });
  });

  describe('DELETE .../expiration-alert-rules/:id', () => {
    it('만료 알림 규칙을 삭제해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(url())
        .send({ productId, daysBefore: 3 });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(`${url()}/${createRes.body.id}`)
        .expect(204);

      const listRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(url())
        .expect(200);
      expect(listRes.body).toHaveLength(0);
    });
  });
});
