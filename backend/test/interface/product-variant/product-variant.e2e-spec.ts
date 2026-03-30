import { BaseE2ETest } from '../../base-e2e.spec';

describe('ProductVariant (e2e)', () => {
    const testSuite = new BaseE2ETest();
    let accessToken: string;
    let householdId: string;
    let categoryId: string;
    let productId: string;
    let unitId: string;

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
                email: 'variant-test@example.com',
                password: 'password123',
                displayName: '변형 테스트',
            });
        accessToken = signupRes.body.accessToken;

        // 거점 생성
        const householdRes = await testSuite
            .authenticatedRequest(accessToken)
            .post('/api/households')
            .send({ name: '변형 테스트 거점', kind: 'home' });
        householdId = householdRes.body.id;

        // 카테고리 생성
        const categoryRes = await testSuite
            .authenticatedRequest(accessToken)
            .post(`/api/households/${householdId}/categories`)
            .send({ name: '식료품', sortOrder: 0 });
        categoryId = categoryRes.body.id;

        // 단위 생성
        const unitRes = await testSuite
            .authenticatedRequest(accessToken)
            .post(`/api/households/${householdId}/units`)
            .send({ symbol: 'ml', name: '밀리리터', sortOrder: 0 });
        unitId = unitRes.body.id;

        // 상품 생성
        const productRes = await testSuite
            .authenticatedRequest(accessToken)
            .post(`/api/households/${householdId}/products`)
            .send({
                categoryId,
                name: '우유',
                isConsumable: true,
            });
        productId = productRes.body.id;
    });

    const variantsUrl = () =>
        `/api/households/${householdId}/products/${productId}/variants`;

    // ── CRUD ──

    describe('POST .../variants', () => {
        it('상품 용량·변형을 생성해야 한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(variantsUrl())
                .send({
                    unitId,
                    quantityPerUnit: 500,
                    name: '500ml',
                    price: 1500,
                    isDefault: true,
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.productId).toBe(productId);
            expect(res.body.unitId).toBe(unitId);
            expect(Number(res.body.quantityPerUnit)).toBe(500);
            expect(res.body.name).toBe('500ml');
            expect(res.body.isDefault).toBe(true);
        });

        it('인증 없이 접근하면 401을 반환해야 한다', async () => {
            await testSuite
                .request()
                .post(variantsUrl())
                .send({ unitId, quantityPerUnit: 500 })
                .expect(401);
        });
    });

    describe('GET .../variants', () => {
        it('상품 용량·변형 목록을 조회해야 한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(variantsUrl())
                .send({ unitId, quantityPerUnit: 500, name: '500ml' });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(variantsUrl())
                .send({ unitId, quantityPerUnit: 1000, name: '1L' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(variantsUrl())
                .expect(200);

            expect(res.body).toHaveLength(2);
            expect(res.body[0].name).toBe('500ml');
            expect(res.body[1].name).toBe('1L');
        });
    });

    describe('GET .../variants/:id', () => {
        it('상품 용량·변형을 단건 조회해야 한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(variantsUrl())
                .send({ unitId, quantityPerUnit: 500, name: '500ml' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(`${variantsUrl()}/${createRes.body.id}`)
                .expect(200);

            expect(res.body.name).toBe('500ml');
        });
    });

    describe('PUT .../variants/:id', () => {
        it('상품 용량·변형을 수정해야 한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(variantsUrl())
                .send({ unitId, quantityPerUnit: 500, name: '500ml' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .put(`${variantsUrl()}/${createRes.body.id}`)
                .send({ name: '500ml 페트', price: 1800 })
                .expect(200);

            expect(res.body.name).toBe('500ml 페트');
            expect(Number(res.body.price)).toBe(1800);
        });
    });

    describe('DELETE .../variants/:id', () => {
        it('상품 용량·변형을 삭제해야 한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(variantsUrl())
                .send({ unitId, quantityPerUnit: 500, name: '삭제변형' });

            await testSuite
                .authenticatedRequest(accessToken)
                .delete(`${variantsUrl()}/${createRes.body.id}`)
                .expect(204);

            const listRes = await testSuite
                .authenticatedRequest(accessToken)
                .get(variantsUrl())
                .expect(200);

            expect(listRes.body).toHaveLength(0);
        });
    });
});
