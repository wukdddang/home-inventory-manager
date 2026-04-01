import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../utils/db";
import { getLatestMailTo, extractVerifyLink, clearAllMails } from "../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-01. 신규 사용자 가입 및 인증", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await clearAllMails();
  });

  // ── 헬퍼 ──

  async function signup(page: Page) {
    await page.goto("/signup");
    await page.locator("input#name").fill(TEST_USER.displayName);
    await page.locator("input#email").fill(TEST_USER.email);
    await page.locator("input#password").fill(TEST_USER.password);
    await page.locator("input#confirm").fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
  }

  async function login(page: Page) {
    await page.goto("/login");
    await page.locator("input#email").fill(TEST_USER.email);
    await page.locator("input#password").fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
  }

  // ── #1: 회원가입 ──

  test("1. 사용자는 회원가입 페이지에서 이메일·비밀번호·이름을 입력하여 가입한다", async ({
    page,
  }) => {
    await signup(page);

    // 가입 성공 후 대시보드로 리다이렉트
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // DB 에 사용자 레코드가 생성되었는지 확인
    const users = await query<{
      email: string;
      displayName: string;
      passwordHash: string;
    }>(
      'SELECT email, "displayName", "passwordHash" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(TEST_USER.email);
    expect(users[0].displayName).toBe(TEST_USER.displayName);
    // 비밀번호는 해시되어 저장되어야 함
    expect(users[0].passwordHash).not.toBe(TEST_USER.password);
    expect(users[0].passwordHash.length).toBeGreaterThan(0);
  });

  // ── #2: 이메일 인증 토큰 발송 ──

  test("2. 시스템은 가입 후 이메일 인증 토큰을 발송한다", async ({ page }) => {
    await signup(page);
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    // MailHog 에서 인증 이메일 수신 확인
    const mail = await getLatestMailTo(TEST_USER.email);
    expect(mail).not.toBeNull();

    const verifyLink = extractVerifyLink(mail!);
    expect(verifyLink).not.toBeNull();
    expect(verifyLink).toContain("verify-email");
    expect(verifyLink).toContain("token=");
  });

  // ── #3: 이메일 인증 완료 ──

  test("3. 사용자는 유효한 인증 링크를 통해 이메일 인증을 완료하고 성공 화면을 확인한다", async ({
    page,
  }) => {
    await signup(page);
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    // MailHog 에서 인증 링크 추출
    const mail = await getLatestMailTo(TEST_USER.email);
    const verifyLink = extractVerifyLink(mail!);
    expect(verifyLink).not.toBeNull();

    // 인증 링크의 도메인을 localhost:4100 으로 치환 (APP_URL 이 다를 수 있음)
    const url = new URL(verifyLink!);
    const token = url.searchParams.get("token");

    // 인증 전: emailVerifiedAt 이 null 인지 확인
    const beforeRows = await query<{ emailVerifiedAt: string | null }>(
      'SELECT "emailVerifiedAt" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    expect(beforeRows[0].emailVerifiedAt).toBeNull();

    await page.goto(`/verify-email?token=${token}`);

    // 성공 화면 확인 (인증 성공/완료 텍스트)
    await expect(page.getByRole("heading")).toContainText("인증", {
      timeout: 10_000,
    });

    // 인증 후: emailVerifiedAt 이 설정되었는지 확인
    const afterRows = await query<{ emailVerifiedAt: string | null }>(
      'SELECT "emailVerifiedAt" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    expect(afterRows[0].emailVerifiedAt).not.toBeNull();
  });

  // ── #4: 만료된 인증 토큰 ──

  test("4. 사용자는 만료된 인증 토큰으로 접근 시 인증 실패 화면과 안내 메시지를 확인한다", async ({
    page,
  }) => {
    const fakeExpiredToken = "expired-token-" + Date.now();
    await page.goto(`/verify-email?token=${fakeExpiredToken}`);

    // 실패/에러 화면 표시
    await expect(page.getByRole("heading", { name: /실패/ })).toBeVisible({
      timeout: 10_000,
    });
  });

  // ── #5: 토큰 없이 인증 페이지 접근 ──

  test('5. 사용자는 토큰 없이 인증 페이지에 접근 시 "유효하지 않은 링크" 메시지를 확인한다', async ({
    page,
  }) => {
    await page.goto("/verify-email");

    // "유효하지 않은" 또는 에러 메시지 표시
    await expect(
      page.locator("text=/(유효하지|잘못된|링크|토큰|error)/i")
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── #6: 로그인 ──

  test("6. 사용자는 로그인 페이지에서 이메일·비밀번호로 로그인한다", async ({
    page,
  }) => {
    // 먼저 회원가입
    await signup(page);
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    // 로그아웃 (쿠키/세션 초기화를 위해 새 컨텍스트 사용 대신 로그아웃)
    await page.locator('button:has-text("로그아웃")').click();
    await page.waitForURL("**/login", { timeout: 10_000 });

    // 로그인
    await login(page);
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── #7: 내 정보 확인 ──

  test("7. 사용자는 대시보드 진입 후 내 정보(이름, 이메일)를 확인한다", async ({
    page,
  }) => {
    // 가입 → 로그인 상태
    await signup(page);
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    // 설정 페이지로 이동하여 내 정보 확인
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 설정 페이지에서 이름 또는 이메일이 표시되는지 확인
    const bodyText = await page.locator("body").textContent();
    const hasUserInfo =
      bodyText?.includes(TEST_USER.displayName) ||
      bodyText?.includes(TEST_USER.email);
    expect(hasUserInfo).toBeTruthy();
  });

  // ── #8: 로그아웃 ──

  test("8. 사용자는 로그아웃한다", async ({ page }) => {
    await signup(page);
    await page.waitForURL("**/dashboard", { timeout: 10_000 });

    // 로그아웃 전: refreshTokenHash 가 존재
    const beforeRows = await query<{ refreshTokenHash: string | null }>(
      'SELECT "refreshTokenHash" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    expect(beforeRows[0].refreshTokenHash).not.toBeNull();

    await page.locator('button:has-text("로그아웃")').click();

    // 로그인 페이지로 이동
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);

    // 로그아웃 후: refreshTokenHash 가 null 로 정리됨
    const afterRows = await query<{ refreshTokenHash: string | null }>(
      'SELECT "refreshTokenHash" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    expect(afterRows[0].refreshTokenHash).toBeNull();
  });

  // ── #9: 보호된 페이지 리다이렉트 ──

  test("9. 비인증 사용자는 보호된 페이지 접근 시 로그인 페이지로 리다이렉트된다", async ({
    page,
  }) => {
    // 로그인하지 않은 상태에서 대시보드 접근 시도
    await page.goto("/dashboard");

    // 로그인 페이지로 리다이렉트
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
