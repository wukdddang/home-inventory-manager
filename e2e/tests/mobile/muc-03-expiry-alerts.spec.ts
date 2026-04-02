import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

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

  async function ensureHouseStructure(page: Page, hId: string) {
    await page.request.put(`/api/households/${hId}/house-structure`, {
      data: { name: "default", structurePayload: { rooms: {} }, diagramLayout: null },
    });
  }

  async function addRoomApi(page: Page, hId: string, name: string): Promise<string> {
    const existing = await query<{ structureRoomKey: string; displayName: string | null; sortOrder: number }>(
      `SELECT r."structureRoomKey", r."displayName", r."sortOrder" FROM rooms r INNER JOIN house_structures hs ON r."houseStructureId" = hs.id WHERE hs."householdId" = $1`, [hId]);
    await page.request.put(`/api/households/${hId}/rooms/sync`, {
      data: { rooms: [...existing.map(r => ({ structureRoomKey: r.structureRoomKey, displayName: r.displayName, sortOrder: r.sortOrder })),
        { structureRoomKey: "room-" + Date.now(), displayName: name, sortOrder: existing.length }] },
    });
    return (await query<{ id: string }>('SELECT id FROM rooms WHERE "displayName" = $1', [name]))[0].id;
  }

  async function addStorageApi(page: Page, hId: string, roomId: string, name: string): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/storage-locations`, { data: { name, roomId, furniturePlacementId: null, sortOrder: 0 } })).json()).data.id;
  }

  async function createCatApi(page: Page, hId: string, name: string): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/categories`, { data: { name, sortOrder: 0 } })).json()).data.id;
  }

  async function createUnitApi(page: Page, hId: string, symbol: string): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/units`, { data: { symbol, name: null, sortOrder: 0 } })).json()).data.id;
  }

  async function createProdApi(page: Page, hId: string, catId: string, name: string): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/products`, { data: { categoryId: catId, name, isConsumable: true } })).json()).data.id;
  }

  async function createVarApi(page: Page, hId: string, prodId: string, unitId: string, qty: number, name?: string): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/products/${prodId}/variants`, { data: { unitId, quantityPerUnit: qty, name: name ?? null, isDefault: true } })).json()).data.id;
  }

  async function createItemApi(page: Page, hId: string, pvId: string, slId: string, qty: number, minStock?: number): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/inventory-items`, { data: { productVariantId: pvId, storageLocationId: slId, quantity: qty, minStockLevel: minStock ?? null } })).json()).data.id;
  }

  async function setupFull(page: Page) {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    const hId = await getHouseholdId();
    await ensureHouseStructure(page, hId);
    const roomId = await addRoomApi(page, hId, "주방");
    const slId = await addStorageApi(page, hId, roomId, "냉장고");
    const catId = await createCatApi(page, hId, "식료품");
    const unitId = await createUnitApi(page, hId, "팩");
    const prodId = await createProdApi(page, hId, catId, "우유");
    const varId = await createVarApi(page, hId, prodId, unitId, 1, "1L");
    const itemId = await createItemApi(page, hId, varId, slId, 5);
    return { hId, roomId, slId, catId, unitId, prodId, varId, itemId };
  }

  /** 유통기한 임박 배치를 등록한다 */
  async function createExpiringBatch(page: Page, hId: string, itemId: string, daysFromNow: number) {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    const expiryDate = date.toISOString().slice(0, 10);
    await page.request.post(`/api/households/${hId}/purchases`, {
      data: {
        inventoryItemId: itemId,
        unitPrice: 2500,
        purchasedAt: new Date().toISOString().slice(0, 10),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 1, expirationDate: expiryDate }],
      },
    });
  }

  // ── 테스트 ──

  test("1. 유통기한 알림 섹션이 대시보드 상단에 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    // 3일 후 만료 배치
    await createExpiringBatch(page, ctx.hId, ctx.itemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text=/유통기한 임박/')).toBeVisible({ timeout: 10_000 });
  });

  test("2. 알림 헤더에 해당 품목 수 뱃지가 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createExpiringBatch(page, ctx.hId, ctx.itemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // "유통기한 임박 (1)" 형태로 품목 수 표시
    await expect(page.locator('text=/유통기한 임박.*\\(\\d+\\)/')).toBeVisible({ timeout: 10_000 });
  });

  test("3. 사용자는 알림 섹션 헤더를 눌러 접기/펼치기를 전환한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createExpiringBatch(page, ctx.hId, ctx.itemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    const header = page.locator('button:has-text("유통기한 임박")');
    await expect(header).toBeVisible({ timeout: 10_000 });

    // 품목 정보가 보이는지 확인
    await expect(page.locator('text=/D-\\d+/').first()).toBeVisible({ timeout: 5_000 });

    // 접기
    await header.click();
    // 접힌 후 ExpiryAlerts 내부의 "사용" 버튼이 숨겨짐 (D-X는 카드에도 존재하므로 사용 버튼으로 검증)
    const expiryUseBtn = page.locator('button:has-text("사용")').first();
    // 접힘 상태에서 유통기한 알림 섹션의 아이템 행이 숨겨지는지 확인
    await expect(page.locator('.text-amber-400:has-text("D-")')).toBeHidden({ timeout: 5_000 });
  });

  test("5. 임박 품목은 노란색 점 + D-X 형식으로 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createExpiringBatch(page, ctx.hId, ctx.itemId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text=/D-3/').first()).toBeVisible({ timeout: 10_000 });
  });

  test("7. 품목이 만료 심각도순으로 정렬된다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 두 번째 품목 생성 (더 긴 유통기한)
    const prodId2 = await createProdApi(page, ctx.hId, ctx.catId, "치즈");
    const varId2 = await createVarApi(page, ctx.hId, prodId2, ctx.unitId, 1, "200g");
    const itemId2 = await createItemApi(page, ctx.hId, varId2, ctx.slId, 3);

    // 우유: 2일 후 만료 (더 급한 것)
    await createExpiringBatch(page, ctx.hId, ctx.itemId, 2);
    // 치즈: 5일 후 만료
    await createExpiringBatch(page, ctx.hId, itemId2, 5);

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
    await createExpiringBatch(page, ctx.hId, ctx.itemId, 3);

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
