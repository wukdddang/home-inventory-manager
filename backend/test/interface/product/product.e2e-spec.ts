import { BaseE2ETest } from '../../base-e2e.spec';

describe('Product (e2e)', () => {
    const testSuite = new BaseE2ETest();
    let accessToken: string;
    let householdId: string;
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

        const signupRes = await testSuite
            .request()
            .post('/api/auth/signup')
            .send({
                email: 'product-test@example.com',
                password: 'password123',
                displayName: '상품 테스트',
            });
        accessToken = signupRes.body.accessToken;

        const householdRes = await testSuite
            .authenticatedRequest(accessToken)
            .post('/api/households')
            .send({ name: '상품 테스트 거점', kind: 'home' });
        householdId = householdRes.body.id;

        const categoryRes = await testSuite
            .authenticatedRequest(accessToken)
            .post(`/api/households/${householdId}/categories`)
            .send({ name: '식료품', sortOrder: 0 });
        categoryId = categoryRes.body.id;
    });

    // ── CRUD ──

    describe('POST /api/households/:householdId/products', () => {
        it('상품을 생성해야 한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products`)
                .send({
                    categoryId,
                    name: '우유',
                    isConsumable: true,
                    description: '서울우유 1L',
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('우유');
            expect(res.body.categoryId).toBe(categoryId);
            expect(res.body.isConsumable).toBe(true);
            expect(res.body.householdId).toBe(householdId);
            expect(res.body.description).toBe('서울우유 1L');
        });

        it('인증 없이 접근하면 401을 반환해야 한다', async () => {
            await testSuite
                .request()
                .post(`/api/households/${householdId}/products`)
                .send({
                    categoryId,
                    name: '우유',
                    isConsumable: true,
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
                .post(`/api/households/${householdId}/products`)
                .send({
                    categoryId,
                    name: '우유',
                    isConsumable: true,
                })
                .expect(403);
        });
    });

    describe('GET /api/households/:householdId/products', () => {
        it('상품 목록을 조회해야 한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products`)
                .send({ categoryId, name: '우유', isConsumable: true });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products`)
                .send({ categoryId, name: '칫솔', isConsumable: false });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(`/api/households/${householdId}/products`)
                .expect(200);

            expect(res.body).toHaveLength(2);
            expect(res.body[0].name).toBe('우유');
            expect(res.body[1].name).toBe('칫솔');
        });
    });

    describe('GET /api/households/:householdId/products/:id', () => {
        it('상품을 단건 조회해야 한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products`)
                .send({ categoryId, name: '우유', isConsumable: true });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/products/${createRes.body.id}`,
                )
                .expect(200);

            expect(res.body.name).toBe('우유');
            expect(res.body.isConsumable).toBe(true);
        });
    });

    describe('PUT /api/households/:householdId/products/:id', () => {
        it('상품을 수정해야 한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products`)
                .send({ categoryId, name: '우유', isConsumable: true });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .put(
                    `/api/households/${householdId}/products/${createRes.body.id}`,
                )
                .send({ name: '저지방 우유', description: '1.5% 지방' })
                .expect(200);

            expect(res.body.name).toBe('저지방 우유');
            expect(res.body.description).toBe('1.5% 지방');
        });
    });

    describe('DELETE /api/households/:householdId/products/:id', () => {
        it('상품을 삭제해야 한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products`)
                .send({ categoryId, name: '삭제할 상품', isConsumable: true });

            await testSuite
                .authenticatedRequest(accessToken)
                .delete(
                    `/api/households/${householdId}/products/${createRes.body.id}`,
                )
                .expect(204);

            const listRes = await testSuite
                .authenticatedRequest(accessToken)
                .get(`/api/households/${householdId}/products`)
                .expect(200);

            expect(listRes.body).toHaveLength(0);
        });
    });

    // ── 다른 거점에서 가져오기 ──

    describe('POST /api/households/:householdId/products/copy', () => {
        it('다른 거점의 상품을 복사해야 한다 (카테고리 이름 매핑)', async () => {
            // 원본 거점
            const sourceHousehold = await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/households')
                .send({ name: '원본 거점' });

            const srcCat = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${sourceHousehold.body.id}/categories`,
                )
                .send({ name: '식료품', sortOrder: 0 });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${sourceHousehold.body.id}/products`,
                )
                .send({
                    categoryId: srcCat.body.id,
                    name: '우유',
                    isConsumable: true,
                });

            // 대상 거점에 같은 이름의 카테고리가 이미 있어야 매핑됨
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products/copy`)
                .send({ sourceHouseholdId: sourceHousehold.body.id })
                .expect(201);

            expect(res.body).toHaveLength(1);
            expect(res.body[0].householdId).toBe(householdId);
            expect(res.body[0].name).toBe('우유');
            expect(res.body[0].categoryId).toBe(categoryId);
        });

        it('매핑되는 카테고리가 없으면 빈 배열을 반환해야 한다', async () => {
            const sourceHousehold = await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/households')
                .send({ name: '원본 거점' });

            const srcCat = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${sourceHousehold.body.id}/categories`,
                )
                .send({ name: '매핑안됨', sortOrder: 0 });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${sourceHousehold.body.id}/products`,
                )
                .send({
                    categoryId: srcCat.body.id,
                    name: '우유',
                    isConsumable: true,
                });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/products/copy`)
                .send({ sourceHouseholdId: sourceHousehold.body.id })
                .expect(201);

            expect(res.body).toHaveLength(0);
        });
    });
});
