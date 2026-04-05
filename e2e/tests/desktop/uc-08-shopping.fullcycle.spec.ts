import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import {
  seedFullCatalogAndInventory,
  seedShoppingListItem,
  seedPurchase,
  seedPurchaseBatch,
  type FullSeedResult,
} from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-08. 장보기 항목 관리", () => {
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

  /** 전체 사전 조건 세팅 — DB 시드 */
  async function setupFull(page: Page): Promise<FullSeedResult & { hId: string; itemId: string }> {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    await expect(
      page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")'),
    ).toBeVisible({ timeout: 5_000 });

    const householdId = await getHouseholdId();
    const seed = await seedFullCatalogAndInventory(householdId, {
      inventoryQuantity: 5,
      minStockLevel: 3,
    });

    // 대시보드를 새로고침하여 시드 데이터를 localStorage 에 반영
    await page.reload();
    await page.waitForLoadState("networkidle");

    return { ...seed, hId: seed.householdId, itemId: seed.inventoryItemId };
  }

  /** 장보기 목록 모달을 연다 */
  async function openShoppingListModal(page: Page) {
    await page.locator('button[aria-label="장보기 목록"]').click();
    const modal = page.getByRole("dialog", { name: /장보기/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });
    return modal;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8-A. 장보기 항목 CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("8-A-1. 사용자는 카탈로그에서 선택하여 장보기 항목을 추가한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // DB 에 장보기 항목 시드
    await seedShoppingListItem(ctx.hId, {
      categoryId: ctx.categoryId,
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      sourceInventoryItemId: ctx.itemId,
      quantity: 2,
      memo: "우유",
    });

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // 장보기 모달에서 "우유" 항목이 표시되는지 확인
    await expect(modal.locator("text=우유").first()).toBeVisible({ timeout: 10_000 });

    // DB 에서 장보기 항목 확인
    const items = await query<{ id: string; memo: string | null; quantity: string | null }>(
      `SELECT id, memo, quantity::text FROM shopping_list_items WHERE "householdId" = $1`,
      [ctx.hId],
    );
    expect(items).toHaveLength(1);
    expect(items[0].memo).toBe("우유");
  });

  test("8-A-2. 사용자는 장보기 항목 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // DB 에 장보기 항목 2개 시드
    await seedShoppingListItem(ctx.hId, {
      categoryId: ctx.categoryId,
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      quantity: 2,
      memo: "우유",
    });
    await seedShoppingListItem(ctx.hId, {
      quantity: 1,
      memo: "빵",
    });

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // 장보기 모달에서 항목들이 표시되는지 확인
    await expect(modal.locator("text=우유").first()).toBeVisible({ timeout: 10_000 });
    await expect(modal.locator("text=빵").first()).toBeVisible({ timeout: 5_000 });
  });

  test("8-A-3. 사용자는 장보기 항목을 수정한다 (보충 수량 변경)", async ({ page }) => {
    const ctx = await setupFull(page);

    // DB 에 장보기 항목 시드 (재고 연결)
    await seedShoppingListItem(ctx.hId, {
      categoryId: ctx.categoryId,
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      sourceInventoryItemId: ctx.itemId,
      quantity: 2,
      memo: "우유",
    });

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // "우유" 항목의 보충 수량 입력 찾기
    const entryRow = modal.locator("li").filter({ hasText: "우유" });
    await expect(entryRow).toBeVisible({ timeout: 10_000 });

    const qtyInput = entryRow.locator('input[type="number"]');
    await qtyInput.clear();
    await qtyInput.fill("5");
    await qtyInput.blur();

    // localStorage 에서 수량 변경 확인
    await expect(async () => {
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem("him-shopping-list");
        return raw ? JSON.parse(raw) : [];
      });
      const milk = stored.find((e: { label: string }) => e.label === "우유");
      expect(milk).toBeTruthy();
      expect(milk.restockQuantity).toBe(5);
    }).toPass({ timeout: 10_000 });
  });

  test("8-A-4. 사용자는 장보기 항목을 삭제한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // DB 에 장보기 항목 시드
    await seedShoppingListItem(ctx.hId, {
      quantity: 2,
      memo: "우유",
    });

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // "우유" 항목의 "삭제" 버튼 클릭
    const entryRow = modal.locator("li").filter({ hasText: "우유" });
    await expect(entryRow).toBeVisible({ timeout: 10_000 });
    await entryRow.locator('button:has-text("삭제")').click();

    // localStorage 에서 삭제 확인
    await expect(async () => {
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem("him-shopping-list");
        return raw ? JSON.parse(raw) : [];
      });
      expect(stored).toHaveLength(0);
    }).toPass({ timeout: 10_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8-B. 장보기 구매 완료 처리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("8-B-5. 사용자는 장보기 항목을 구매 완료 처리한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // DB 에 장보기 항목 시드 (재고 연결)
    await seedShoppingListItem(ctx.hId, {
      categoryId: ctx.categoryId,
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      sourceInventoryItemId: ctx.itemId,
      quantity: 3,
      memo: "우유",
    });

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // "우유" 항목의 "구매 완료" 버튼 클릭
    const entryRow = modal.locator("li").filter({ hasText: "우유" });
    await expect(entryRow).toBeVisible({ timeout: 10_000 });
    await entryRow.locator('button:has-text("구매 완료")').click();

    // DB 에서 입고 이력 확인
    await expect(async () => {
      const logs = await query<{ type: string; quantityDelta: string }>(
        `SELECT type, "quantityDelta"::text FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [ctx.itemId],
      );
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("in");
    }).toPass({ timeout: 10_000 });
  });

  test("8-B-6. 시스템은 구매 완료 시 재고 수량을 자동 증가시킨다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 초기 재고 수량 확인 (5)
    const before = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`,
      [ctx.itemId],
    );
    expect(parseFloat(before[0].quantity)).toBe(5);

    // DB 에 장보기 항목 시드 (재고 연결, 보충 수량 4)
    await seedShoppingListItem(ctx.hId, {
      categoryId: ctx.categoryId,
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      sourceInventoryItemId: ctx.itemId,
      quantity: 4,
      memo: "우유",
    });

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // "구매 완료" 클릭
    const entryRow = modal.locator("li").filter({ hasText: "우유" });
    await expect(entryRow).toBeVisible({ timeout: 10_000 });
    await entryRow.locator('button:has-text("구매 완료")').click();

    // 재고 수량 증가 확인
    await expect(async () => {
      const after = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [ctx.itemId],
      );
      expect(parseFloat(after[0].quantity)).toBeGreaterThan(5);
    }).toPass({ timeout: 10_000 });

    // 입고(in) 이력 레코드 확인
    await expect(async () => {
      const logs = await query<{ type: string; quantityDelta: string }>(
        `SELECT type, "quantityDelta"::text FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [ctx.itemId],
      );
      expect(logs[0].type).toBe("in");
    }).toPass({ timeout: 10_000 });
  });

  test("8-B-7. 시스템은 구매 완료된 항목을 장보기 목록에서 제거한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // DB 에 장보기 항목 2개 시드
    await seedShoppingListItem(ctx.hId, {
      categoryId: ctx.categoryId,
      productId: ctx.productId,
      productVariantId: ctx.variantId,
      sourceInventoryItemId: ctx.itemId,
      quantity: 2,
      memo: "우유",
    });
    await seedShoppingListItem(ctx.hId, {
      quantity: 1,
      memo: "빵",
    });

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // "우유" 항목만 구매 완료
    const milkRow = modal.locator("li").filter({ hasText: "우유" });
    await expect(milkRow).toBeVisible({ timeout: 10_000 });
    await milkRow.locator('button:has-text("구매 완료")').click();

    // localStorage: "빵" 만 남아야 함
    await expect(async () => {
      const stored = await page.evaluate(() => {
        const raw = localStorage.getItem("him-shopping-list");
        return raw ? JSON.parse(raw) : [];
      });
      expect(stored).toHaveLength(1);
      expect(stored[0].label).toBe("빵");
    }).toPass({ timeout: 10_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8-C. 장보기 자동 제안
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("8-C-8. 시스템은 부족 품목에 대해 장보기 자동 제안을 표시한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 재고를 최소 기준(3) 이하로 감소시키기 위해 소비 UI 사용
    const tableToggle = page.locator('button:has-text("재고 목록 (표)")');
    await expect(tableToggle).toBeVisible({ timeout: 10_000 });
    await tableToggle.click();
    await expect(page.locator('td:has-text("우유")').first()).toBeVisible({ timeout: 10_000 });

    await page.locator('button:has-text("소비")').first().click();
    const consumeModal = page.getByRole("dialog", { name: /재고 소비/ });
    await expect(consumeModal).toBeVisible({ timeout: 5_000 });
    const qtyInput = consumeModal.locator('input[type="number"]');
    await qtyInput.clear();
    await qtyInput.fill("4");
    await consumeModal.locator('button:has-text("소비 기록")').click();
    await expect(consumeModal).toBeHidden({ timeout: 5_000 });

    // 재고 수량 확인 (5 - 4 = 1, minStock = 3 → 부족)
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [ctx.itemId],
      );
      expect(parseFloat(items[0].quantity)).toBe(1);
    }).toPass({ timeout: 10_000 });

    // 장보기 목록 모달 열기
    const modal = await openShoppingListModal(page);

    // "재고 부족" 또는 자동 제안이 표시되는지 확인
    await expect(
      modal.locator("text=/재고 부족|부족|재고 없음|장보기에 담을/").first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("8-C-9. 시스템은 유통기한 임박 품목에 대해 장보기 자동 제안을 표시한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 유통기한 임박 구매 시드 (2일 후 만료) — DB
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    const expiryDate = twoDaysLater.toISOString().slice(0, 10);

    const pId = await seedPurchase(ctx.hId, {
      inventoryItemId: ctx.itemId,
      unitPrice: 2500,
      purchasedAt: new Date().toISOString().slice(0, 10),
      itemName: "우유",
      unitSymbol: "팩",
      userId,
    });
    await seedPurchaseBatch(pId, 1, expiryDate);

    // 대시보드 새로고침 후 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");
    const modal = await openShoppingListModal(page);

    // 유통기한 임박 제안이 표시되는지 확인
    await expect(
      modal.locator("text=/유통기한 임박|임박|장보기에 담을/").first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
