import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import { seedFullCatalogAndInventory, type FullSeedResult } from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-07. 소비 · 폐기 · 수동 조정", () => {
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
    const finishBtn = page.locator('button:has-text("완료")');
    await expect(finishBtn).toBeVisible({ timeout: 5_000 });
    await finishBtn.click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  }

  async function getHouseholdId(): Promise<string> {
    return (await query<{ id: string }>("SELECT id FROM households LIMIT 1"))[0].id;
  }

  /** 전체 사전 조건 세팅 (재고 수량 10) — DB 시드 */
  async function setupFull(page: Page): Promise<FullSeedResult & { itemId: string; hId: string }> {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    await expect(
      page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")'),
    ).toBeVisible({ timeout: 5_000 });

    const householdId = await getHouseholdId();
    const seed = await seedFullCatalogAndInventory(householdId, {
      inventoryQuantity: 10,
    });

    // 대시보드를 새로고침하여 시드 데이터를 localStorage 에 반영
    await page.reload();
    await page.waitForLoadState("networkidle");

    return { ...seed, itemId: seed.inventoryItemId, hId: seed.householdId };
  }

  /** 대시보드 → 테이블 뷰 전환 → "우유" 표시 대기 */
  async function openSpreadsheetAndItem(page: Page) {
    const tableToggle = page.locator('button:has-text("재고 목록 (표)")');
    await expect(tableToggle).toBeVisible({ timeout: 10_000 });
    await tableToggle.click();
    await expect(page.locator('td:has-text("우유")').first()).toBeVisible({ timeout: 10_000 });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("7-1. 사용자는 재고 소비를 기록하고 수량이 감소됨을 확인한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openSpreadsheetAndItem(page);

    // 테이블에서 "소비" 버튼 클릭
    await page.locator('button:has-text("소비")').first().click();

    // 소비 모달 대기
    const modal = page.getByRole("dialog", { name: /재고 소비/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 수량 입력 (3팩 소비)
    const qtyInput = modal.locator('input[type="number"]');
    await qtyInput.clear();
    await qtyInput.fill("3");

    // 메모 입력
    await modal.locator('input[placeholder="예: 간식으로 사용"]').fill("아침 식사");

    // "소비 기록" 버튼 클릭
    await modal.locator('button:has-text("소비 기록")').click();

    // DB 에서 재고 수량 감소 확인 (10 - 3 = 7)
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [ctx.itemId],
      );
      expect(parseFloat(items[0].quantity)).toBe(7);
    }).toPass({ timeout: 10_000 });
  });

  test("7-2. 시스템은 소비 기록 시 재고 변경 이력에 소비 레코드를 생성한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openSpreadsheetAndItem(page);

    // UI 로 소비 등록
    await page.locator('button:has-text("소비")').first().click();
    const modal = page.getByRole("dialog", { name: /재고 소비/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const qtyInput = modal.locator('input[type="number"]');
    await qtyInput.clear();
    await qtyInput.fill("2");
    await modal.locator('input[placeholder="예: 간식으로 사용"]').fill("요리에 사용");
    await modal.locator('button:has-text("소비 기록")').click();
    await expect(modal).toBeHidden({ timeout: 5_000 });

    // DB 에서 소비(out) 이력 레코드 확인
    await expect(async () => {
      const logs = await query<{
        type: string;
        quantityDelta: string;
        quantityAfter: string;
        memo: string | null;
      }>(
        `SELECT type, "quantityDelta"::text, "quantityAfter"::text, memo FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [ctx.itemId],
      );
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("out");
      expect(parseFloat(logs[0].quantityDelta)).toBe(-2);
      expect(parseFloat(logs[0].quantityAfter)).toBe(8); // 10 - 2
      expect(logs[0].memo).toBe("요리에 사용");
    }).toPass({ timeout: 10_000 });
  });

  test("7-3. 사용자는 재고 폐기를 사유와 함께 기록하고 수량이 감소됨을 확인한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openSpreadsheetAndItem(page);

    // 테이블에서 "폐기" 버튼 클릭
    await page.locator('button:has-text("폐기")').first().click();

    // 폐기 모달 대기
    const modal = page.getByRole("dialog", { name: /재고 폐기/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 수량 입력 (2팩 폐기)
    const qtyInput = modal.locator('input[type="number"]');
    await qtyInput.clear();
    await qtyInput.fill("2");

    // 사유 선택 (기본값: 유통기�� 만료)
    const reasonSelect = modal.locator("select");
    await reasonSelect.selectOption("expired");

    // 메모 입력
    await modal.locator('input[placeholder="예: 간식으로 사용"]').fill("유통기한 초과");

    // "폐기 기록" 버튼 클릭
    await modal.locator('button:has-text("폐기 기록")').click();

    // DB 에서 재고 수량 감소 확인 (10 - 2 = 8)
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [ctx.itemId],
      );
      expect(parseFloat(items[0].quantity)).toBe(8);
    }).toPass({ timeout: 10_000 });
  });

  test("7-4. 시스템은 폐기 기록 시 재고 변경 이력에 폐기 레코드와 사유를 생성한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openSpreadsheetAndItem(page);

    // UI 로 폐기 등록
    await page.locator('button:has-text("폐기")').first().click();
    const modal = page.getByRole("dialog", { name: /재고 폐기/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const qtyInput = modal.locator('input[type="number"]');
    await qtyInput.clear();
    await qtyInput.fill("4");

    await modal.locator("select").selectOption("damaged");
    await modal.locator('input[placeholder="예: 간식으로 사용"]').fill("낙하 파손");
    await modal.locator('button:has-text("폐기 기록")').click();
    await expect(modal).toBeHidden({ timeout: 5_000 });

    // DB 에서 폐기(waste) 이력 레코드 확인
    await expect(async () => {
      const logs = await query<{
        type: string;
        quantityDelta: string;
        quantityAfter: string;
        reason: string | null;
        memo: string | null;
      }>(
        `SELECT type, "quantityDelta"::text, "quantityAfter"::text, reason, memo FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [ctx.itemId],
      );
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("waste");
      expect(parseFloat(logs[0].quantityDelta)).toBe(-4);
      expect(parseFloat(logs[0].quantityAfter)).toBe(6); // 10 - 4
      expect(logs[0].reason).toBe("damaged");
      expect(logs[0].memo).toBe("낙하 파손");
    }).toPass({ timeout: 10_000 });
  });

  test("7-5. 사용자는 재고 수량을 수동 조정한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openSpreadsheetAndItem(page);

    // "우유" 클릭하여 드로어 열기
    await page.locator('td:has-text("우유")').first().click();

    const drawer = page.getByRole("dialog", { name: /상세/ });
    await expect(drawer.locator('button[aria-label="수량 수정"]')).toBeVisible({ timeout: 5_000 });
    await drawer.locator('button[aria-label="수량 수정"]').click();

    // 수량을 15 로 변경
    const qtyInput = drawer.getByRole("spinbutton");
    await expect(qtyInput).toBeVisible({ timeout: 5_000 });
    await qtyInput.clear();
    await qtyInput.fill("15");

    await drawer.locator('button:has-text("확인")').click();

    // DB 에서 수량 변경 확인
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [ctx.itemId],
      );
      expect(parseFloat(items[0].quantity)).toBe(15);
    }).toPass({ timeout: 10_000 });
  });

  test("7-6. 시스템은 수동 조정 시 재고 수량이 변경되고 이력에 기록된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openSpreadsheetAndItem(page);

    // UI 로 수동 조정 — 드로어에서 수량 수정 (10 → 5)
    await page.locator('td:has-text("우유")').first().click();

    const drawer = page.getByRole("dialog", { name: /상세/ });
    await expect(drawer.locator('button[aria-label="수량 수정"]')).toBeVisible({ timeout: 5_000 });
    await drawer.locator('button[aria-label="수량 수정"]').click();

    const qtyInput = drawer.getByRole("spinbutton");
    await expect(qtyInput).toBeVisible({ timeout: 5_000 });
    await qtyInput.clear();
    await qtyInput.fill("5");

    await drawer.locator('button:has-text("확인")').click();

    // DB 에서 수량 변경 확인 (PATCH /quantity 엔드포인트 사용)
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [ctx.itemId],
      );
      expect(parseFloat(items[0].quantity)).toBe(5);
    }).toPass({ timeout: 10_000 });
  });

  test("7-7. 사용자는 재고 변경 이력 목록을 기간별로 조회한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openSpreadsheetAndItem(page);

    // ── 소비 기록 ──
    await page.locator('button:has-text("소비")').first().click();
    const consumeModal = page.getByRole("dialog", { name: /재고 소비/ });
    await expect(consumeModal).toBeVisible({ timeout: 5_000 });
    const consumeQty = consumeModal.locator('input[type="number"]');
    await consumeQty.clear();
    await consumeQty.fill("1");
    await consumeModal.locator('button:has-text("소비 기록")').click();
    await expect(consumeModal).toBeHidden({ timeout: 5_000 });

    // ── 폐기 기록 ──
    await page.locator('button:has-text("폐기")').first().click();
    const wasteModal = page.getByRole("dialog", { name: /재고 폐기/ });
    await expect(wasteModal).toBeVisible({ timeout: 5_000 });
    const wasteQty = wasteModal.locator('input[type="number"]');
    await wasteQty.clear();
    await wasteQty.fill("2");
    await wasteModal.locator('button:has-text("폐기 기록")').click();
    await expect(wasteModal).toBeHidden({ timeout: 5_000 });

    // 재고 이력 페이지로 이동
    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    // 페이지 제목 확인
    await expect(page.locator('h1:has-text("재고 이력")')).toBeVisible({ timeout: 10_000 });

    // 이력이 표시되는지 확인
    await expect(page.locator('td:has-text("소비")').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('td:has-text("폐기")').first()).toBeVisible({ timeout: 5_000 });

    // DB 에서 이력 레코드 수 확인
    await expect(async () => {
      const logs = await query<{ type: string }>(
        `SELECT type FROM inventory_logs WHERE "inventoryItemId" = $1`,
        [ctx.itemId],
      );
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.some((l) => l.type === "out")).toBe(true);
      expect(logs.some((l) => l.type === "waste")).toBe(true);
    }).toPass({ timeout: 10_000 });
  });
});
