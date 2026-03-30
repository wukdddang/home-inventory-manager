import { BaseE2ETest } from '../../base-e2e.spec';

describe('Space (e2e)', () => {
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
        email: 'space-test@example.com',
        password: 'password123',
        displayName: '공간 테스트',
      });
    accessToken = signupRes.body.accessToken;

    const householdRes = await testSuite
      .authenticatedRequest(accessToken)
      .post('/api/households')
      .send({ name: '공간 테스트 거점', kind: 'home' });
    householdId = householdRes.body.id;
  });

  // ── 집 구조 ──

  describe('집 구조', () => {
    it('집 구조가 없으면 null을 반환해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/house-structure`)
        .expect(200);

      // null은 HTTP 응답에서 빈 객체({})로 직렬화됨
      expect(res.body).toEqual({});
    });

    it('집 구조를 등록해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/house-structure`)
        .send({
          name: '우리 집',
          structurePayload: {
            rooms: [
              { id: 'room-living', label: '거실' },
              { id: 'room-bed', label: '침실' },
            ],
          },
        })
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('우리 집');
      expect(res.body.structurePayload.rooms).toHaveLength(2);
    });

    it('집 구조를 수정해야 한다 (upsert)', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/house-structure`)
        .send({
          name: '우리 집',
          structurePayload: { rooms: [{ id: 'room-1', label: '방1' }] },
        });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/house-structure`)
        .send({
          name: '수정된 집',
          structurePayload: {
            rooms: [
              { id: 'room-1', label: '방1' },
              { id: 'room-2', label: '방2' },
            ],
          },
          diagramLayout: { 'room-1': { x: 0, y: 0 } },
        })
        .expect(200);

      expect(res.body.name).toBe('수정된 집');
      expect(res.body.structurePayload.rooms).toHaveLength(2);
      expect(res.body.diagramLayout).toHaveProperty('room-1');
    });
  });

  // ── 방 ──

  describe('방', () => {
    let structureId: string;

    beforeEach(async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/house-structure`)
        .send({
          name: '우리 집',
          structurePayload: { rooms: [] },
        });
      structureId = res.body.id;
    });

    it('집 구조가 없으면 빈 배열을 반환해야 한다', async () => {
      // 새 거점 생성 (집 구조 없음)
      const newHousehold = await testSuite
        .authenticatedRequest(accessToken)
        .post('/api/households')
        .send({ name: '빈 거점' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${newHousehold.body.id}/rooms`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('방을 동기화해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/rooms/sync`)
        .send({
          rooms: [
            { structureRoomKey: 'living', displayName: '거실', sortOrder: 0 },
            { structureRoomKey: 'bed', displayName: '침실', sortOrder: 1 },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].structureRoomKey).toBe('living');
    });

    it('방 동기화 시 삭제된 방은 제거해야 한다', async () => {
      // 먼저 2개 방 생성
      await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/rooms/sync`)
        .send({
          rooms: [
            { structureRoomKey: 'living', displayName: '거실', sortOrder: 0 },
            { structureRoomKey: 'bed', displayName: '침실', sortOrder: 1 },
          ],
        });

      // 1개만 남기고 동기화
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/rooms/sync`)
        .send({
          rooms: [
            { structureRoomKey: 'living', displayName: '거실', sortOrder: 0 },
          ],
        })
        .expect(200);

      expect(res.body).toHaveLength(1);

      const listRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/rooms`)
        .expect(200);

      expect(listRes.body).toHaveLength(1);
    });
  });

  // ── 가구 배치 ──

  describe('가구 배치', () => {
    let roomId: string;

    beforeEach(async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/house-structure`)
        .send({
          name: '집',
          structurePayload: { rooms: [] },
        });

      const syncRes = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/rooms/sync`)
        .send({
          rooms: [
            { structureRoomKey: 'living', displayName: '거실', sortOrder: 0 },
          ],
        });
      roomId = syncRes.body[0].id;
    });

    it('가구를 등록해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(
          `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
        )
        .send({ label: '책상', sortOrder: 0 })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.label).toBe('책상');
      expect(res.body.roomId).toBe(roomId);
    });

    it('가구 목록을 조회해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(
          `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
        )
        .send({ label: '책상', sortOrder: 0 });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(
          `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
        )
        .send({ label: '침대', sortOrder: 1 });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(
          `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
        )
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('가구를 수정해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(
          `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
        )
        .send({ label: '책상' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(
          `/api/households/${householdId}/furniture-placements/${createRes.body.id}`,
        )
        .send({ label: '큰 책상', sortOrder: 5 })
        .expect(200);

      expect(res.body.label).toBe('큰 책상');
      expect(res.body.sortOrder).toBe(5);
    });

    it('가구를 삭제해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(
          `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
        )
        .send({ label: '삭제할 가구' });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(
          `/api/households/${householdId}/furniture-placements/${createRes.body.id}`,
        )
        .expect(204);
    });
  });

  // ── 보관 장소 ──

  describe('보관 장소', () => {
    let roomId: string;
    let furnitureId: string;

    beforeEach(async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/house-structure`)
        .send({
          name: '집',
          structurePayload: { rooms: [] },
        });

      const syncRes = await testSuite
        .authenticatedRequest(accessToken)
        .put(`/api/households/${householdId}/rooms/sync`)
        .send({
          rooms: [
            { structureRoomKey: 'kitchen', displayName: '주방', sortOrder: 0 },
          ],
        });
      roomId = syncRes.body[0].id;

      const furnitureRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(
          `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
        )
        .send({ label: '냉장고' });
      furnitureId = furnitureRes.body.id;
    });

    it('보관 장소를 등록해야 한다', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/storage-locations`)
        .send({ name: '냉장고 문쪽', roomId, furniturePlacementId: furnitureId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('냉장고 문쪽');
      expect(res.body.roomId).toBe(roomId);
      expect(res.body.furniturePlacementId).toBe(furnitureId);
    });

    it('보관 장소 목록을 조회해야 한다', async () => {
      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/storage-locations`)
        .send({ name: '냉장고 문쪽' });

      await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/storage-locations`)
        .send({ name: '선반 1단' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/storage-locations`)
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('보관 장소를 수정해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/storage-locations`)
        .send({ name: '선반' });

      const res = await testSuite
        .authenticatedRequest(accessToken)
        .put(
          `/api/households/${householdId}/storage-locations/${createRes.body.id}`,
        )
        .send({ name: '선반 2단', roomId })
        .expect(200);

      expect(res.body.name).toBe('선반 2단');
      expect(res.body.roomId).toBe(roomId);
    });

    it('보관 장소를 삭제해야 한다', async () => {
      const createRes = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/storage-locations`)
        .send({ name: '삭제할 장소' });

      await testSuite
        .authenticatedRequest(accessToken)
        .delete(
          `/api/households/${householdId}/storage-locations/${createRes.body.id}`,
        )
        .expect(204);

      const listRes = await testSuite
        .authenticatedRequest(accessToken)
        .get(`/api/households/${householdId}/storage-locations`)
        .expect(200);

      expect(listRes.body).toHaveLength(0);
    });

    it('방 직속 보관 장소를 등록할 수 있어야 한다 (가구 없이)', async () => {
      const res = await testSuite
        .authenticatedRequest(accessToken)
        .post(`/api/households/${householdId}/storage-locations`)
        .send({ name: '주방 선반', roomId })
        .expect(201);

      expect(res.body.roomId).toBe(roomId);
      expect(res.body.furniturePlacementId).toBeNull();
    });

    it('인증 없이 접근하면 401을 반환해야 한다', async () => {
      await testSuite
        .request()
        .get(`/api/households/${householdId}/storage-locations`)
        .expect(401);
    });
  });
});
