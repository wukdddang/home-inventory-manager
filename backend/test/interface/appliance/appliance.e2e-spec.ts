import { BaseE2ETest } from '../../base-e2e.spec';

describe('UC-11. 가전/설비 등록 및 관리 (e2e)', () => {
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
                email: 'appliance-test@example.com',
                password: 'password123',
                displayName: '가전 테스트',
            });
        accessToken = signupRes.body.accessToken;

        const householdRes = await testSuite
            .authenticatedRequest(accessToken)
            .post('/api/households')
            .send({ name: '가전 테스트 거점', kind: 'home' });
        householdId = householdRes.body.id;
    });

    // ── 11-A. 가전 등록 및 CRUD ──

    describe('11-A. 가전 등록 및 CRUD', () => {
        it('#1 사용자는 가전 등록 폼에서 이름·브랜드·모델명·구매일·보증 만료일을 입력하여 등록한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({
                    name: '드럼세탁기',
                    brand: 'LG',
                    modelName: 'F21VDV',
                    purchasedAt: '2024-01-15',
                    purchasePrice: 1500000,
                    warrantyExpiresAt: '2027-01-15',
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe('드럼세탁기');
            expect(res.body.brand).toBe('LG');
            expect(res.body.status).toBe('active');
            expect(res.body.householdId).toBe(householdId);
        });

        it('#1-err 필수 필드(이름) 누락 시 400을 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ brand: 'LG' })
                .expect(400);
        });

        it('#1-auth 인증 없이 접근하면 401을 반환한다', async () => {
            await testSuite
                .request()
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' })
                .expect(401);
        });

        it('#1-guard 비멤버가 접근하면 403을 반환한다', async () => {
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
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' })
                .expect(403);
        });

        it('#2 사용자는 거점의 가전 목록을 조회한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '에어컨' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(`/api/households/${householdId}/appliances`)
                .expect(200);

            expect(res.body).toHaveLength(2);
        });

        it('#3 사용자는 가전 목록을 활성/폐기 필터로 전환한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' });

            await testSuite
                .authenticatedRequest(accessToken)
                .patch(
                    `/api/households/${householdId}/appliances/${createRes.body.id}/retire`,
                );

            const activeRes = await testSuite
                .authenticatedRequest(accessToken)
                .get(`/api/households/${householdId}/appliances?status=active`)
                .expect(200);

            expect(activeRes.body).toHaveLength(0);

            const retiredRes = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances?status=retired`,
                )
                .expect(200);

            expect(retiredRes.body).toHaveLength(1);
        });

        it('#4 사용자는 가전 상세 화면에서 등록 정보를 확인한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '에어컨', brand: '삼성' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances/${createRes.body.id}`,
                )
                .expect(200);

            expect(res.body.name).toBe('에어컨');
            expect(res.body.brand).toBe('삼성');
        });

        it('#4-err 존재하지 않는 가전 조회 시 404를 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances/00000000-0000-0000-0000-000000000000`,
                )
                .expect(404);
        });

        it('#5 사용자는 가전 정보를 수정한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .put(
                    `/api/households/${householdId}/appliances/${createRes.body.id}`,
                )
                .send({ name: '건조기', brand: 'LG' })
                .expect(200);

            expect(res.body.name).toBe('건조기');
            expect(res.body.brand).toBe('LG');
        });

        it('#6 사용자는 가전을 폐기 처리하고 상태가 변경됨을 확인한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .patch(
                    `/api/households/${householdId}/appliances/${createRes.body.id}/retire`,
                )
                .expect(200);

            expect(res.body.status).toBe('retired');
        });
    });

    // ── 11-B. 유지보수 스케줄 관리 ──

    describe('11-B. 유지보수 스케줄 관리', () => {
        let applianceId: string;

        beforeEach(async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({
                    name: '에어컨',
                    warrantyExpiresAt: '2027-01-01',
                });
            applianceId = createRes.body.id;
        });

        it('#7 사용자는 가전 상세에서 유지보수 스케줄을 등록한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                )
                .send({
                    taskName: '필터 교체',
                    recurrenceRule: {
                        frequency: 'monthly',
                        interval: 3,
                        dayOfMonth: 1,
                    },
                    nextOccurrenceAt: '2026-07-01',
                })
                .expect(201);

            expect(res.body.taskName).toBe('필터 교체');
            expect(res.body.isActive).toBe(true);
            expect(res.body.recurrenceRule.frequency).toBe('monthly');
        });

        it('#8 사용자는 유지보수 스케줄 목록을 조회하고 다음 예정일을 확인한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                )
                .send({
                    taskName: '필터 교체',
                    recurrenceRule: { frequency: 'monthly', interval: 3 },
                    nextOccurrenceAt: '2026-07-01',
                });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                )
                .expect(200);

            expect(res.body).toHaveLength(1);
            expect(res.body[0].nextOccurrenceAt).toBe('2026-07-01');
        });

        it('#9 사용자는 유지보수 스케줄의 작업명·다음 예정일을 수정한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                )
                .send({
                    taskName: '필터 교체',
                    recurrenceRule: { frequency: 'monthly', interval: 3 },
                    nextOccurrenceAt: '2026-07-01',
                });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .put(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules/${createRes.body.id}`,
                )
                .send({ taskName: '필터 세척', nextOccurrenceAt: '2026-08-01' })
                .expect(200);

            expect(res.body.taskName).toBe('필터 세척');
            expect(res.body.nextOccurrenceAt).toBe('2026-08-01');
        });

        it('#10 사용자는 유지보수 스케줄을 비활성화하고 목록에서 비활성 상태가 표시됨을 확인한다', async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                )
                .send({
                    taskName: '필터 교체',
                    recurrenceRule: { frequency: 'monthly', interval: 3 },
                    nextOccurrenceAt: '2026-07-01',
                });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .patch(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules/${createRes.body.id}/deactivate`,
                )
                .expect(200);

            expect(res.body.isActive).toBe(false);
        });

        it('#11 시스템은 폐기된 가전에 유지보수 스케줄 추가를 시도하면 오류를 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .patch(
                    `/api/households/${householdId}/appliances/${applianceId}/retire`,
                );

            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                )
                .send({
                    taskName: '필터 교체',
                    recurrenceRule: { frequency: 'monthly', interval: 3 },
                    nextOccurrenceAt: '2026-07-01',
                })
                .expect(400);
        });
    });

    // ── 11-C. 유지보수·A/S 이력 기록 ──

    describe('11-C. 유지보수·A/S 이력 기록', () => {
        let applianceId: string;
        let scheduleId: string;

        beforeEach(async () => {
            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '에어컨' });
            applianceId = createRes.body.id;

            const schedRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                )
                .send({
                    taskName: '필터 교체',
                    recurrenceRule: { frequency: 'monthly', interval: 3 },
                    nextOccurrenceAt: '2026-04-01',
                });
            scheduleId = schedRes.body.id;
        });

        it('#12 사용자는 정기 유지보수를 완료 기록한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    maintenanceScheduleId: scheduleId,
                    type: 'scheduled',
                    description: '에어컨 필터 교체 완료',
                    performedAt: '2026-04-01',
                })
                .expect(201);

            expect(res.body.type).toBe('scheduled');
            expect(res.body.maintenanceScheduleId).toBe(scheduleId);
        });

        it('#13 시스템은 정기 유지보수 완료 시 해당 스케줄의 다음 예정일을 자동 갱신한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    maintenanceScheduleId: scheduleId,
                    type: 'scheduled',
                    description: '필터 교체',
                    performedAt: '2026-04-01',
                });

            const schedRes = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-schedules`,
                );

            const schedule = schedRes.body.find(
                (s: any) => s.id === scheduleId,
            );
            expect(schedule.nextOccurrenceAt).toBe('2026-07-01');
        });

        it('#14 사용자는 비정기 수리를 기록한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    type: 'repair',
                    description: '컴프레서 교체',
                    servicedBy: 'LG 서비스센터',
                    cost: 250000,
                    performedAt: '2026-04-02',
                })
                .expect(201);

            expect(res.body.type).toBe('repair');
            expect(res.body.servicedBy).toBe('LG 서비스센터');
            expect(Number(res.body.cost)).toBe(250000);
        });

        it('#15 사용자는 점검을 기록한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    type: 'inspection',
                    description: '연간 정기 점검',
                    performedAt: '2026-04-03',
                })
                .expect(201);

            expect(res.body.type).toBe('inspection');
        });

        it('#16 사용자는 가전별 유지보수 이력을 시간순으로 조회한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    type: 'repair',
                    description: '수리 1',
                    performedAt: '2026-04-01',
                });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    type: 'inspection',
                    description: '점검 1',
                    performedAt: '2026-04-02',
                });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .expect(200);

            expect(res.body).toHaveLength(2);
        });

        it('#17 사용자는 유형 필터로 이력을 조회한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    type: 'repair',
                    description: '수리',
                    performedAt: '2026-04-01',
                });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs`,
                )
                .send({
                    type: 'inspection',
                    description: '점검',
                    performedAt: '2026-04-02',
                });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances/${applianceId}/maintenance-logs?type=repair`,
                )
                .expect(200);

            expect(res.body).toHaveLength(1);
            expect(res.body[0].type).toBe('repair');
        });
    });

    // ── UC-12 데이터 무결성 (가전 관련) ──

    describe('UC-12. 거점 삭제 시 가전 데이터 정리', () => {
        it('거점 삭제 시 가전도 삭제되어야 한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' });

            await testSuite
                .authenticatedRequest(accessToken)
                .delete(`/api/households/${householdId}`)
                .expect(204);

            const newHouseholdRes = await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/households')
                .send({ name: '새 거점', kind: 'home' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${newHouseholdRes.body.id}/appliances`,
                )
                .expect(200);

            expect(res.body).toHaveLength(0);
        });
    });
});
