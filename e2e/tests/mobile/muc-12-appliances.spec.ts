import { test, expect, type Page } from "@playwright/test";

/**
 * MUC-12. 모바일 가전/설비 관리 (mock 경로)
 *
 * 모바일 뷰포트에서 하단 네비게이션으로 가전 탭 진입,
 * 목록 조회, 등록, 상세, 수정, 폐기 등 핵심 흐름을 검증한다.
 */

test.describe("MUC-12. 모바일 가전/설비 관리 (mock)", () => {
  async function goToAppliances(page: Page) {
    await page.goto("/mock/dashboard");
    await page.waitForLoadState("networkidle");
    // 모바일 하단 네비게이션에서 "가전" 탭 클릭
    await page.locator('nav >> text="가전"').click();
    await page.waitForURL("**/mock/appliances", { timeout: 10_000 });
  }

  test("1. 모바일 하단 네비게이션에 가전 탭이 표시된다", async ({ page }) => {
    await page.goto("/mock/dashboard");
    await page.waitForLoadState("networkidle");

    const nav = page.locator("nav").last();
    await expect(nav.locator('text="가전"')).toBeVisible({ timeout: 5_000 });
  });

  test("2. 가전 탭을 눌러 가전·설비 페이지로 이동한다", async ({ page }) => {
    await page.goto("/mock/dashboard");
    await page.waitForLoadState("networkidle");

    await page.locator('nav >> text="가전"').click();
    await page.waitForURL("**/mock/appliances", { timeout: 10_000 });
    await expect(page.locator('text="가전·설비"')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("3. 모바일에서 가전 목록이 카드 형태로 표시된다", async ({ page }) => {
    await goToAppliances(page);

    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 5_000 });
    // 시드 데이터의 활성 가전이 표시됨
    await expect(page.locator('text="드럼세탁기"')).toBeVisible();
  });

  test("4. 모바일에서 가전 등록 폼을 열고 등록한다", async ({ page }) => {
    await goToAppliances(page);

    await page.locator('[data-testid="add-appliance-btn"]').click();
    await expect(
      page.locator('[data-testid="appliance-register-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    await page.locator('[data-testid="appliance-name-input"]').fill("식기세척기");
    await page.locator('[data-testid="appliance-brand-input"]').fill("LG");
    await page.locator('[data-testid="appliance-register-submit"]').click();

    await expect(page.locator('text="식기세척기"')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("5. 모바일에서 가전 카드를 탭하면 상세 화면으로 전환된다", async ({
    page,
  }) => {
    await goToAppliances(page);

    await page.locator('text="드럼세탁기"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="detail-name"]')).toHaveText(
      "드럼세탁기",
    );
  });

  test("6. 모바일 상세에서 뒤로 가기를 눌러 목록으로 복귀한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    await page.locator('[data-testid="back-to-list"]').click();
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("7. 모바일에서 상태 필터 전환이 동작한다", async ({ page }) => {
    await goToAppliances(page);

    // 전체 필터
    await page.locator('[data-testid="filter-all"]').click();
    await expect(page.locator('text="벽걸이 에어컨"')).toBeVisible({
      timeout: 5_000,
    });

    // 폐기 필터
    await page.locator('[data-testid="filter-disposed"]').click();
    await expect(page.locator('text="벽걸이 에어컨"')).toBeVisible();
    await expect(page.locator('text="드럼세탁기"')).toBeHidden();
  });

  test("8. 모바일에서 유지보수 이력을 조회한다", async ({ page }) => {
    await goToAppliances(page);

    await page.locator('text="양문형 냉장고"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 이력 목록 확인
    await expect(
      page.locator('[data-testid="log-list"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.locator('text="냉각 불량 수리"'),
    ).toBeVisible();
  });
});
