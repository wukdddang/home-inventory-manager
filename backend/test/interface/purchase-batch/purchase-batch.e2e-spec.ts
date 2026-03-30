import { BaseE2ETest } from '../../base-e2e.spec';

describe('PurchaseBatch (e2e)', () => {
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

    // 사용자 생성
    const signupRes = await testSuite
      .request()
      .post('/api/auth/signup')
      .send({
        email: 'batch-test@example.com',
        password: 'password123',
        displayName: '로트 테스트',
      });
    accessToken = signupRes.body.accessToken;

    // 거점 생성
    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '로트 테스트 거점', kind: 'home' });
    householdId = householdRes.body.id;
  });

  /** 구매 + 로트를 빠르게 생성하는 헬퍼 */
  async function createPurchaseWithBatches(
    batches: { quantity: number; expirationDate?: string }[],
    itemName = '우유',
  ) {
    return testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/purchases`)
      .send({
        unitPrice: 1500,
        purchasedAt: '2026-03-01T00:00:00.000Z',
        itemName,
        batches,
      });
  }

  const batchesUrl = () =>
    `/api/households/${householdId}/batches`;

  // ── 로트 목록 조회 ──

  describe('GET /api/households/:householdId/batches', () => {
    it('유통기한이 있는 로트 목록을 조회해야 한다', async () => {
      await createPurchaseWithBatches([
        { quantity: 3, expirationDate: '2026-06-01' },
        { quantity: 2, expirationDate: '2026-07-01' },
      ]);

      // 유통기한 없는 로트 (목록에서 제외되어야 함)
      await createPurchaseWithBatches([{ quantity: 1 }], '칫솔');

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(batchesUrl())
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].expirationDate).toBe('2026-06-01');
      expect(res.body[1].expirationDate).toBe('2026-07-01');
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .get(batchesUrl())
        .expect(401);
    });
  });

  // ── 만료된 목록 조회 ──

  describe('GET /api/households/:householdId/batches/expired', () => {
    it('이미 만료된 로트를 조회해야 한다', async () => {
      await createPurchaseWithBatches([
        { quantity: 2, expirationDate: '2025-01-01' }, // 만료됨
        { quantity: 3, expirationDate: '2028-12-31' }, // 미만료
      ]);

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`${batchesUrl()}/expired`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].expirationDate).toBe('2025-01-01');
    });
  });

  // ── 유통기한 임박 목록 조회 ──

  describe('GET /api/households/:householdId/batches/expiring', () => {
    it('유통기한 임박 로트를 조회해야 한다', async () => {
      // 오늘 + 3일 후 만료 (7일 이내)
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 3);
      const soonStr = soonDate.toISOString().split('T')[0];

      // 먼 미래 (7일 이후)
      const farDate = new Date();
      farDate.setDate(farDate.getDate() + 30);
      const farStr = farDate.toISOString().split('T')[0];

      await createPurchaseWithBatches([
        { quantity: 2, expirationDate: soonStr },
        { quantity: 3, expirationDate: farStr },
      ]);

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`${batchesUrl()}/expiring?days=7`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].expirationDate).toBe(soonStr);
    });
  });
});
