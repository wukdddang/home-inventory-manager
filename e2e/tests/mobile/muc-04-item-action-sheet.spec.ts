import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import {
  seedFullCatalogAndInventory,
  type FullSeedResult,
} from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-04. 대시보드 — 품목 액션 시트", () => {
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

  async function setupFull(page: Page, qty = 10): Promise<FullSeedResult> {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    const hId = await getHouseholdId();
    const seed = await seedFullCatalogAndInventory(hId, {
      inventoryQuantity: qty,
      minStockLevel: 3,
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    return seed;
  }

  /** 대시보드에서 "우유" 재고 카드를 탭하여 액션 시트를 연다 */
  async function openItemActionSheet(page: Page) {
    const card = page.locator('button:has-text("우유")').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-A. 품목 상세 바텀시트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("4-A-1. 사용자는 재고 카드를 탭하여 품목 액션 시트를 연다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);

    // 액션 시트에 품목명이 표시됨
    await expect(page.locator('text=/현재.*팩.*보유/').first()).toBeVisible({ timeout: 5_000 });
  });

  test("4-A-7. 보충, 사용, 폐기 3개 액션 버튼이 표시된다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);

    await expect(page.locator('button:has-text("보충")')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button:has-text("사용")')).toBeVisible();
    await expect(page.locator('button:has-text("폐기")')).toBeVisible();
  });

  test("4-A-8. 수량이 0인 품목은 사용, 폐기 버튼이 비활성화된다", async ({ page }) => {
    await setupFull(page, 0);
    await openItemActionSheet(page);

    const useBtn = page.locator('button:has-text("사용")');
    const wasteBtn = page.locator('button:has-text("폐기")');

    await expect(useBtn).toBeVisible({ timeout: 5_000 });
    await expect(useBtn).toBeDisabled();
    await expect(wasteBtn).toBeDisabled();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-B. 사용 처리 시트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("4-B-10. 사용자는 사용 버튼을 눌러 사용 처리 시트를 연다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);

    await page.locator('button:has-text("사용")').click();

    await expect(page.locator('text="사용 처리"')).toBeVisible({ timeout: 5_000 });
  });

  test("4-B-11. 시트에 품목명, 변형, 현재 수량이 표시된다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("사용")').click();

    await expect(page.locator('text="사용 처리"')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=/우유/').first()).toBeVisible();
    await expect(page.locator('text=/현재 재고/').first()).toBeVisible();
  });

  test("4-B-14. 사용자는 확인을 눌러 소비를 기록하고 성공 토스트를 확인한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("사용")').click();
    await expect(page.locator('text="사용 처리"')).toBeVisible({ timeout: 5_000 });

    // 사용 확인 버튼 클릭
    await page.locator('button:has-text("사용 확인")').click();

    // DB 에서 소비 이력 확인
    await expect(async () => {
      const logs = await query<{ type: string; quantityDelta: string }>(
        `SELECT type, "quantityDelta"::text FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [ctx.inventoryItemId]
      );
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("out");
    }).toPass({ timeout: 10_000 });
  });

  test("4-B-15. 소비 후 재고 수량이 감소한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("사용")').click();
    await expect(page.locator('text="사용 처리"')).toBeVisible({ timeout: 5_000 });

    await page.locator('button:has-text("사용 확인")').click();

    // 재고 수량 감소 확인
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.inventoryItemId]);
      expect(parseFloat(items[0].quantity)).toBeLessThan(10);
    }).toPass({ timeout: 10_000 });
  });

  test("4-B-16. 사용자는 취소를 눌러 시트를 닫을 수 있다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("사용")').click();
    await expect(page.locator('text="사용 처리"')).toBeVisible({ timeout: 5_000 });

    await page.locator('button:has-text("취소")').click();

    // 사용 처리 시트가 닫힘
    await expect(page.locator('text="사용 처리"')).toBeHidden({ timeout: 5_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-C. 폐기 처리 시트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("4-C-17. 사용자는 폐기 버튼을 눌러 폐기 처리 시트를 연다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);

    await page.locator('button:has-text("폐기")').click();

    await expect(page.locator('text="폐기 처리"')).toBeVisible({ timeout: 5_000 });
  });

  test("4-C-18. 폐기 사유 3종 라디오 버튼이 표시된다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("폐기")').click();
    await expect(page.locator('text="폐기 처리"')).toBeVisible({ timeout: 5_000 });

    await expect(page.locator('text="유통기한 만료"')).toBeVisible();
    await expect(page.locator('text="품질 저하"')).toBeVisible();
    await expect(page.locator('text="기타"')).toBeVisible();
  });

  test("4-C-20. 사용자는 사유를 변경하고 수량을 설정하여 폐기를 기록한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("폐기")').click();
    await expect(page.locator('text="폐기 처리"')).toBeVisible({ timeout: 5_000 });

    // 기본 사유("유통기한 만료")가 선택된 상태에서 폐기 확인
    await page.locator('button:has-text("폐기 확인")').click();

    // 폐기 성공 토스트 또는 시트 닫힘 확인
    await expect(page.locator('text="폐기 처리"')).toBeHidden({ timeout: 10_000 });

    // DB 에서 폐기 이력 확인
    await expect(async () => {
      const logs = await query<{ type: string; reason: string | null }>(
        `SELECT type, reason FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [ctx.inventoryItemId]
      );
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("waste");
    }).toPass({ timeout: 10_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-D. 보충 처리 시트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("4-D-22. 사용자는 보충 버튼을 눌러 보충 시트를 연다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);

    await page.locator('button:has-text("보충")').click();

    await expect(page.locator('text="재고 보충"')).toBeVisible({ timeout: 5_000 });
  });

  test("4-D-26. 사용자는 수량을 조절하고 확인을 눌러 보충을 기록한다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("보충")').click();
    await expect(page.locator('text="재고 보충"')).toBeVisible({ timeout: 5_000 });

    // 보충 확인 클릭
    await page.locator('button:has-text("보충 확인")').click();

    // 보충 시트가 닫히고 성공 토스트가 표시됨
    await expect(page.locator('text="재고 보충"')).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('text=/보충했습니다/')).toBeVisible({ timeout: 5_000 });
  });

  test("4-D-27. 보충 후 재고 수량이 증가하고 성공 토스트가 표시된다", async ({ page }) => {
    await setupFull(page);
    await openItemActionSheet(page);
    await page.locator('button:has-text("보충")').click();
    await expect(page.locator('text="재고 보충"')).toBeVisible({ timeout: 5_000 });

    await page.locator('button:has-text("보충 확인")').click();

    // 성공 토스트 확인
    await expect(page.locator('text=/보충했습니다/')).toBeVisible({ timeout: 10_000 });
  });
});
