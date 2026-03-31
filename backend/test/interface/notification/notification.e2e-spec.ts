import { BaseE2ETest } from '../../base-e2e.spec';

describe('Notification (e2e)', () => {
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
      .send({ email: 'notif-e2e@example.com', password: 'password123', displayName: '알림E2E' });
    accessToken = signupRes.body.accessToken;

    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '알림 거점', kind: 'home' });
    householdId = householdRes.body.id;
  });

  describe('GET /api/notifications', () => {
    it('알림 목록을 조회해야 한다 (초기에는 비어있음)', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get('/api/notifications')
        .expect(200);

      expect(res.body).toHaveLength(0);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite.request().get('/api/notifications').expect(401);
    });

    it('거점 필터로 알림을 조회할 수 있어야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/notifications?householdId=${householdId}`)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('존재하지 않는 알림 읽음 처리 시 404를 반환해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .patch('/api/notifications/00000000-0000-0000-0000-000000000000/read')
        .expect(404);
    });
  });
});
