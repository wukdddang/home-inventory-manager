import { BaseE2ETest } from '../../base-e2e.spec';

describe('HouseholdKindDefinition (e2e)', () => {
  const testSuite = new BaseE2ETest();
  let accessToken: string;

  beforeAll(async () => {
    await testSuite.beforeAll();
  }, 60000);

  afterAll(async () => {
    await testSuite.afterAll();
  });

  beforeEach(async () => {
    await testSuite.cleanDatabase();
    testSuite.mockMailService.sentEmails = [];

    // 사용자 생성 (가입 시 기본 4종 시드됨)
    const signupRes = await testSuite
      .request()
      .post('/api/auth/signup')
      .send({
        email: 'kind-test@example.com',
        password: 'password123',
        displayName: '유형 테스트 사용자',
      });
    accessToken = signupRes.body.accessToken;
  });

  // ── 가입 시 기본 시드 ──

  describe('가입 시 기본 유형 시드', () => {
    it('가입 후 기본 거점 유형 4종이 생성되어야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get('/api/household-kind-definitions')
        .expect(200);

      expect(res.body).toHaveLength(4);

      const kindIds = res.body.map((d: any) => d.kindId);
      expect(kindIds).toContain('home');
      expect(kindIds).toContain('office');
      expect(kindIds).toContain('vehicle');
      expect(kindIds).toContain('other');

      const home = res.body.find((d: any) => d.kindId === 'home');
      expect(home.label).toBe('집');
      expect(home.sortOrder).toBe(0);
    });
  });

  // ── 유형 목록 조회 ──

  describe('GET /api/household-kind-definitions', () => {
    it('인증된 사용자의 유형 목록을 조회해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get('/api/household-kind-definitions')
        .expect(200);

      expect(res.body).toHaveLength(4);
      // sortOrder 순으로 정렬되어야 함
      for (let i = 1; i < res.body.length; i++) {
        expect(res.body[i].sortOrder).toBeGreaterThanOrEqual(
          res.body[i - 1].sortOrder,
        );
      }
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .get('/api/household-kind-definitions')
        .expect(401);
    });

    it('다른 사용자의 유형이 보이면 안 된다', async () => {
      const otherSignup = await testSuite
        .request()
        .post('/api/auth/signup')
        .send({
          email: 'other-kind@example.com',
          password: 'password123',
          displayName: '다른 사용자',
        });

      // 다른 사용자의 유형에 커스텀 추가
      await testSuite
        .authenticatedRequest(otherSignup.body.accessToken)
        .put('/api/household-kind-definitions')
        .send({
          items: [
            { kindId: 'home', label: '집', sortOrder: 0 },
            { kindId: 'secret', label: '비밀 장소', sortOrder: 1 },
          ],
        });

      // 원래 사용자 조회 — secret이 안 보여야 함
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get('/api/household-kind-definitions')
        .expect(200);

      const kindIds = res.body.map((d: any) => d.kindId);
      expect(kindIds).not.toContain('secret');
    });
  });

  // ── 유형 목록 일괄 저장 ──

  describe('PUT /api/household-kind-definitions', () => {
    it('라벨을 수정할 수 있어야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put('/api/household-kind-definitions')
        .send({
          items: [
            { kindId: 'home', label: '우리 집', sortOrder: 0 },
            { kindId: 'office', label: '회사', sortOrder: 1 },
            { kindId: 'vehicle', label: '자동차', sortOrder: 2 },
            { kindId: 'other', label: '기타', sortOrder: 3 },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(4);
      const home = res.body.find((d: any) => d.kindId === 'home');
      expect(home.label).toBe('우리 집');
    });

    it('사용자 정의 유형을 추가할 수 있어야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put('/api/household-kind-definitions')
        .send({
          items: [
            { kindId: 'home', label: '집', sortOrder: 0 },
            { kindId: 'office', label: '사무실', sortOrder: 1 },
            { kindId: 'vehicle', label: '차량', sortOrder: 2 },
            { kindId: 'other', label: '기타', sortOrder: 3 },
            { kindId: 'warehouse', label: '창고', sortOrder: 4 },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(5);
      const warehouse = res.body.find((d: any) => d.kindId === 'warehouse');
      expect(warehouse).toBeDefined();
      expect(warehouse.label).toBe('창고');
    });

    it('유형을 삭제할 수 있어야 한다 (목록에서 제외)', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put('/api/household-kind-definitions')
        .send({
          items: [
            { kindId: 'home', label: '집', sortOrder: 0 },
            { kindId: 'office', label: '사무실', sortOrder: 1 },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(2);
      const kindIds = res.body.map((d: any) => d.kindId);
      expect(kindIds).not.toContain('vehicle');
      expect(kindIds).not.toContain('other');
    });

    it('정렬 순서를 변경할 수 있어야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put('/api/household-kind-definitions')
        .send({
          items: [
            { kindId: 'other', label: '기타', sortOrder: 0 },
            { kindId: 'vehicle', label: '차량', sortOrder: 1 },
            { kindId: 'office', label: '사무실', sortOrder: 2 },
            { kindId: 'home', label: '집', sortOrder: 3 },
          ],
        })
        .expect(200);

      expect(res.body[0].kindId).toBe('other');
      expect(res.body[3].kindId).toBe('home');
    });

    it('빈 items 배열이면 모두 삭제해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .put('/api/household-kind-definitions')
        .send({ items: [] })
        .expect(200);

      const getRes = await testSuite
        .authenticatedRequest(accessToken)
        .get('/api/household-kind-definitions')
        .expect(200);

      expect(getRes.body).toHaveLength(0);
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .put('/api/household-kind-definitions')
        .send({ items: [] })
        .expect(401);
    });

    it('유효하지 않은 데이터이면 400을 반환해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .put('/api/household-kind-definitions')
        .send({
          items: [{ kindId: 123, label: '잘못된' }],
        })
        .expect(400);
    });
  });
});
