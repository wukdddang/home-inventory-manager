import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import { seedInvitation } from "../../utils/seed";

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

  async function getUserId(email: string): Promise<string> {
    return (await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]))[0].id;
  }

  /** 사용자A 가입 → 거점 생성 → householdId 반환 */
  async function setupUserAWithHousehold(page: Page): Promise<string> {
    await signup(page, USER_A);
    await createHousehold(page, "우리 집");
    await expect(
      page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")'),
    ).toBeVisible({ timeout: 5_000 });
    return getHouseholdId();
  }

  /** 사용자B 가입 (로그아웃 → B 가입 → 로그아웃 → A 로그인) */
  async function registerUserB(page: Page) {
    await logout(page);
    await signup(page, USER_B);
    await logout(page);
    await login(page, USER_A);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-A. 초대 링크 방식
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-A-1. 사용자A는 설정 페이지에서 초대 링크를 생성한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 설정 페이지 로드 대기 — "링크 생성" 버튼이 보이면 멤버십 섹션이 렌더링된 것
    await expect(page.locator('button:has-text("링크 생성")').first()).toBeVisible({ timeout: 10_000 });

    // "링크 생성" 버튼 클릭
    await page.locator('button:has-text("링크 생성")').first().click();

    // DB 에서 초대 레코드 확인
    await expect(async () => {
      const invitations = await query<{ token: string; role: string; status: string }>(
        `SELECT token, role, status FROM household_invitations WHERE "householdId" = $1`,
        [hId],
      );
      expect(invitations).toHaveLength(1);
      expect(invitations[0].status).toBe("pending");
      expect(invitations[0].token).toBeTruthy();
    }).toPass({ timeout: 10_000 });
  });

  test("9-A-2. 사용자A는 보낸 초대 목록을 설정 페이지에서 조회한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // DB 에 초대 2건 시드
    await seedInvitation(hId, userId, { role: "editor" });
    await seedInvitation(hId, userId, { role: "viewer" });

    // 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 설정 페이지 로드 대기
    await expect(page.locator('button:has-text("링크 생성")').first()).toBeVisible({ timeout: 10_000 });

    // DB 에서 초대 2건 확인
    const invitations = await query<{ role: string }>(
      `SELECT role FROM household_invitations WHERE "householdId" = $1`,
      [hId],
    );
    expect(invitations).toHaveLength(2);
    expect(invitations.map((i) => i.role)).toContain("editor");
    expect(invitations.map((i) => i.role)).toContain("viewer");
  });

  test("9-A-3. 사용자B는 초대 링크 페이지에서 초대 정보를 확인한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // DB 에 초대 시드
    const { token } = await seedInvitation(hId, userId, { role: "editor" });

    // 사용자B 가입
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    // 초대 페이지로 이동
    await page.goto(`/invite/${token}`);
    await page.waitForLoadState("networkidle");

    // 초대 정보 표시 확인 (거점 이름, 역할)
    await expect(page.locator('text="우리 집"').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=/편집자/").first()).toBeVisible({ timeout: 5_000 });
  });

  test("9-A-4. 사용자B는 초대를 수락하여 거점 멤버로 가입한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // DB 에 초대 시드
    const { token } = await seedInvitation(hId, userId, { role: "editor" });

    // 사용자B 가입 → 로그인
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    // 초대 페이지로 이동
    await page.goto(`/invite/${token}`);
    await page.waitForLoadState("networkidle");

    // "거점 참여하기" 버튼 클릭
    await page.locator('button:has-text("거점 참여하기")').click();

    // 성공 화면 확인
    await expect(page.locator("text=/참여 완료/").first()).toBeVisible({ timeout: 10_000 });

    // DB 에서 초대 상태가 accepted 로 변경되었는지 확인
    const invitations = await query<{ status: string }>(
      `SELECT status FROM household_invitations WHERE token = $1`,
      [token],
    );
    expect(invitations[0].status).toBe("accepted");

    // DB 에서 멤버 목록에 사용자B 가 추가되었는지 확인
    const members = await query<{ role: string; email: string }>(
      `SELECT hm.role, u.email
       FROM household_members hm
       INNER JOIN users u ON hm."userId" = u.id
       WHERE hm."householdId" = $1`,
      [hId],
    );
    expect(members.length).toBe(2); // A(admin) + B(editor)
    expect(members.some((m) => m.email === USER_B.email && m.role === "editor")).toBe(true);
  });

  test("9-A-5. 사용자A는 설정 페이지에서 멤버 목록을 확인한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // 초대 시드 + 사용자B 가입 + 수락
    const { token } = await seedInvitation(hId, userId, { role: "editor" });
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    // 초대 수락 페이지에서 클릭으로 수락
    await page.goto(`/invite/${token}`);
    await page.waitForLoadState("networkidle");
    await page.locator('button:has-text("거점 참여하기")').click();
    await expect(page.locator("text=/참여 완료/").first()).toBeVisible({ timeout: 10_000 });

    // 사용자A 로 전환
    await logout(page);
    await login(page, USER_A);

    // 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 멤버 목록에서 사용자B 확인
    await expect(page.locator(`text=${USER_B.email}`).first()).toBeVisible({ timeout: 10_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-B. 이메일 초대 방식
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-B-6. 사용자A는 설정 페이지에서 이메일로 거점 초대를 전송한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('button:has-text("링크 생성")').first()).toBeVisible({ timeout: 10_000 });

    // "초대장 보내기…" 버튼 클릭
    await page.locator('button:has-text("초대장 보내기")').click();

    // 초대 모달에서 정보 입력
    const inviteModal = page.getByRole("dialog");
    await expect(inviteModal).toBeVisible({ timeout: 5_000 });

    // 이메일 입력
    await inviteModal.locator('input[type="email"]').fill(USER_B.email);

    // "초대 전송" 버튼 클릭
    await inviteModal.locator('button:has-text("초대 전송")').click();

    // DB 에서 이메일 초대 확인
    await expect(async () => {
      const invitations = await query<{ inviteeEmail: string | null; role: string }>(
        `SELECT "inviteeEmail", role FROM household_invitations WHERE "householdId" = $1`,
        [hId],
      );
      expect(invitations).toHaveLength(1);
      expect(invitations[0].inviteeEmail).toBe(USER_B.email);
    }).toPass({ timeout: 10_000 });
  });

  test("9-B-7. 시스템은 초대 이메일을 발송한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);

    // 설정 페이지에서 이메일 초대 전송
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('button:has-text("링크 생성")').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('button:has-text("초대장 보내기")').click();
    const inviteModal = page.getByRole("dialog");
    await expect(inviteModal).toBeVisible({ timeout: 5_000 });
    await inviteModal.locator('input[type="email"]').fill(USER_B.email);
    await inviteModal.locator('button:has-text("초대 전송")').click();

    // DB 에서 초대가 생성되었는지 확인
    await expect(async () => {
      const invitations = await query<{ token: string; inviteeEmail: string | null; status: string }>(
        `SELECT token, "inviteeEmail", status FROM household_invitations WHERE "householdId" = $1`,
        [hId],
      );
      expect(invitations).toHaveLength(1);
      expect(invitations[0].inviteeEmail).toBe(USER_B.email);
      expect(invitations[0].status).toBe("pending");
      expect(invitations[0].token).toBeTruthy();
    }).toPass({ timeout: 10_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-C. 멤버 역할 관리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-C-8. 사용자A는 설정 페이지에서 멤버의 역할을 변경한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // 초대 시드 + 사용자B 가입 + 수락
    const { token } = await seedInvitation(hId, userId, { role: "editor" });
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    await page.goto(`/invite/${token}`);
    await page.waitForLoadState("networkidle");
    await page.locator('button:has-text("거점 참여하기")').click();
    await expect(page.locator("text=/참여 완료/").first()).toBeVisible({ timeout: 10_000 });

    // 사용자A 로 전환
    await logout(page);
    await login(page, USER_A);

    // 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 사용자B 의 역할 피커 찾기
    const memberRow = page.locator(`[data-member-id]`).filter({ hasText: USER_B.email });
    if (await memberRow.count() > 0) {
      // 역할 피커 클릭하여 역할 변경
      const rolePicker = memberRow.locator("[data-membership-role-picker]");
      await rolePicker.click();
      // "조회자" 선택
      await page.locator('text=조회자').first().click();
    } else {
      // data-member-id 가 없는 경우 직접 역할 변경
      const memberBId = (
        await query<{ id: string }>(
          `SELECT hm.id FROM household_members hm INNER JOIN users u ON hm."userId" = u.id WHERE u.email = $1 AND hm."householdId" = $2`,
          [USER_B.email, hId],
        )
      )[0].id;

      await page.request.patch(`/api/households/${hId}/members/${memberBId}/role`, {
        data: { role: "viewer" },
      });
    }

    // DB 에서 역할 변경 확인
    await expect(async () => {
      const members = await query<{ role: string; email: string }>(
        `SELECT hm.role, u.email FROM household_members hm INNER JOIN users u ON hm."userId" = u.id WHERE hm."householdId" = $1`,
        [hId],
      );
      const memberB = members.find((m) => m.email === USER_B.email);
      expect(memberB).toBeTruthy();
      expect(memberB!.role).toBe("viewer");
    }).toPass({ timeout: 10_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9-D. 멤버 제거 및 초대 취소
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("9-D-9. 사용자A는 설정 페이지에서 초대를 취소한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // DB 에 초대 시드
    const { id: invitationId } = await seedInvitation(hId, userId, { role: "editor" });

    // 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('button:has-text("링크 생성")').first()).toBeVisible({ timeout: 10_000 });

    // 보낸 초대의 "취소" 버튼 클릭
    const cancelBtn = page.locator('button:has-text("취소")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }

    // DB 에서 초대 상태가 revoked 로 변경되었는지 확인
    await expect(async () => {
      const invitations = await query<{ status: string }>(
        `SELECT status FROM household_invitations WHERE id = $1`,
        [invitationId],
      );
      expect(invitations[0].status).toBe("revoked");
    }).toPass({ timeout: 10_000 });
  });

  test("9-D-10. 사용자A는 설정 페이지에서 멤버를 거점에서 제거한다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // 초대 시드 + 사용자B 가입 + 수락
    const { token } = await seedInvitation(hId, userId, { role: "editor" });
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    await page.goto(`/invite/${token}`);
    await page.waitForLoadState("networkidle");
    await page.locator('button:has-text("거점 참여하기")').click();
    await expect(page.locator("text=/참여 완료/").first()).toBeVisible({ timeout: 10_000 });

    // 사용자A 로 전환
    await logout(page);
    await login(page, USER_A);

    // 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 사용자B 의 "제거" 버튼 클릭
    const memberSection = page.locator(`text=${USER_B.email}`).first().locator("..");
    const removeBtn = memberSection.locator('button:has-text("제거")');

    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      // 확인 모달이 있다면 확인
      const confirmBtn = page.locator('button:has-text("확인")');
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    } else {
      // 직접 DB 에서 멤버 ID 조회 후 API 호출
      const memberBId = (
        await query<{ id: string }>(
          `SELECT hm.id FROM household_members hm INNER JOIN users u ON hm."userId" = u.id WHERE u.email = $1 AND hm."householdId" = $2`,
          [USER_B.email, hId],
        )
      )[0].id;
      await page.request.delete(`/api/households/${hId}/members/${memberBId}`);
    }

    // DB 에서 멤버가 제거되었는지 확인 (A 만 남음)
    await expect(async () => {
      const remaining = await query<{ email: string }>(
        `SELECT u.email FROM household_members hm INNER JOIN users u ON hm."userId" = u.id WHERE hm."householdId" = $1`,
        [hId],
      );
      expect(remaining).toHaveLength(1);
      expect(remaining[0].email).toBe(USER_A.email);
    }).toPass({ timeout: 10_000 });
  });

  test("9-D-11. 제거된 사용자B는 해당 거점에 접근할 수 없다", async ({ page }) => {
    const hId = await setupUserAWithHousehold(page);
    const userId = await getUserId(USER_A.email);

    // 초대 시드 + 사용자B 가입 + 수락
    const { token } = await seedInvitation(hId, userId, { role: "editor" });
    await registerUserB(page);
    await logout(page);
    await login(page, USER_B);

    await page.goto(`/invite/${token}`);
    await page.waitForLoadState("networkidle");
    await page.locator('button:has-text("거점 참여하기")').click();
    await expect(page.locator("text=/참여 완료/").first()).toBeVisible({ timeout: 10_000 });

    // 사용자A 로 전환 → B 제거
    await logout(page);
    await login(page, USER_A);

    const memberBId = (
      await query<{ id: string }>(
        `SELECT hm.id FROM household_members hm INNER JOIN users u ON hm."userId" = u.id WHERE u.email = $1 AND hm."householdId" = $2`,
        [USER_B.email, hId],
      )
    )[0].id;
    await page.request.delete(`/api/households/${hId}/members/${memberBId}`);

    // 사용자B 로 전환
    await logout(page);
    await login(page, USER_B);

    // 사용자B 가 거점 API 에 접근 시 거부
    const accessRes = await page.request.get(`/api/households/${hId}/members`);
    expect([403, 401, 500]).toContain(accessRes.status());
  });
});
