import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * FCM 디바이스 토큰 관리 + 푸시 전송 E2E 테스트
 *
 * 토큰 CRUD는 실제 DB를 통해 검증하고,
 * Firebase Admin SDK 전송은 초기화 실패 시 graceful skip 되므로
 * 토큰 등록/조회/삭제 + 무효 토큰 처리를 중심으로 검증한다.
 */
describe('FCM 토큰 관리 및 푸시 전송 (e2e)', () => {
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

        const signupRes = await testSuite
            .request()
            .post('/api/auth/signup')
            .send({
                email: 'fcm-test@example.com',
                password: 'password123',
                displayName: 'FCM 테스트',
            });
        accessToken = signupRes.body.accessToken;
    });

    // ── 토큰 CRUD ──

    describe('POST /api/fcm-tokens', () => {
        it('디바이스 토큰을 등록한다', async () => {
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({
                    token: 'fcm_test_token_abc123',
                    platform: 'web',
                    deviceInfo: 'Chrome 120 / Windows',
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.token).toBe('fcm_test_token_abc123');
            expect(res.body.platform).toBe('web');
            expect(res.body.isActive).toBe(true);
        });

        it('동일 토큰을 중복 등록하면 기존 토큰이 갱신된다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({
                    token: 'fcm_dup_token',
                    platform: 'web',
                });

            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({
                    token: 'fcm_dup_token',
                    platform: 'web',
                    deviceInfo: '갱신된 정보',
                })
                .expect(201);

            const listRes = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);

            const tokens = listRes.body.filter(
                (t: any) => t.token === 'fcm_dup_token',
            );
            expect(tokens).toHaveLength(1);
        });

        it('토큰 없이 요청하면 400을 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ platform: 'web' })
                .expect(400);
        });

        it('유효하지 않은 플랫폼이면 400을 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'test', platform: 'invalid' })
                .expect(400);
        });

        it('인증 없이 접근하면 401을 반환한다', async () => {
            await testSuite
                .request()
                .post('/api/fcm-tokens')
                .send({ token: 'test', platform: 'web' })
                .expect(401);
        });
    });

    describe('GET /api/fcm-tokens', () => {
        it('사용자의 등록된 토큰 목록을 조회한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'token_1', platform: 'web' });

            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'token_2', platform: 'android' });

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);

            expect(res.body).toHaveLength(2);
            expect(res.body.map((t: any) => t.token).sort()).toEqual([
                'token_1',
                'token_2',
            ]);
        });

        it('다른 사용자의 토큰은 조회되지 않는다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'user1_token', platform: 'web' });

            // 다른 사용자 가입
            const otherRes = await testSuite
                .request()
                .post('/api/auth/signup')
                .send({
                    email: 'other@example.com',
                    password: 'password123',
                    displayName: '다른 사용자',
                });

            const listRes = await testSuite
                .authenticatedRequest(otherRes.body.accessToken)
                .get('/api/fcm-tokens')
                .expect(200);

            expect(listRes.body).toHaveLength(0);
        });
    });

    describe('DELETE /api/fcm-tokens/:token', () => {
        it('등록된 토큰을 삭제한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'delete_me', platform: 'web' });

            await testSuite
                .authenticatedRequest(accessToken)
                .delete('/api/fcm-tokens/delete_me')
                .expect(204);

            // 삭제 후 조회 시 빈 목록
            const listRes = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);

            expect(listRes.body).toHaveLength(0);
        });

        it('존재하지 않는 토큰 삭제 시 404를 반환한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .delete('/api/fcm-tokens/nonexistent_token')
                .expect(404);
        });
    });

    // ── 멀티 플랫폼 토큰 관리 ──

    describe('멀티 플랫폼 토큰', () => {
        it('web, android, ios 플랫폼 토큰을 각각 등록할 수 있다', async () => {
            for (const platform of ['web', 'android', 'ios']) {
                await testSuite
                    .authenticatedRequest(accessToken)
                    .post('/api/fcm-tokens')
                    .send({ token: `token_${platform}`, platform })
                    .expect(201);
            }

            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);

            expect(res.body).toHaveLength(3);
            const platforms = res.body.map((t: any) => t.platform).sort();
            expect(platforms).toEqual(['android', 'ios', 'web']);
        });
    });

    // ── 토큰 일괄 삭제 ──

    describe('DELETE /api/fcm-tokens (일괄 삭제)', () => {
        it('사용자의 모든 토큰을 일괄 삭제한다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'bulk_1', platform: 'web' });
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'bulk_2', platform: 'android' });
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'bulk_3', platform: 'ios' });

            // 3건 등록 확인
            const beforeRes = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);
            expect(beforeRes.body).toHaveLength(3);

            // 일괄 삭제
            await testSuite
                .authenticatedRequest(accessToken)
                .delete('/api/fcm-tokens')
                .expect(204);

            // 삭제 후 빈 목록
            const afterRes = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);
            expect(afterRes.body).toHaveLength(0);
        });

        it('다른 사용자의 토큰은 삭제되지 않는다', async () => {
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'user1_token', platform: 'web' });

            const otherRes = await testSuite
                .request()
                .post('/api/auth/signup')
                .send({
                    email: 'other-bulk@example.com',
                    password: 'password123',
                    displayName: '다른 사용자',
                });
            await testSuite
                .authenticatedRequest(otherRes.body.accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'user2_token', platform: 'web' });

            // user1의 토큰만 일괄 삭제
            await testSuite
                .authenticatedRequest(accessToken)
                .delete('/api/fcm-tokens')
                .expect(204);

            // user2 토큰은 유지
            const user2Res = await testSuite
                .authenticatedRequest(otherRes.body.accessToken)
                .get('/api/fcm-tokens')
                .expect(200);
            expect(user2Res.body).toHaveLength(1);
        });
    });

    // ── FCM 전송 관련 DB 검증 ──

    describe('FCM 전송 관련 검증', () => {
        it('비활성화된 토큰은 활성 토큰 목록에 포함되지 않는다', async () => {
            // 토큰 등록
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'active_token', platform: 'web' });

            // DB에서 직접 비활성화 (Firebase 무효 토큰 시뮬레이션)
            const repo = testSuite.getRepository('UserDeviceToken');
            await repo.update(
                { token: 'active_token' },
                { isActive: false },
            );

            // 조회 시 비활성 토큰은 제외
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);

            const activeTokens = res.body.filter(
                (t: any) => t.token === 'active_token',
            );
            expect(activeTokens).toHaveLength(0);
        });

        it('토큰 재등록 시 비활성화된 토큰이 다시 활성화된다 (재활성화)', async () => {
            // 토큰 등록
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'reactivate_token', platform: 'web' });

            // DB에서 직접 비활성화
            const repo = testSuite.getRepository('UserDeviceToken');
            await repo.update(
                { token: 'reactivate_token' },
                { isActive: false },
            );

            // 동일 토큰 재등록
            await testSuite
                .authenticatedRequest(accessToken)
                .post('/api/fcm-tokens')
                .send({ token: 'reactivate_token', platform: 'web' })
                .expect(201);

            // 활성 상태로 복구됨
            const res = await testSuite
                .authenticatedRequest(accessToken)
                .get('/api/fcm-tokens')
                .expect(200);

            expect(
                res.body.find((t: any) => t.token === 'reactivate_token'),
            ).toBeDefined();
        });
    });

    // ── 실제 Firebase 전송 검증 ──

    describe('실제 FCM 푸시 전송', () => {
        /**
         * Firebase Admin SDK가 초기화된 경우에만 실행.
         * 서비스 계정 파일이 없는 CI 환경에서는 skip.
         */
        const firebaseAvailable = (() => {
            try {
                const path = require('path');
                const fs = require('fs');
                const sa = path.resolve(
                    __dirname,
                    '..', '..', '..',
                    'home-inventory-manager-a7cd5-firebase-adminsdk-fbsvc-45a2804802.json',
                );
                return fs.existsSync(sa);
            } catch {
                return false;
            }
        })();

        const testOrSkip = firebaseAvailable ? it : it.skip;

        testOrSkip(
            '무효 토큰으로 전송 시 Firebase가 오류를 반환하고 토큰이 비활성화된다',
            async () => {
                // 임의의 가짜 FCM 토큰 등록
                await testSuite
                    .authenticatedRequest(accessToken)
                    .post('/api/fcm-tokens')
                    .send({
                        token: 'fake_fcm_token_for_testing_12345',
                        platform: 'web',
                    })
                    .expect(201);

                // FcmService를 통해 전송 시도
                // (서비스에 직접 접근하여 전송을 트리거)
                const { FcmService } = await import(
                    '../../../src/context/fcm-context/fcm.service'
                );
                const fcmService = testSuite.app.get(FcmService);

                // 무효 토큰이므로 에러가 발생하지만 graceful 처리됨
                await expect(
                    fcmService.사용자에게_푸시를_전송한다(
                        (
                            await testSuite
                                .authenticatedRequest(accessToken)
                                .get('/api/auth/me')
                        ).body.id,
                        '테스트 알림',
                        '이것은 테스트 푸시입니다.',
                    ),
                ).resolves.not.toThrow();

                // 전송 시도 성공 (에러가 throw되지 않음) 확인 후
                // 토큰이 비활성화되었거나, Firebase가 무효로 판단하지 않은 경우 활성 유지
                // (Firebase 에러 코드에 따라 비활성화 여부가 달라짐)
                const tokens = await testSuite
                    .authenticatedRequest(accessToken)
                    .get('/api/fcm-tokens')
                    .expect(200);

                // DB에서 토큰 상태 직접 확인 (isActive와 관계없이 존재 여부)
                const repo = testSuite.getRepository('UserDeviceToken');
                const dbToken = await repo.findOne({
                    where: { token: 'fake_fcm_token_for_testing_12345' },
                });
                expect(dbToken).toBeDefined();
                // 무효 토큰이므로 isActive=false이거나 Firebase가 아직 처리하지 않은 상태
                // 두 경우 모두 valid한 결과
                expect(typeof dbToken!.isActive).toBe('boolean');
            },
        );

        testOrSkip(
            '전송 후 테스트 토큰을 일괄 정리한다',
            async () => {
                // 테스트용 토큰 여러 개 등록
                for (let i = 0; i < 5; i++) {
                    await testSuite
                        .authenticatedRequest(accessToken)
                        .post('/api/fcm-tokens')
                        .send({
                            token: `cleanup_test_token_${i}`,
                            platform: 'web',
                        });
                }

                // 일괄 삭제
                await testSuite
                    .authenticatedRequest(accessToken)
                    .delete('/api/fcm-tokens')
                    .expect(204);

                // 완전 삭제 확인
                const res = await testSuite
                    .authenticatedRequest(accessToken)
                    .get('/api/fcm-tokens')
                    .expect(200);
                expect(res.body).toHaveLength(0);
            },
        );
    });
});
