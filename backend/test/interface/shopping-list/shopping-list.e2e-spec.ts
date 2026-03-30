import { BaseE2ETest } from '../../base-e2e.spec';

describe('ShoppingList (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;
  let householdId: string;
  let inventoryItemId: string;
  let categoryId: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  }, 60000);

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanDatabase();
    testSuite.mockMailService.sentEmails = [];

    // 사용자
    const signupRes = await testSuite
      .request()
      .post('/api/auth/signup')
      .send({ email: 'shop-test@example.com', password: 'password123', displayName: '장보기테스트' });
    accessToken = signupRes.body.accessToken;

    // 거점
    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '장보기 거점', kind: 'home' });
    householdId = householdRes.body.id;

    // 카테고리
    const catRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/categories`)
      .send({ name: '식료품', sortOrder: 0 });
    categoryId = catRes.body.id;

    // 단위 → 상품 → 변형 → 보관장소 → 재고
    const unitRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/units`)
      .send({ symbol: 'ml', name: '밀리리터', sortOrder: 0 });

    const productRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/products`)
      .send({ categoryId, name: '우유', isConsumable: true });

    const variantRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/products/${productRes.body.id}/variants`)
      .send({ unitId: unitRes.body.id, quantityPerUnit: 1000, name: '1L', isDefault: true });

    const storageRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/storage-locations`)
      .send({ name: '냉장고' });

    const invRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/inventory-items`)
      .send({ productVariantId: variantRes.body.id, storageLocationId: storageRes.body.id, quantity: 10 });
    inventoryItemId = invRes.body.id;
  });

  const url = () => `/api/households/${householdId}/shopping-list-items`;

  // ── CRUD ──

  describe('POST .../shopping-list-items', () => {
    it('장보기 항목을 추가해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(url())
        .send({ categoryId, memo: '우유 2팩', quantity: 2 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.householdId).toBe(householdId);
      expect(res.body.memo).toBe('우유 2팩');
      expect(Number(res.body.quantity)).toBe(2);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite.request().post(url()).send({ memo: 'x' }).expect(401);
    });
  });

  describe('GET .../shopping-list-items', () => {
    it('장보기 항목 목록을 조회해야 한다', async () => {
      await testSuite.authenticatedRequest(accessToken).post(url()).send({ memo: '우유', sortOrder: 0 });
      await testSuite.authenticatedRequest(accessToken).post(url()).send({ memo: '계란', sortOrder: 1 });

      const res = await testSuite.authenticatedRequest(accessToken).get(url()).expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].memo).toBe('우유');
      expect(res.body[1].memo).toBe('계란');
    });
  });

  describe('PUT .../shopping-list-items/:id', () => {
    it('장보기 항목을 수정해야 한다', async () => {
      const createRes = await testSuite.authenticatedRequest(accessToken).post(url()).send({ memo: '우유' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`${url()}/${createRes.body.id}`)
        .send({ memo: '저지방 우유', quantity: 3 })
        .expect(200);

      expect(res.body.memo).toBe('저지방 우유');
      expect(Number(res.body.quantity)).toBe(3);
    });
  });

  describe('DELETE .../shopping-list-items/:id', () => {
    it('장보기 항목을 삭제해야 한다', async () => {
      const createRes = await testSuite.authenticatedRequest(accessToken).post(url()).send({ memo: '삭제용' });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(`${url()}/${createRes.body.id}`)
        .expect(204);

      const listRes = await testSuite.authenticatedRequest(accessToken).get(url()).expect(200);
      expect(listRes.body).toHaveLength(0);
    });
  });

  // ── 구매 완료 트랜잭션 ──

  describe('POST .../shopping-list-items/:id/complete', () => {
    it('구매 완료 시 재고 증가 + 이력 생성 + 항목 삭제가 원자적으로 수행되어야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(url())
        .send({ memo: '우유 보충' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`${url()}/${createRes.body.id}/complete`)
        .send({ inventoryItemId, quantity: 5 })
        .expect(200);

      // 응답 확인
      expect(res.body.inventoryItem.id).toBe(inventoryItemId);
      expect(res.body.inventoryItem.quantity).toBe(15);
      expect(res.body.inventoryLog.type).toBe('in');
      expect(res.body.inventoryLog.quantityDelta).toBe(5);
      expect(res.body.inventoryLog.quantityAfter).toBe(15);

      // 장보기 항목이 삭제되었는지 확인
      const listRes = await testSuite.authenticatedRequest(accessToken).get(url()).expect(200);
      expect(listRes.body).toHaveLength(0);

      // 재고 수량 확인
      const invRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/inventory-items`)
        .expect(200);
      const item = invRes.body.find((i: any) => i.id === inventoryItemId);
      expect(Number(item.quantity)).toBe(15);
    });
  });
});
