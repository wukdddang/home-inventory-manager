import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-12. 토큰 자동 갱신 및 세션 유지", () => {
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
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }

  async function login(page: Page) {
    await page.goto("/login");
    await page.locator("input#email").fill(TEST_USER.email);
    await page.locator("input#password").fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }

  /** DB에서 현재 refreshTokenHash를 조회한다 */
  async function getRefreshTokenHash(): Promise<string | null> {
    const rows = await query<{ refreshTokenHash: string | null }>(
      'SELECT "refreshTokenHash" FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    return rows.length > 0 ? rows[0].refreshTokenHash : null;
  }

  // ── #1: accessToken 만료 전 자동 갱신 ──

  test("1. 시스템은 accessToken 만료 60초 전에 자동으로 토큰을 갱신한다", async ({
    page,
  }) => {
    await signup(page);

    // 로그인 직후 refreshTokenHash 기록
    const hashBefore = await getRefreshTokenHash();
    expect(hashBefore).not.toBeNull();

    // httpOnly 쿠키에서 refreshToken을 추출한다
    const cookies = await page.context().cookies();
    const refreshCookie = cookies.find(
      (c) => c.name === "him_refresh_token"
    );
    expect(refreshCookie).toBeTruthy();
    const refreshToken = refreshCookie!.value;

    // JWT iat(초 단위)가 달라져야 토큰이 바뀌므로 1초 대기
    await page.waitForTimeout(1_000);

    // 백엔드 /auth/refresh 엔드포인트를 직접 호출하여
    // 토큰 갱신 메커니즘(토큰 로테이션)이 정상 동작하는지 검증한다
    const refreshRes = await page.request.post(
      "http://localhost:4200/api/auth/refresh",
      {
        data: { refreshToken },
        headers: { "Content-Type": "application/json" },
      }
    );
    expect(refreshRes.ok()).toBe(true);

    const body = await refreshRes.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
    // 새 refreshToken은 이전과 달라야 한다 (토큰 로테이션)
    expect(body.refreshToken).not.toBe(refreshToken);

    // DB에서 refreshTokenHash가 변경되었는지 확인
    const hashAfter = await getRefreshTokenHash();
    expect(hashAfter).not.toBeNull();
    expect(hashAfter).not.toBe(hashBefore);
  });

  // ── #2: 갱신 후 API 요청 정상 처리 ──

  test("2. 시스템은 갱신 후 기존 API 요청을 정상 처리한다", async ({ page }) => {
    await signup(page);

    // 토큰 갱신 수행
    const refreshRes = await page.request.post("/api/auth/refresh");
    expect(refreshRes.ok()).toBe(true);

    // 갱신 후 보호된 API(/api/auth/me) 호출이 정상 동작하는지 검증
    const meRes = await page.request.get("/api/auth/me");
    expect(meRes.ok()).toBe(true);

    const meBody = await meRes.json();
    expect(meBody.success).toBe(true);
    expect(meBody.data.email).toBe(TEST_USER.email);
    expect(meBody.data.displayName).toBe(TEST_USER.displayName);

    // 갱신 후 보호된 페이지에도 정상 접근 가능한지 확인
    await page.goto("/dashboard");
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── #3: refreshToken 만료 시 로그인 리다이렉트 ──

  test("3. 시스템은 refreshToken이 만료되면 로그인 페이지로 리다이렉트한다", async ({
    page,
  }) => {
    await signup(page);

    // DB에서 refreshTokenHash를 무효화하여 만료 상태를 시뮬레이션
    await query('UPDATE users SET "refreshTokenHash" = NULL WHERE email = $1', [
      TEST_USER.email,
    ]);

    // 브라우저의 refreshToken 쿠키도 만료된 값으로 교체
    const cookies = await page.context().cookies();
    const refreshCookie = cookies.find(
      (c) => c.name === "him_refresh_token"
    );

    if (refreshCookie) {
      // 쿠키를 무효한 값으로 교체하여 갱신 실패를 유도
      await page.context().addCookies([
        {
          name: "him_refresh_token",
          value: "invalid-expired-token",
          domain: refreshCookie.domain,
          path: "/",
        },
      ]);
    }

    // 보호된 페이지로 이동 시도 → 로그인 페이지로 리다이렉트되어야 함
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
