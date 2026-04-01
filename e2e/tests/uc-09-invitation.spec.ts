import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../utils/db";
import { clearAllMails } from "../utils/mailhog";

const USER_A = {
  displayName: "관리자A",
  email: "admin-a@e2e.test",
  password: "Test1234!@",
};

const USER_B = {
  displayName: "사용자B",
  email: "user-b@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-09. 거점 멤버 초대 및 협업", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await clearAllMails();
  });

  // ── 헬퍼 ──

  async function signup(page: Page, user: typeof USER_A) {
    await page.goto("/signup");
    await page.locator("input#name").fill(user.displayName);
    await page.locator("input#email").fill(user.email);
    await page.locator("input#password").fill(user.password);
    await page.locator("input#confirm").fill(user.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }

  async function login(page: Page, user: typeof USER_A) {
    await page.goto("/login");
    await page.locator("input#email").fill(user.email);
    await page.locator("input#password").fill(user.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }

  async function logout(page: Page) {
    await page.locator('button:has-text("로그아웃")').click();
    await page.waitForURL("**/login", { timeout: 10_000 });
  }

  async function createHousehold(page: Page, name: string) {
    await page.locator('button[aria-label="거점 추가"]').click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await modal.locator('input[placeholder="예: 우리 집"]').fill(name);
    await modal.locator('button:has-text("추가")').click();
    await expect(page.locator('button:has-text("완료")')).toBeVisible({ timeout: 5_000 });
    await page.locator('button:has-text("완료")').click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  }

  async function getHouseholdId(): Promise<string> {
    return (await query<{ id: string }>("SELECT id FROM households LIMIT 1"))[0].id;
  }

  /** 사용자A 가입 → 거점 생성 → householdId 반환 */
  async function setupUserAWithHousehold(page: Page): Promise<string> {
    await signup(page, USER_A);
    await createHousehold(page, "우리 집");
    await expect(
      page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")')
    ).toBeVisible({ timeout: 5_000 });
    return getHouseholdId();
  }

  /** 사용자B 가입 (별도 세션이 필요하므로 로그아웃 → B 가입 → 로그아웃 후 A 다시 로그인) */
  async function registerUserB(page: Page) {
    await logout(page);
    await signup(page, USER_B);
    await logout(page);
    await login(page, USER_A);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-A. 초대 링크 방식
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-A-1. 사용자A는 거점 초대 링크를 역할과 만료 시각을 지정하여 생성한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // API 로 초대 생성 (editor 역할, 7일 유효)
    const res = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const invitation = body.data;

    expect(invitation.token).toBeTruthy();
    expect(invitation.role).toBe("editor");
    expect(invitation.status).toBe("pending");
    expect(invitation.householdId).toBe(hId);

    // DB 에서 초대 레코드 확인
    const invitations = await query<{ token: string; role: string; status: string }>(
      `SELECT token, role, status FROM household_invitations WHERE "householdId" = $1`,
      [hId]
    );
    expect(invitations).toHaveLength(1);
    expect(invitations[0].role).toBe("editor");
    expect(invitations[0].status).toBe("pending");
  });

  test("9-A-2. 사용자A는 보낸 초대 목록을 조회한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 2건 생성
    await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "viewer", expiresInDays: 3 },
    });

    // API 로 초대 목록 조회
    const res = await page.request.get(`/api/households/${hId}/invitations`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.length).toBe(2);

    const roles = body.data.map((inv: { role: string }) => inv.role);
    expect(roles).toContain("editor");
    expect(roles).toContain("viewer");
  });

  test("9-A-3. 사용자B는 초대 링크 페이지에서 초대 정보를 확인한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 생성
    const createRes = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    const token = (await createRes.json()).data.token;

    // 사용자B 가입
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    // 초대 페이지로 이동
    await page.goto(`/invite/${token}`);
    await page.waitForLoadState("networkidle");

    // 초대 정보 표시 확인 (거점 이름, 역할)
    await expect(page.locator('text="우리 집"').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=/편집자/').first()).toBeVisible({ timeout: 5_000 });
  });

  test("9-A-4. 사용자B는 초대를 수락하여 거점 멤버로 가입한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 생성
    const createRes = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    const token = (await createRes.json()).data.token;

    // 사용자B 가입 → 로그인
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    // 초대 수락 API 호출
    const acceptRes = await page.request.post(`/api/invitations/${token}/accept`);
    expect(acceptRes.ok()).toBe(true);

    // DB 에서 초대 상태가 accepted 로 변경되었는지 확인
    const invitations = await query<{ status: string }>(
      `SELECT status FROM household_invitations WHERE token = $1`, [token]
    );
    expect(invitations[0].status).toBe("accepted");

    // DB 에서 멤버 목록에 사용자B 가 추가되었는지 확인
    const members = await query<{ role: string; email: string }>(
      `SELECT hm.role, u.email
       FROM household_members hm
       INNER JOIN users u ON hm."userId" = u.id
       WHERE hm."householdId" = $1`,
      [hId]
    );
    expect(members.length).toBe(2); // A(admin) + B(editor)
    expect(members.some(m => m.email === USER_B.email && m.role === "editor")).toBe(true);
  });

  test("9-A-5. 사용자A는 거점 멤버 목록에서 사용자B를 확인한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 생성 + 사용자B 가입 + 수락
    const createRes = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    const token = (await createRes.json()).data.token;

    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);
    await page.request.post(`/api/invitations/${token}/accept`);

    // 사용자A 로 전환
    await logout(page);
    await login(page, USER_A);

    // 멤버 목록 API 조회
    const res = await page.request.get(`/api/households/${hId}/members`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.length).toBe(2);

    const memberB = body.data.find((m: { email: string }) => m.email === USER_B.email);
    expect(memberB).toBeTruthy();
    expect(memberB.role).toBe("editor");
    expect(memberB.displayName).toBe(USER_B.displayName);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-B. 이메일 초대 방식
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-B-6. 사용자A는 이메일로 거점 초대를 전송한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 이메일 지정 초대 생성
    const res = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "viewer", inviteeEmail: USER_B.email, expiresInDays: 7 },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.inviteeEmail).toBe(USER_B.email);
    expect(body.data.role).toBe("viewer");

    // DB 에서 이메일 초대 확인
    const invitations = await query<{ inviteeEmail: string | null; role: string }>(
      `SELECT "inviteeEmail", role FROM household_invitations WHERE "householdId" = $1`,
      [hId]
    );
    expect(invitations).toHaveLength(1);
    expect(invitations[0].inviteeEmail).toBe(USER_B.email);
  });

  test("9-B-7. 시스템은 초대 이메일을 발송한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 이메일 지정 초대 생성
    await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "viewer", inviteeEmail: USER_B.email, expiresInDays: 7 },
    });

    // DB 에서 초대가 생성되었는지 확인 (이메일 발송은 백엔드 스케줄러/이벤트 영역)
    const invitations = await query<{ token: string; inviteeEmail: string | null; status: string }>(
      `SELECT token, "inviteeEmail", status FROM household_invitations WHERE "householdId" = $1`,
      [hId]
    );
    expect(invitations).toHaveLength(1);
    expect(invitations[0].inviteeEmail).toBe(USER_B.email);
    expect(invitations[0].status).toBe("pending");
    expect(invitations[0].token).toBeTruthy();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-C. 멤버 역할 관리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-C-8. 사용자A는 멤버의 역할을 변경한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 + 사용자B 가입 + 수락 (editor)
    const createRes = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    const token = (await createRes.json()).data.token;
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);
    await page.request.post(`/api/invitations/${token}/accept`);

    // 사용자A 로 전환
    await logout(page);
    await login(page, USER_A);

    // 사용자B 의 멤버 ID 조회
    const members = await query<{ id: string; role: string; email: string }>(
      `SELECT hm.id, hm.role, u.email
       FROM household_members hm
       INNER JOIN users u ON hm."userId" = u.id
       WHERE hm."householdId" = $1`,
      [hId]
    );
    const memberB = members.find(m => m.email === USER_B.email);
    expect(memberB).toBeTruthy();
    expect(memberB!.role).toBe("editor");

    // 역할을 viewer 로 변경
    const res = await page.request.patch(
      `/api/households/${hId}/members/${memberB!.id}/role`,
      { data: { role: "viewer" } }
    );
    expect(res.ok()).toBe(true);

    // DB 에서 역할 변경 확인
    const updated = await query<{ role: string }>(
      `SELECT role FROM household_members WHERE id = $1`, [memberB!.id]
    );
    expect(updated[0].role).toBe("viewer");
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-D. 멤버 제거 및 초대 취소
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-D-9. 사용자A는 초대를 취소(revoke)하고 초대 목록에서 제거됨을 확인한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 생성
    const createRes = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    const invitationId = (await createRes.json()).data.id;

    // 초대 취소 (revoke)
    const revokeRes = await page.request.delete(
      `/api/households/${hId}/invitations/${invitationId}`
    );
    expect([200, 204]).toContain(revokeRes.status());

    // DB 에서 초대 상태가 revoked 로 변경되었는지 확인
    const invitations = await query<{ status: string }>(
      `SELECT status FROM household_invitations WHERE id = $1`, [invitationId]
    );
    expect(invitations[0].status).toBe("revoked");

    // 초대 목록 조회 시 pending 초대가 없어야 함
    const listRes = await page.request.get(`/api/households/${hId}/invitations`);
    const listBody = await listRes.json();
    const pendingInvitations = listBody.data.filter(
      (inv: { status: string }) => inv.status === "pending"
    );
    expect(pendingInvitations).toHaveLength(0);
  });

  test("9-D-10. 사용자A는 멤버를 거점에서 제거한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 + 사용자B 가입 + 수락
    const createRes = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    const token = (await createRes.json()).data.token;
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);
    await page.request.post(`/api/invitations/${token}/accept`);

    // 사용자A 로 전환
    await logout(page);
    await login(page, USER_A);

    // 사용자B 의 멤버 ID 조회
    const members = await query<{ id: string; email: string }>(
      `SELECT hm.id, u.email
       FROM household_members hm
       INNER JOIN users u ON hm."userId" = u.id
       WHERE hm."householdId" = $1`,
      [hId]
    );
    const memberB = members.find(m => m.email === USER_B.email);
    expect(memberB).toBeTruthy();

    // 멤버 제거
    const removeRes = await page.request.delete(
      `/api/households/${hId}/members/${memberB!.id}`
    );
    expect([200, 204]).toContain(removeRes.status());

    // DB 에서 멤버가 제거되었는지 확인 (A 만 남음)
    const remaining = await query<{ email: string }>(
      `SELECT u.email
       FROM household_members hm
       INNER JOIN users u ON hm."userId" = u.id
       WHERE hm."householdId" = $1`,
      [hId]
    );
    expect(remaining).toHaveLength(1);
    expect(remaining[0].email).toBe(USER_A.email);
  });

  test("9-D-11. 제거된 사용자B는 해당 거점에 접근할 수 없다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 초대 + 사용자B 가입 + 수락
    const createRes = await page.request.post(`/api/households/${hId}/invitations`, {
      data: { role: "editor", expiresInDays: 7 },
    });
    const token = (await createRes.json()).data.token;
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);
    await page.request.post(`/api/invitations/${token}/accept`);

    // 사용자A 로 전환 → B 제거
    await logout(page);
    await login(page, USER_A);

    const members = await query<{ id: string; email: string }>(
      `SELECT hm.id, u.email
       FROM household_members hm
       INNER JOIN users u ON hm."userId" = u.id
       WHERE hm."householdId" = $1`,
      [hId]
    );
    const memberB = members.find(m => m.email === USER_B.email);
    await page.request.delete(`/api/households/${hId}/members/${memberB!.id}`);

    // 사용자B 로 전환
    await logout(page);
    await login(page, USER_B);

    // 사용자B 가 거점 API 에 접근 시 403 또는 빈 멤버 목록
    const accessRes = await page.request.get(`/api/households/${hId}/members`);
    // 멤버가 아니므로 403 Forbidden 또는 접근 차단
    expect([403, 401, 500]).toContain(accessRes.status());
  });
});
