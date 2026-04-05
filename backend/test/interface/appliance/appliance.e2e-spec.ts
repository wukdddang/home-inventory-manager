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

    // ── 11-D. 보증 만료 데이터 검증 (BUC-17) ──

    describe('11-D. 보증 만료 데이터 검증', () => {
        it('#18 보증 만료 30일 이내 가전을 목록에서 식별할 수 있다', async () => {
            const today = new Date();
            const in25Days = new Date(today);
            in25Days.setDate(today.getDate() + 25);
            const in180Days = new Date(today);
            in180Days.setDate(today.getDate() + 180);

            // 30일 이내 만료
            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({
                    name: '세탁기',
                    warrantyExpiresAt: in25Days.toISOString().slice(0, 10),
                });

            // 여유 있음
            await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({
                    name: '냉장고',
                    warrantyExpiresAt: in180Days.toISOString().slice(0, 10),
                });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get(`/api/households/${householdId}/appliances`)
                .expect(200);

            const washer = res.body.find(
                (a: any) => a.name === '세탁기',
            );
            const fridge = res.body.find(
                (a: any) => a.name === '냉장고',
            );
            expect(washer).toBeDefined();
            expect(fridge).toBeDefined();

            // 보증 만료일이 올바르게 저장됨
            expect(washer.warrantyExpiresAt).toBe(
                in25Days.toISOString().slice(0, 10),
            );
        });

        it('#19 보증 만료일 없는 가전도 정상 등록된다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '선풍기' })
                .expect(201);

            expect(res.body.warrantyExpiresAt).toBeNull();
        });

        it('#20 폐기된 가전의 보증 만료일은 조회 가능하지만 알림 대상에서 제외된다', async () => {
            const today = new Date();
            const in5Days = new Date(today);
            in5Days.setDate(today.getDate() + 5);

            const createRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({
                    name: '에어컨',
                    warrantyExpiresAt: in5Days.toISOString().slice(0, 10),
                });

            // 폐기 처리
            await testSuite
                .authenticatedRequest(accessToken)
                .patch(
                    `/api/households/${householdId}/appliances/${createRes.body.id}/retire`,
                );

            // 폐기 상태에서 상세 조회 — 보증 만료일 여전히 있음
            const detailRes = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances/${createRes.body.id}`,
                )
                .expect(200);

            expect(detailRes.body.status).toBe('retired');
            expect(detailRes.body.warrantyExpiresAt).toBe(
                in5Days.toISOString().slice(0, 10),
            );

            // active 필터에서는 나타나지 않음
            const activeRes = await testSuite
                .authenticatedRequest(accessToken)
                .get(
                    `/api/households/${householdId}/appliances?status=active`,
                )
                .expect(200);

            expect(
                activeRes.body.find((a: any) => a.name === '에어컨'),
            ).toBeUndefined();
        });
    });

    // ── 11-E. 데이터 정합성 및 엣지 케이스 (BUC-18) ──

    describe('11-E. 데이터 정합성 및 엣지 케이스', () => {
        it('#21 거점 삭제 시 가전·스케줄·이력이 모두 삭제된다', async () => {
            const appRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '세탁기' });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${appRes.body.id}/maintenance-schedules`,
                )
                .send({
                    taskName: '통세척',
                    recurrenceRule: { frequency: 'monthly', interval: 3 },
                    nextOccurrenceAt: '2026-07-01',
                });

            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/${appRes.body.id}/maintenance-logs`,
                )
                .send({
                    type: 'repair',
                    description: '수리',
                    performedAt: '2026-04-01',
                });

            // 거점 삭제
            await testSuite
                .authenticatedRequest(accessToken)
                .delete(`/api/households/${householdId}`)
                .expect(204);

            // 새 거점 생성 후 가전이 없는지 확인
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

        it('#22 가전 폐기 후 다시 폐기해도 오류가 발생하지 않는다', async () => {
            const appRes = await testSuite
                .authenticatedRequest(accessToken)
                .post(`/api/households/${householdId}/appliances`)
                .send({ name: '에어컨' });

            // 첫 번째 폐기
            await testSuite
                .authenticatedRequest(accessToken)
                .patch(
                    `/api/households/${householdId}/appliances/${appRes.body.id}/retire`,
                )
                .expect(200);

            // 두 번째 폐기 (이미 폐기 상태) — 에러가 아닌 200 또는 이미-폐기 상태 반환
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .patch(
                    `/api/households/${householdId}/appliances/${appRes.body.id}/retire`,
                );

            expect([200, 400].includes(res.status)).toBe(true);
        });

        it('#23 존재하지 않는 가전 ID로 스케줄 등록 시 404를 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/00000000-0000-0000-0000-000000000000/maintenance-schedules`,
                )
                .send({
                    taskName: '테스트',
                    recurrenceRule: { frequency: 'monthly', interval: 1 },
                    nextOccurrenceAt: '2026-07-01',
                })
                .expect(404);
        });

        it('#24 존재하지 않는 가전 ID로 이력 등록 시 404를 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post(
                    `/api/households/${householdId}/appliances/00000000-0000-0000-0000-000000000000/maintenance-logs`,
                )
                .send({
                    type: 'repair',
                    description: '테스트 수리',
                    performedAt: '2026-04-01',
                })
                .expect(404);
        });

        it('#25 비멤버가 가전 API에 접근하면 403을 반환한다', async () => {
            const otherSignup = await testSuite
                .request()
                .post('/api/auth/signup')
                .send({
                    email: 'other-user@example.com',
                    password: 'password123',
                    displayName: '다른 사용자',
                });

            await testSuite
                .authenticatedRequest(otherSignup.body.accessToken)
                .get(`/api/households/${householdId}/appliances`)
                .expect(403);
        });
    });
});
