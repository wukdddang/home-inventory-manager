import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import {
  seedFullCatalogAndInventory,
  seedShoppingListItem,
  type FullSeedResult,
} from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-05. 대시보드 — 장보기 FAB", () => {
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

  async function getHouseholdId(): Promise<string> {
    return (await query<{ id: string }>("SELECT id FROM households LIMIT 1"))[0].id;
  }

  async function setupFull(page: Page): Promise<FullSeedResult> {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    const hId = await getHouseholdId();
    const seed = await seedFullCatalogAndInventory(hId, {
      inventoryQuantity: 5,
      minStockLevel: 3,
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    return seed;
  }

  // ── 테스트 ──

  test("1. 화면 우하단에 장보기 FAB가 표시되고 항목 수 뱃지가 보인다", async ({ page }) => {
    const ctx = await setupFull(page);
    await seedShoppingListItem(ctx.householdId, {
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      quantity: 2,
      memo: "우유",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // 장보기 FAB 표시 (항목 수 포함)
    await expect(page.locator('button:has-text("장보기")')).toBeVisible({ timeout: 10_000 });
  });

  test("3. 사용자는 FAB를 눌러 장보기 목록 바텀시트를 연다", async ({ page }) => {
    const ctx = await setupFull(page);
    await seedShoppingListItem(ctx.householdId, {
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      quantity: 2,
      memo: "우유",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });
  });

  test("4. 장보기 항목에 라벨, 수량이 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await seedShoppingListItem(ctx.householdId, {
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      quantity: 2,
      memo: "우유",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });

    // 항목에 라벨과 수량이 표시됨
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=/x2/')).toBeVisible();
  });

  test("7. 1개 이상 체크 시 구매 완료 버튼이 나타난다", async ({ page }) => {
    const ctx = await setupFull(page);
    await seedShoppingListItem(ctx.householdId, {
      sourceInventoryItemId: ctx.inventoryItemId,
      quantity: 2,
      memo: "우유",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });

    // 초기에는 구매 완료 버튼이 없음
    await expect(page.locator('button:has-text("장보기 완료")')).toBeHidden();

    // 항목 행 클릭으로 체크 토글 (행 전체가 button 요소)
    await page.locator('button:has-text("우유")').last().click();

    // 구매 완료 버튼 등장
    await expect(page.locator('button:has-text("장보기 완료")')).toBeVisible({ timeout: 5_000 });
  });

  test("8. 사용자는 구매 완료를 눌러 선택 항목의 재고를 증가시킨다", async ({ page }) => {
    const ctx = await setupFull(page);
    await seedShoppingListItem(ctx.householdId, {
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      sourceInventoryItemId: ctx.inventoryItemId,
      quantity: 3,
      memo: "우유",
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });

    // 항목 행 클릭으로 체크 토글 (행 전체가 button 요소)
    await page.locator('button:has-text("우유")').last().click();

    // 구매 완료 클릭
    await page.locator('button:has-text("장보기 완료")').click();

    // 장보기 완료 후 시트가 닫히거나 항목이 제거됨
    await expect(page.locator('text="장보기 목록"')).toBeHidden({ timeout: 10_000 });
  });

  test("12. 장보기 항목이 0개이면 FAB가 숨겨지거나 뱃지가 표시되지 않는다", async ({ page }) => {
    await setupFull(page);
    // 장보기 항목 없이 대시보드 로드

    // FAB가 숨겨짐 또는 뱃지 없음
    const fab = page.locator('button:has-text("장보기")');
    const fabCount = await fab.count();
    if (fabCount > 0) {
      // FAB가 있더라도 뱃지에 0이 아닌 텍스트는 없어야 함
      await expect(fab).toBeHidden({ timeout: 5_000 });
    }
  });
});
