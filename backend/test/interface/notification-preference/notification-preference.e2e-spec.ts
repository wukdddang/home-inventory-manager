import { BaseE2ETest } from '../../base-e2e.spec';

describe('NotificationPreference (e2e)', () => {
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
      .send({ email: 'notif-test@example.com', password: 'password123', displayName: '알림테스트' });
    accessToken = signupRes.body.accessToken;

    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '알림 테스트 거점', kind: 'home' });
    householdId = householdRes.body.id;
  });

  const url = '/api/notification-preferences';

  // ── 기본 알림 설정 (거점 미지정) ──

  describe('POST /api/notification-preferences', () => {
    it('기본 알림 설정을 저장해야 한다 (거점 미지정)', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(url)
        .send({
          notifyExpiration: true,
          notifyShopping: true,
          notifyLowStock: false,
          expirationDaysBefore: 3,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.householdId).toBeNull();
      expect(res.body.notifyExpiration).toBe(true);
      expect(res.body.expirationDaysBefore).toBe(3);
    });

    it('거점별 알림 설정을 저장해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(url)
        .send({
          householdId,
          notifyExpiration: false,
          notifyShopping: true,
          shoppingTripReminder: true,
          shoppingTripReminderWeekday: 6,
        })
        .expect(201);

      expect(res.body.householdId).toBe(householdId);
      expect(res.body.notifyExpiration).toBe(false);
      expect(res.body.shoppingTripReminderWeekday).toBe(6);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite.request().post(url).send({}).expect(401);
    });
  });

  // ── 조회 ──

  describe('GET /api/notification-preferences', () => {
    it('알림 설정 목록을 조회해야 한다 (기본값 + 거점별)', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(url)
        .send({ notifyExpiration: true });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(url)
        .send({ householdId, notifyExpiration: false });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(url)
        .expect(200);

      expect(res.body).toHaveLength(2);
      // 기본값(householdId null) + 거점별
      const defaultPref = res.body.find((p: any) => p.householdId === null);
      const householdPref = res.body.find((p: any) => p.householdId === householdId);
      expect(defaultPref).toBeDefined();
      expect(householdPref).toBeDefined();
    });
  });

  // ── 수정 ──

  describe('PUT /api/notification-preferences/:id', () => {
    it('알림 설정을 수정해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(url)
        .send({ notifyExpiration: true, notifyLowStock: false });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`${url}/${createRes.body.id}`)
        .send({ notifyExpiration: false, notifyLowStock: true })
        .expect(200);

      expect(res.body.notifyExpiration).toBe(false);
      expect(res.body.notifyLowStock).toBe(true);
    });
  });

  // ── 마스터 토글 ──

  describe('마스터 토글', () => {
    it('마스터 토글로 알림 카테고리를 켜고 끌 수 있어야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(url)
        .send({
          notifyExpiration: true,
          notifyShopping: true,
          notifyLowStock: true,
        });

      // 유통기한 알림 끄기
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`${url}/${createRes.body.id}`)
        .send({ notifyExpiration: false })
        .expect(200);

      expect(res.body.notifyExpiration).toBe(false);
      expect(res.body.notifyShopping).toBe(true);
      expect(res.body.notifyLowStock).toBe(true);
    });
  });

  // ── 삭제 ──

  describe('DELETE /api/notification-preferences/:id', () => {
    it('알림 설정을 삭제해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(url)
        .send({ notifyExpiration: true });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(`${url}/${createRes.body.id}`)
        .expect(204);

      const listRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(url)
        .expect(200);
      expect(listRes.body).toHaveLength(0);
    });
  });
});
