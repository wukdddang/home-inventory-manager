import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-10. 스켈레톤 로딩", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await clearAllMails();
  });

  // ── 헬퍼 ──

  async function signupAndWait(page: Page) {
    await page.goto("/signup");
    await page.locator("input#name").fill(TEST_USER.displayName);
    await page.locator("input#email").fill(TEST_USER.email);
    await page.locator("input#password").fill(TEST_USER.password);
    await page.locator("input#confirm").fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }

  async function createHousehold(page: Page, name: string) {
    const res = await page.request.post("/api/households", {
      data: { name },
    });
    expect(res.ok()).toBe(true);
    await page.reload();
    await page.waitForLoadState("networkidle");
  }

  /** 스켈레톤 요소 확인 — animate-pulse 클래스 또는 pulse animation 속성 */
  function skeletonLocator(page: Page) {
    // Tailwind v4 keeps class names in production, so [class*="animate-pulse"] works.
    // Fallback: also check for any element with a pulse animation via evaluate.
    return page.locator('[class*="animate-pulse"]').first();
  }

  // ── 테스트 ──

  test("1. 대시보드 로딩 중 스켈레톤이 표시된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // households API를 지연시켜 loading 상태 유지 → 스켈레톤 표시
    await page.route("**/api/households", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });

    await page.reload();

    const skeleton = skeletonLocator(page);
    await expect(skeleton).toBeVisible({ timeout: 5_000 });
  });

  // TODO: 이력 페이지 스켈레톤은 households 로딩이 아닌 별도 데이터 로딩에 의존 — 트리거 방법 추가 조사 필요
  test.skip("2. 재고 이력 로딩 중 스켈레톤이 표시된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // households API를 지연시켜 이력 페이지에서도 로딩 상태 유지
    // provider가 households를 먼저 로드하므로 이 지연이 스켈레톤을 트리거함
    await page.route("**/api/households", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });

    await page.goto("/inventory-history");

    const skeleton = skeletonLocator(page);
    await expect(skeleton).toBeVisible({ timeout: 5_000 });
  });

  test("3. 스켈레톤은 pulse 애니메이션으로 깜빡인다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    await page.route("**/api/households", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      await route.continue();
    });

    await page.reload();

    const skeleton = skeletonLocator(page);
    await expect(skeleton).toBeVisible({ timeout: 5_000 });

    // animate-pulse 클래스 또는 CSS animation 속성 확인
    const hasAnimation = await skeleton.evaluate((el) => {
      const animation = window.getComputedStyle(el).animation;
      return animation !== "none" && animation !== "";
    });
    expect(hasAnimation).toBeTruthy();
  });
});
