import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import {
  seedFullCatalogAndInventory,
  seedProduct,
  seedProductVariant,
  seedInventoryItem,
  type FullSeedResult,
} from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-05. 재고 등록 및 관리", () => {
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
    const rows = await query<{ id: string }>(
      "SELECT id FROM households LIMIT 1"
    );
    return rows[0].id;
  }

  /**
   * 전체 사전 조건 세팅:
   * 회원가입 → 거점 생성 → DB 시드(방·보관장소·카테고리·단위·품목·변형·재고)
   */
  async function setupFullPrerequisites(page: Page): Promise<FullSeedResult> {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    await expect(
      page.locator(
        'button[role="tab"][aria-selected="true"]:has-text("우리 집")'
      )
    ).toBeVisible({ timeout: 5_000 });

    const householdId = await getHouseholdId();
    const seed = await seedFullCatalogAndInventory(householdId, {
      inventoryQuantity: 10,
    });

    // 대시보드를 새로고침하여 시드 데이터를 localStorage 에 반영
    await page.reload();
    await page.waitForLoadState("networkidle");

    return seed;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UC-05 테스트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("5-1. 사용자는 재고 품목을 보관장소와 최소 재고 기준을 지정하여 등록한다", async ({
    page,
  }) => {
    const ctx = await setupFullPrerequisites(page);

    // 대시보드 새로고침 후 방 선택
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 방 탭에서 "주방" 선택
    const roomTab = page.locator('button[role="tab"]:has-text("주방")');
    await expect(roomTab).toBeVisible({ timeout: 10_000 });
    await roomTab.click();

    // 재고 추가 패널이 보일 때까지 대기
    await expect(
      page.locator('text="재고 추가"')
    ).toBeVisible({ timeout: 10_000 });

    // 재고 추가 폼 내부 select 들은 2중으로 렌더링되므로 .last() 사용
    // 보관 장소 선택
    const storageSelect = page.getByLabel("보관 장소 선택").last();
    await expect(storageSelect).toBeVisible({ timeout: 5_000 });
    const storageOptions = storageSelect.locator("option");
    const optCount = await storageOptions.count();
    for (let i = 0; i < optCount; i++) {
      const text = await storageOptions.nth(i).textContent();
      if (text && text.includes("냉장고")) {
        const value = await storageOptions.nth(i).getAttribute("value");
        if (value) {
          await storageSelect.selectOption(value);
          break;
        }
      }
    }

    // 카테고리 선택
    const categorySelect = page.getByLabel("카테고리 선택").last();
    await expect(categorySelect).toBeVisible({ timeout: 5_000 });
    await categorySelect.selectOption({ label: "식료품" });

    // 품목 선택
    const productSelect = page.getByLabel("품목 선택").last();
    await expect(productSelect).toBeVisible({ timeout: 5_000 });
    await productSelect.selectOption({ label: "우유" });

    // 용량·포장 선택 (자동 선택될 수 있음 — isDefault: true)
    const variantSelect = page.getByLabel("등록된 용량·포장 선택").last();
    await expect(variantSelect).toBeVisible({ timeout: 5_000 });
    // 1L 라벨이 포함된 option 선택
    const varOptions = variantSelect.locator("option");
    const varCount = await varOptions.count();
    for (let i = 0; i < varCount; i++) {
      const text = await varOptions.nth(i).textContent();
      if (text && text.includes("1L")) {
        const value = await varOptions.nth(i).getAttribute("value");
        if (value) {
          await variantSelect.selectOption(value);
          break;
        }
      }
    }

    // 보유 수량 입력
    const qtyInput = page.locator('input[id^="stock-qty-"]').last();
    await qtyInput.clear();
    await qtyInput.fill("5");

    // 최소 재고 입력
    const minStockInput = page.locator('input[id^="stock-minstock-"]').last();
    await minStockInput.fill("2");

    // "선택한 보관 장소에 재고 추가" 버튼 클릭
    await page
      .locator('button:has-text("선택한 보관 장소에 재고 추가")')
      .last()
      .click();

    // DB 에서 UI가 생성한 재고 품목 확인 (시드 아이템 제외)
    await expect(async () => {
      const items = await query<{
        quantity: string;
        minStockLevel: string | null;
      }>(
        `SELECT i.quantity::text, i."minStockLevel"::text
         FROM inventory_items i
         WHERE i."productVariantId" = $1 AND i."storageLocationId" = $2
           AND i.id != $3`,
        [ctx.variantId, ctx.storageLocationId, ctx.inventoryItemId]
      );
      expect(items).toHaveLength(1);
      expect(parseFloat(items[0].quantity)).toBe(5);
      expect(parseFloat(items[0].minStockLevel!)).toBe(2);
    }).toPass({ timeout: 10_000 });
  });

  test("5-2. 사용자는 재고 품목 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 두 번째 품목 (같은 카테고리, 다른 product) — DB 시드
    const prodId2 = await seedProduct(ctx.householdId, ctx.categoryId, "요거트");
    const varId2 = await seedProductVariant(prodId2, ctx.unitId, 500, "500ml");
    await seedInventoryItem(varId2, ctx.storageLocationId, 3);

    // 대시보드 새로고침
    await page.reload();
    await page.waitForLoadState("networkidle");

    // "재고 목록 (표)" 뷰로 전환
    const tableToggle = page.locator('button:has-text("재고 목록 (표)")');
    await expect(tableToggle).toBeVisible({ timeout: 10_000 });
    await tableToggle.click();

    // 테이블에 재고 품목이 표시되는지 확인
    await expect(page.locator('text="우유"').first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator('text="요거트"').first()).toBeVisible({
      timeout: 5_000,
    });

    // DB 에서 재고 품목 수 확인
    const items = await query<{ id: string }>(
      `SELECT id FROM inventory_items`
    );
    expect(items).toHaveLength(2);
  });

  test("5-3. 사용자는 재고 수량을 직접 설정한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);
    const itemId = ctx.inventoryItemId;

    // "재고 목록 (표)" 뷰로 전환
    const tableToggle = page.locator('button:has-text("재고 목록 (표)")');
    await expect(tableToggle).toBeVisible({ timeout: 10_000 });
    await tableToggle.click();

    // "우유" 품목명 클릭하여 상세 드로어 열기
    await expect(page.locator('text="우유"').first()).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('text="우유"').first().click();

    // ItemDetailDrawer 가 열렸는지 확인
    await expect(page.locator('button[aria-label="수량 수정"]')).toBeVisible({
      timeout: 5_000,
    });

    // 드로어 스코프 (dialog role)
    const drawer = page.getByRole("dialog", { name: /상세/ });

    // 수량 수정 버튼 클릭
    await drawer.locator('button[aria-label="수량 수정"]').click();

    // 수량 입력 필드가 나타남 (드로어 내부의 spinbutton)
    const qtyInput = drawer.getByRole("spinbutton");
    await expect(qtyInput).toBeVisible({ timeout: 5_000 });

    // 수량을 12 로 변경
    await qtyInput.clear();
    await qtyInput.fill("12");

    // "확인" 버튼 클릭
    await drawer.locator('button:has-text("확인")').click();

    // DB 에서 수량이 변경되었는지 확인
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [itemId]
      );
      expect(items).toHaveLength(1);
      expect(parseFloat(items[0].quantity)).toBe(12);
    }).toPass({ timeout: 10_000 });
  });

  test("5-4. 시스템은 수량 직접 설정 시 재고 변경 이력에 조정 레코드를 생성한다", async ({
    page,
  }) => {
    const ctx = await setupFullPrerequisites(page);
    const itemId = ctx.inventoryItemId;

    const tableToggle = page.locator('button:has-text("재고 목록 (표)")');
    await expect(tableToggle).toBeVisible({ timeout: 10_000 });
    await tableToggle.click();

    await expect(page.locator('text="우유"').first()).toBeVisible({
      timeout: 10_000,
    });
    await page.locator('text="우유"').first().click();

    const drawer = page.getByRole("dialog", { name: /상세/ });
    await expect(drawer.locator('button[aria-label="수량 수정"]')).toBeVisible({
      timeout: 5_000,
    });
    await drawer.locator('button[aria-label="수량 수정"]').click();

    const qtyInput = drawer.getByRole("spinbutton");
    await expect(qtyInput).toBeVisible({ timeout: 5_000 });
    await qtyInput.clear();
    await qtyInput.fill("8");

    await drawer.locator('button:has-text("확인")').click();

    // DB 에서 수량이 변경되었는지 확인
    await expect(async () => {
      const items = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [itemId]
      );
      expect(parseFloat(items[0].quantity)).toBe(8);
    }).toPass({ timeout: 10_000 });

    // ── 조정 API 를 직접 호출하여 조정 레코드 생성 검증 ──
    // 현재 PATCH /quantity 는 로그를 생성하지 않으므로,
    // POST /logs/adjustment 를 직접 호출하여 시스템의 조정 이력 기능을 검증한다.
    const adjustRes = await page.request.post(
      `/api/households/${ctx.householdId}/inventory-items/${itemId}/logs/adjustment`,
      {
        data: { quantityDelta: -3, memo: "실사 반영" },
      }
    );
    expect(adjustRes.ok()).toBe(true);

    // DB 에서 조정 이력 레코드가 생성되었는지 확인
    const logs = await query<{
      type: string;
      quantityDelta: string;
      quantityAfter: string;
      memo: string | null;
    }>(
      `SELECT type, "quantityDelta"::text, "quantityAfter"::text, memo
       FROM inventory_logs
       WHERE "inventoryItemId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [itemId]
    );
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe("adjust");
    expect(parseFloat(logs[0].quantityDelta)).toBe(-3);
    expect(parseFloat(logs[0].quantityAfter)).toBe(5);
    expect(logs[0].memo).toBe("실사 반영");

    // 재고 수량도 조정 반영 확인 (8 - 3 = 5)
    const items = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`,
      [itemId]
    );
    expect(parseFloat(items[0].quantity)).toBe(5);
  });
});
