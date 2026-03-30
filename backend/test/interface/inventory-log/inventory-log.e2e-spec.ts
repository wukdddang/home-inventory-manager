import { BaseE2ETest } from '../../base-e2e.spec';

describe('InventoryLog (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;
  let householdId: string;
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
        email: 'log-test@example.com',
        password: 'password123',
        displayName: '이력 테스트',
      });
    accessToken = signupRes.body.accessToken;

    // 거점 생성
    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '이력 테스트 거점', kind: 'home' });
    householdId = householdRes.body.id;

    // 보관 장소 생성
    const storageRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/storage-locations`)
      .send({ name: '냉장고' });

    // 카테고리 → 단위 → 상품 → 변형 생성
    const categoryRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/categories`)
      .send({ name: '식료품', sortOrder: 0 });

    const unitRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/units`)
      .send({ symbol: 'ml', name: '밀리리터', sortOrder: 0 });

    const productRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/products`)
      .send({
        categoryId: categoryRes.body.id,
        name: '우유',
        isConsumable: true,
      });

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

    // 재고 품목 생성 (수량 20)
    const inventoryRes = await testSuite
      .authenticatedRequest(accessToken)
      .post(`/api/households/${householdId}/inventory-items`)
      .send({
        productVariantId: variantRes.body.id,
        storageLocationId: storageRes.body.id,
        quantity: 20,
      });
    inventoryItemId = inventoryRes.body.id;
  });

  const logsUrl = () =>
    `/api/households/${householdId}/inventory-items/${inventoryItemId}/logs`;

  // ── 소비 등록 ──

  describe('POST .../logs/consumption', () => {
    it('소비 기록을 등록하고 재고를 감소시켜야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`${logsUrl()}/consumption`)
        .send({ quantity: 3, memo: '아침 식사' })
        .expect(201);

      expect(res.body.type).toBe('out');
      expect(Number(res.body.quantityDelta)).toBe(-3);
      expect(Number(res.body.quantityAfter)).toBe(17);

      // 재고 수량 확인
      const inventoryRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/inventory-items`)
        .expect(200);

      const item = inventoryRes.body.find(
        (i: any) => i.id === inventoryItemId,
      );
      expect(Number(item.quantity)).toBe(17);
    });
  });

  // ── 폐기 등록 ──

  describe('POST .../logs/waste', () => {
    it('폐기 기록을 등록하고 재고를 감소시켜야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`${logsUrl()}/waste`)
        .send({ quantity: 5, reason: '유통기한 만료' })
        .expect(201);

      expect(res.body.type).toBe('waste');
      expect(Number(res.body.quantityDelta)).toBe(-5);
      expect(Number(res.body.quantityAfter)).toBe(15);
      expect(res.body.reason).toBe('유통기한 만료');
    });
  });

  // ── 수동 조정 ──

  describe('POST .../logs/adjustment', () => {
    it('양수 조정으로 재고를 증가시켜야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`${logsUrl()}/adjustment`)
        .send({ quantityDelta: 10, memo: '재고 실사 보정' })
        .expect(201);

      expect(res.body.type).toBe('adjust');
      expect(Number(res.body.quantityDelta)).toBe(10);
      expect(Number(res.body.quantityAfter)).toBe(30);
    });

    it('음수 조정으로 재고를 감소시켜야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`${logsUrl()}/adjustment`)
        .send({ quantityDelta: -5 })
        .expect(201);

      expect(res.body.type).toBe('adjust');
      expect(Number(res.body.quantityDelta)).toBe(-5);
      expect(Number(res.body.quantityAfter)).toBe(15);
    });
  });

  // ── 이력 조회 ──

  describe('GET .../logs', () => {
    it('재고 변경 이력을 조회해야 한다', async () => {
      // 소비 2건, 폐기 1건
      await testSuite
        .authenticatedRequest(accessToken)
        .post(`${logsUrl()}/consumption`)
        .send({ quantity: 2 });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(`${logsUrl()}/consumption`)
        .send({ quantity: 3 });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(`${logsUrl()}/waste`)
        .send({ quantity: 1, reason: '파손' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(logsUrl())
        .expect(200);

      expect(res.body).toHaveLength(3);
      // DESC 정렬 — 최신이 먼저
      expect(res.body[0].type).toBe('waste');
      expect(res.body[1].type).toBe('out');
      expect(res.body[2].type).toBe('out');
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .get(logsUrl())
        .expect(401);
    });
  });
});
