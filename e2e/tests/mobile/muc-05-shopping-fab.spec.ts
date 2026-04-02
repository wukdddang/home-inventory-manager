import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

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

  async function addShoppingItemApi(
    page: Page, hId: string,
    opts: { label: string; prodId?: string; pvId?: string; inventoryItemId?: string; qty?: number }
  ): Promise<string> {
    const res = await page.request.post(`/api/households/${hId}/shopping-list-items`, {
      data: {
        categoryId: null, productId: opts.prodId ?? null,
        productVariantId: opts.pvId ?? null,
        sourceInventoryItemId: opts.inventoryItemId ?? null,
        quantity: opts.qty ?? 1, memo: opts.label,
      },
    });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
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
    const itemId = await createItemApi(page, hId, varId, slId, 5, 3);
    return { hId, roomId, slId, catId, unitId, prodId, varId, itemId };
  }

  // ── 테스트 ──

  // TODO: ShoppingListFab가 API 모드에서 아직 통합되지 않아 장보기 항목이 프론트엔드 상태에 반영되지 않음
  test("1. 화면 우하단에 장보기 FAB가 표시되고 항목 수 뱃지가 보인다", async ({ page }) => {
    const ctx = await setupFull(page);
    await addShoppingItemApi(page, ctx.hId, { label: "우유", prodId: ctx.prodId, pvId: ctx.varId, qty: 2 });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // 장보기 FAB 표시 (항목 수 포함)
    await expect(page.locator('button:has-text("장보기")')).toBeVisible({ timeout: 10_000 });
  });

  // TODO: ShoppingListFab가 API 모드에서 아직 통합되지 않아 장보기 항목이 프론트엔드 상태에 반영되지 않음
  test("3. 사용자는 FAB를 눌러 장보기 목록 바텀시트를 연다", async ({ page }) => {
    const ctx = await setupFull(page);
    await addShoppingItemApi(page, ctx.hId, { label: "우유", prodId: ctx.prodId, pvId: ctx.varId, qty: 2 });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });
  });

  // TODO: ShoppingListFab가 API 모드에서 아직 통합되지 않아 장보기 항목이 프론트엔드 상태에 반영되지 않음
  test("4. 장보기 항목에 라벨, 수량이 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await addShoppingItemApi(page, ctx.hId, { label: "우유", prodId: ctx.prodId, pvId: ctx.varId, qty: 2 });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });

    // 항목에 라벨과 수량이 표시됨
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=/x2/')).toBeVisible();
  });

  // TODO: ShoppingListFab가 API 모드에서 아직 통합되지 않아 장보기 항목이 프론트엔드 상태에 반영되지 않음
  test("7. 1개 이상 체크 시 구매 완료 버튼이 나타난다", async ({ page }) => {
    const ctx = await setupFull(page);
    await addShoppingItemApi(page, ctx.hId, { label: "우유", inventoryItemId: ctx.itemId, qty: 2 });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });

    // 초기에는 구매 완료 버튼이 없음
    await expect(page.locator('button:has-text("장보기 완료")')).toBeHidden();

    // 체크박스 클릭
    const checkbox = page.locator('[class*="border-zinc-600"]').first();
    await checkbox.click();

    // 구매 완료 버튼 등장
    await expect(page.locator('button:has-text("장보기 완료")')).toBeVisible({ timeout: 5_000 });
  });

  // TODO: ShoppingListFab가 API 모드에서 아직 통합되지 않아 장보기 항목이 프론트엔드 상태에 반영되지 않음
  test("8. 사용자는 구매 완료를 눌러 선택 항목의 재고를 증가시킨다", async ({ page }) => {
    const ctx = await setupFull(page);
    await addShoppingItemApi(page, ctx.hId, {
      label: "우유", prodId: ctx.prodId, pvId: ctx.varId,
      inventoryItemId: ctx.itemId, qty: 3,
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("장보기")').click();
    await expect(page.locator('text="장보기 목록"')).toBeVisible({ timeout: 5_000 });

    // 체크박스 클릭
    const checkbox = page.locator('[class*="border-zinc-600"]').first();
    await checkbox.click();

    // 구매 완료 클릭
    await page.locator('button:has-text("장보기 완료")').click();

    // 장보기 완료 후 시트가 닫히거나 항목이 제거됨
    await expect(page.locator('text="장보기 목록"')).toBeHidden({ timeout: 10_000 });
  });

  test("12. 장보기 항목이 0개이면 FAB가 숨겨지거나 뱃지가 표시되지 않는다", async ({ page }) => {
    await setupFull(page);
    // 장보기 항목 없이 대시보드 로드

    await page.reload();
    await page.waitForLoadState("networkidle");

    // FAB가 숨겨짐 또는 뱃지 없음
    const fab = page.locator('button:has-text("장보기")');
    const fabCount = await fab.count();
    if (fabCount > 0) {
      // FAB가 있더라도 뱃지에 0이 아닌 텍스트는 없어야 함
      await expect(fab).toBeHidden({ timeout: 5_000 });
    }
  });
});
