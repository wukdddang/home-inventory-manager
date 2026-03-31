import { BaseE2ETest } from '../../base-e2e.spec';

describe('Purchase (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;
  let householdId: string;
  let storageLocationId: string;
  let productVariantId: string;
  let inventoryItemId: string;

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
        email: 'purchase-test@example.com',
        password: 'password123',
        displayName: '구매 테스트',
      });
    accessToken = signupRes.body.accessToken;

    // 거점 생성
    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '구매 테스트 거점', kind: 'home' });
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

    // 재고 품목 생성
    const inventoryRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/inventory-items`)
      .send({
        productVariantId,
        storageLocationId,
        quantity: 10,
      });
    inventoryItemId = inventoryRes.body.id;
  });

  const purchaseUrl = () =>
    `/api/households/${householdId}/purchases`;

  // ── 구매 등록 ──

  describe('POST /api/households/:householdId/purchases', () => {
    it('재고 미연결 구매를 등록해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(purchaseUrl())
        .send({
          unitPrice: 1500,
          purchasedAt: '2026-03-01T00:00:00.000Z',
          supplierName: '이마트',
          itemName: '우유',
          variantCaption: '1L',
          unitSymbol: 'ml',
          batches: [
            { quantity: 3, expirationDate: '2026-06-01' },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.inventoryItemId).toBeNull();
      expect(Number(res.body.unitPrice)).toBe(1500);
      expect(res.body.supplierName).toBe('이마트');
      expect(res.body.itemName).toBe('우유');
      expect(res.body.batches).toHaveLength(1);
      expect(Number(res.body.batches[0].quantity)).toBe(3);
    });

    it('재고 연결 구매를 등록하면 수량이 자동 증가해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(purchaseUrl())
        .send({
          inventoryItemId,
          unitPrice: 1500,
          purchasedAt: '2026-03-01T00:00:00.000Z',
          itemName: '우유',
          batches: [
            { quantity: 3, expirationDate: '2026-06-01' },
            { quantity: 2, expirationDate: '2026-07-01' },
          ],
        })
        .expect(201);

      expect(res.body.inventoryItemId).toBe(inventoryItemId);
      expect(res.body.batches).toHaveLength(2);

      // 재고 수량 확인 (10 + 3 + 2 = 15)
      const inventoryRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/inventory-items`)
        .expect(200);

      const item = inventoryRes.body.find(
        (i: any) => i.id === inventoryItemId,
      );
      expect(Number(item.quantity)).toBe(15);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .post(purchaseUrl())
        .send({
          unitPrice: 1500,
          purchasedAt: '2026-03-01T00:00:00.000Z',
          batches: [{ quantity: 1 }],
        })
        .expect(401);
    });
  });

  // ── 구매 목록 조회 ──

  describe('GET /api/households/:householdId/purchases', () => {
    it('구매 목록을 조회해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(purchaseUrl())
        .send({
          unitPrice: 1500,
          purchasedAt: '2026-03-01T00:00:00.000Z',
          itemName: '우유',
          batches: [{ quantity: 3, expirationDate: '2026-06-01' }],
        });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(purchaseUrl())
        .send({
          unitPrice: 3000,
          purchasedAt: '2026-03-02T00:00:00.000Z',
          itemName: '치즈',
          batches: [{ quantity: 1 }],
        });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(purchaseUrl())
        .expect(200);

      expect(res.body).toHaveLength(2);
      // purchasedAt DESC 정렬
      expect(res.body[0].itemName).toBe('치즈');
      expect(res.body[1].itemName).toBe('우유');
      expect(res.body[1].batches).toHaveLength(1);
    });
  });

  // ── 재고 나중에 연결 ──

  describe('PATCH /api/households/:householdId/purchases/:id/link-inventory', () => {
    it('재고 미연결 구매에 재고를 나중에 연결해야 한다', async () => {
      // 재고 미연결 구매 등록
      const purchaseRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(purchaseUrl())
        .send({
          unitPrice: 1500,
          purchasedAt: '2026-03-01T00:00:00.000Z',
          itemName: '우유',
          batches: [{ quantity: 5 }],
        });

      // 재고 연결
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .patch(`${purchaseUrl()}/${purchaseRes.body.id}/link-inventory`)
        .send({ inventoryItemId })
        .expect(200);

      expect(res.body.inventoryItemId).toBe(inventoryItemId);

      // 재고 수량 확인 (10 + 5 = 15)
      const inventoryRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/inventory-items`)
        .expect(200);

      const item = inventoryRes.body.find(
        (i: any) => i.id === inventoryItemId,
      );
      expect(Number(item.quantity)).toBe(15);
    });
  });
});
