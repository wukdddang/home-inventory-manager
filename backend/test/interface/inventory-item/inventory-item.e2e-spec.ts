import { BaseE2ETest } from '../../base-e2e.spec';

describe('InventoryItem (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;
  let householdId: string;
  let storageLocationId: string;
  let productVariantId: string;

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
        email: 'inventory-test@example.com',
        password: 'password123',
        displayName: '재고 테스트',
      });
    accessToken = signupRes.body.accessToken;

    // 거점 생성
    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '재고 테스트 거점', kind: 'home' });
    householdId = householdRes.body.id;

    // 보관 장소 생성
    const storageRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/storage-locations`)
      .send({ name: '냉장고' });
    storageLocationId = storageRes.body.id;

    // 카테고리 생성
    const categoryRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/categories`)
      .send({ name: '식료품', sortOrder: 0 });

    // 단위 생성
    const unitRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/units`)
      .send({ symbol: 'ml', name: '밀리리터', sortOrder: 0 });

    // 상품 생성
    const productRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/products`)
      .send({
        categoryId: categoryRes.body.id,
        name: '우유',
        isConsumable: true,
      });

    // 상품 변형 생성
    const variantRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(
        `/api/households/${householdId}/products/${productRes.body.id}/variants`,
      )
      .send({
        unitId: unitRes.body.id,
        quantityPerUnit: 1000,
        name: '1L',
        isDefault: true,
      });
    productVariantId = variantRes.body.id;
  });

  const inventoryUrl = () =>
    `/api/households/${householdId}/inventory-items`;

  // ── CRUD ──

  describe('POST /api/households/:householdId/inventory-items', () => {
    it('재고 품목을 등록해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(inventoryUrl())
        .send({
          productVariantId,
          storageLocationId,
          quantity: 5,
          minStockLevel: 2,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.productVariantId).toBe(productVariantId);
      expect(res.body.storageLocationId).toBe(storageLocationId);
      expect(Number(res.body.quantity)).toBe(5);
      expect(Number(res.body.minStockLevel)).toBe(2);
    });

    it('수량 미지정 시 0으로 생성해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(inventoryUrl())
        .send({
          productVariantId,
          storageLocationId,
        })
        .expect(201);

      expect(Number(res.body.quantity)).toBe(0);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post(inventoryUrl())
        .send({
          productVariantId,
          storageLocationId,
        })
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
        .post(inventoryUrl())
        .send({
          productVariantId,
          storageLocationId,
        })
        .expect(403);
    });
  });

  describe('GET /api/households/:householdId/inventory-items', () => {
    it('재고 품목 목록을 조회해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(inventoryUrl())
        .send({ productVariantId, storageLocationId, quantity: 5 });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(inventoryUrl())
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(Number(res.body[0].quantity)).toBe(5);
      expect(res.body[0].productVariant).toBeDefined();
      expect(res.body[0].storageLocation).toBeDefined();
    });
  });

  describe('PATCH /api/households/:householdId/inventory-items/:id/quantity', () => {
    it('재고 수량을 수정해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(inventoryUrl())
        .send({ productVariantId, storageLocationId, quantity: 5 });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .patch(`${inventoryUrl()}/${createRes.body.id}/quantity`)
        .send({ quantity: 20 })
        .expect(200);

      expect(Number(res.body.quantity)).toBe(20);
    });
  });
});
