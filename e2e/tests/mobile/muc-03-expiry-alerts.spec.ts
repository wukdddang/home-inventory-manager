import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import {
  seedFullCatalogAndInventory,
  seedProduct,
  seedProductVariant,
  seedInventoryItem,
  seedPurchase,
  seedPurchaseBatch,
  type FullSeedResult,
} from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-03. 대시보드 — 유통기한 알림", () => {
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
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    return seed;
  }

  /** 유통기한 임박 배치를 DB 시드로 등록한다 */
  async function createExpiringBatch(hId: string, inventoryItemId: string, daysFromNow: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const expiryDate = date.toISOString().slice(0, 10);
    const purchasedAt = new Date().toISOString().slice(0, 10);

    const purchaseId = await seedPurchase(hId, {
      inventoryItemId,
      unitPrice: 2500,
      purchasedAt,
      itemName: "우유",
      unitSymbol: "팩",
    });
    await seedPurchaseBatch(purchaseId, 1, expiryDate);
  }

  // ── 테스트 ──

  test("1. 유통기한 알림 섹션이 대시보드 상단에 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    // 3일 후 만료 배치
    await createExpiringBatch(ctx.householdId, ctx.inventoryItemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text=/유통기한 임박/')).toBeVisible({ timeout: 10_000 });
  });

  test("2. 알림 헤더에 해당 품목 수 뱃지가 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createExpiringBatch(ctx.householdId, ctx.inventoryItemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // "유통기한 임박 (1)" 형태로 품목 수 표시
    await expect(page.locator('text=/유통기한 임박.*\\(\\d+\\)/')).toBeVisible({ timeout: 10_000 });
  });

  test("3. 사용자는 알림 섹션 헤더를 눌러 접기/펼치기를 전환한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createExpiringBatch(ctx.householdId, ctx.inventoryItemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    const header = page.locator('button:has-text("유통기한 임박")');
    await expect(header).toBeVisible({ timeout: 10_000 });

    // 알림 섹션 내 "사용" 액션 버튼이 보이는지 확인
    const useBtn = page.locator('button:has-text("사용")').first();
    await expect(useBtn).toBeVisible({ timeout: 5_000 });

    // 접기
    await header.click();
    // 접힌 후 알림 섹션 내 "사용" 버튼이 숨겨지는지 확인
    await expect(useBtn).toBeHidden({ timeout: 5_000 });
  });

  test("5. 임박 품목은 노란색 점 + D-X 형식으로 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createExpiringBatch(ctx.householdId, ctx.inventoryItemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text=/D-3/').first()).toBeVisible({ timeout: 10_000 });
  });

  test("7. 품목이 만료 심각도순으로 정렬된다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 두 번째 품목 생성 (더 긴 유통기한)
    const prodId2 = await seedProduct(ctx.householdId, ctx.categoryId, "치즈");
    const varId2 = await seedProductVariant(prodId2, ctx.unitId, 1, "200g");
    const itemId2 = await seedInventoryItem(varId2, ctx.storageLocationId, 3);

    // 우유: 2일 후 만료 (더 급한 것)
    await createExpiringBatch(ctx.householdId, ctx.inventoryItemId, 2);
    // 치즈: 5일 후 만료
    await createExpiringBatch(ctx.householdId, itemId2, 5);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // 유통기한 임박 섹션이 표시됨
    await expect(page.locator('text=/유통기한 임박/')).toBeVisible({ timeout: 10_000 });

    // D-2 가 D-5 보다 먼저 표시됨 (심각도순)
    const alerts = page.locator('text=/D-\\d+/');
    const firstAlert = await alerts.first().textContent();
    expect(firstAlert).toContain("D-2");
  });

  test("8. 사용자는 임박 품목의 사용 버튼을 눌러 사용 처리 시트를 연다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createExpiringBatch(ctx.householdId, ctx.inventoryItemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text=/유통기한 임박/')).toBeVisible({ timeout: 10_000 });

    // 임박 품목의 "사용" 버튼 클릭 → ItemActionSheet가 열림
    const useBtn = page.locator('button:has-text("사용")').first();
    await expect(useBtn).toBeVisible({ timeout: 5_000 });
    await useBtn.click();

    // ItemActionSheet 내 "사용" 액션 버튼 확인
    await expect(page.locator('text="소비한 수량을 차감합니다"')).toBeVisible({ timeout: 5_000 });

    // "사용" 액션 버튼 클릭 → 사용 처리 바텀시트
    await page.locator('button:has-text("사용")').nth(1).click();
    await expect(page.locator('text="사용 처리"')).toBeVisible({ timeout: 5_000 });
  });
});
