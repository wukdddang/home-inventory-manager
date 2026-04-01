import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../utils/db";
import { clearAllMails } from "../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
  newPassword: "NewPass5678!@",
};

test.describe("UC-02. 비밀번호 변경", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await clearAllMails();
  });

  // ── 헬퍼 ──

  /** 회원가입 후 대시보드까지 이동 */
  async function signupAndWait(page: Page) {
    await page.goto("/signup");
    await page.locator("input#name").fill(TEST_USER.displayName);
    await page.locator("input#email").fill(TEST_USER.email);
    await page.locator("input#password").fill(TEST_USER.password);
    await page.locator("input#confirm").fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }

  /** 이메일·비밀번호로 로그인 후 대시보드까지 이동 */
  async function login(page: Page, password: string) {
    await page.goto("/login");
    await page.locator("input#email").fill(TEST_USER.email);
    await page.locator("input#password").fill(password);
    await page.locator('button[type="submit"]').click();
  }

  /** 설정 페이지에서 비밀번호 변경 모달을 열고 비밀번호를 변경한다 */
  async function changePassword(
    page: Page,
    currentPassword: string,
    newPassword: string
  ) {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // "비밀번호 변경…" 버튼 클릭
    await page.locator('button:has-text("비밀번호 변경")').click();

    // 모달이 열릴 때까지 대기
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 현재 비밀번호 입력
    const inputs = modal.locator('input[type="password"]');
    await inputs.nth(0).fill(currentPassword);
    // 새 비밀번호 입력
    await inputs.nth(1).fill(newPassword);
    // 새 비밀번호 확인 입력
    await inputs.nth(2).fill(newPassword);

    // "변경" 버튼 클릭
    await modal.locator('button:has-text("변경")').first().click();
  }

  // ── #1: 비밀번호 변경 ──

  test("1. 사용자는 설정 페이지에서 현재 비밀번호와 새 비밀번호를 입력하여 비밀번호를 변경한다", async ({
    page,
  }) => {
    await signupAndWait(page);

    // 변경 전 passwordHash 조회
    const beforeRows = await query<{ passwordHash: string }>(
      'SELECT "passwordHash" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    const hashBefore = beforeRows[0].passwordHash;

    await changePassword(page, TEST_USER.password, TEST_USER.newPassword);

    // 모달이 닫혔는지 확인 (성공 시 자동 닫힘)
    await expect(page.locator('[role="dialog"]')).toBeHidden({
      timeout: 10_000,
    });

    // 변경 후 passwordHash 가 실제로 바뀌었는지 DB 검증
    const afterRows = await query<{ passwordHash: string }>(
      'SELECT "passwordHash" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    expect(afterRows[0].passwordHash).not.toBe(hashBefore);
    // 새 비밀번호가 평문이 아닌 해시로 저장되어야 함
    expect(afterRows[0].passwordHash).not.toBe(TEST_USER.newPassword);
    expect(afterRows[0].passwordHash.length).toBeGreaterThan(0);
  });

  // ── #2: 비밀번호 변경 성공 토스트 ──

  test("2. 시스템은 비밀번호 변경 성공 토스트를 표시한다", async ({ page }) => {
    await signupAndWait(page);
    await changePassword(page, TEST_USER.password, TEST_USER.newPassword);

    // 토스트 메시지 확인
    await expect(
      page.locator("text=비밀번호가 변경되었습니다.")
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── #3: 기존 비밀번호로 로그인 실패 ──

  test("3. 사용자는 로그아웃 후 기존 비밀번호로 로그인을 시도하면 실패한다", async ({
    page,
  }) => {
    await signupAndWait(page);
    await changePassword(page, TEST_USER.password, TEST_USER.newPassword);

    // 모달 닫힘 대기
    await expect(page.locator('[role="dialog"]')).toBeHidden({
      timeout: 10_000,
    });

    // 로그아웃
    await page.locator('button:has-text("로그아웃")').click();
    await page.waitForURL("**/login", { timeout: 10_000 });

    // 기존 비밀번호로 로그인 시도
    await login(page, TEST_USER.password);

    // 대시보드로 이동하지 않아야 함 (로그인 페이지에 머무르거나 에러 표시)
    await page.waitForTimeout(3_000);
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  // ── #4: 새 비밀번호로 로그인 ──

  test("4. 사용자는 새 비밀번호로 로그인한다", async ({ page }) => {
    await signupAndWait(page);
    await changePassword(page, TEST_USER.password, TEST_USER.newPassword);

    // 모달 닫힘 대기
    await expect(page.locator('[role="dialog"]')).toBeHidden({
      timeout: 10_000,
    });

    // 로그아웃
    await page.locator('button:has-text("로그아웃")').click();
    await page.waitForURL("**/login", { timeout: 10_000 });

    // 새 비밀번호로 로그인
    await login(page, TEST_USER.newPassword);
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
