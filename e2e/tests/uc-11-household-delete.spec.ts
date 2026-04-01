import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../utils/db";
import { clearAllMails } from "../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-11. 거점 삭제", () => {
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

  async function getHouseholdId(name: string): Promise<string> {
    return (await query<{ id: string }>("SELECT id FROM households WHERE name = $1", [name]))[0].id;
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

  async function createItemApi(page: Page, hId: string, pvId: string, slId: string, qty: number): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/inventory-items`, { data: { productVariantId: pvId, storageLocationId: slId, quantity: qty, minStockLevel: null } })).json()).data.id;
  }

  /** 거점 + 방 + 보관장소 + 카탈로그 + 재고 풀세팅 */
  async function setupFullHousehold(page: Page, householdName: string) {
    await createHousehold(page, householdName);
    const hId = await getHouseholdId(householdName);
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("11-1. 사용자는 거점 삭제를 시도하고 삭제 확인 다이얼로그를 확인한다", async ({ page }) => {
    await signupAndWait(page);
    await setupFullHousehold(page, "우리 집");

    // 거점 탭에서 "우리 집" 우클릭 → 컨텍스트 메뉴
    const householdTab = page.locator('button[role="tab"]:has-text("우리 집")');
    await expect(householdTab).toBeVisible({ timeout: 5_000 });
    await householdTab.click({ button: "right" });

    // 컨텍스트 메뉴에서 "삭제" 클릭
    const contextMenu = page.locator('[role="menu"][aria-label="거점 컨텍스트 메뉴"]');
    await expect(contextMenu).toBeVisible({ timeout: 5_000 });
    await contextMenu.locator('button[role="menuitem"]:has-text("삭제")').click();

    // AlertModal 삭제 확인 다이얼로그가 나타나는지 확인
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    // 다이얼로그에 "삭제" 확인 텍스트가 포함되어 있는지
    await expect(alertDialog.locator('button:has-text("삭제")')).toBeVisible();
    await expect(alertDialog.locator('button:has-text("취소")')).toBeVisible();

    // 취소하여 다이얼로그 닫기
    await alertDialog.locator('button:has-text("취소")').click();
    await expect(alertDialog).toBeHidden({ timeout: 5_000 });

    // 거점이 아직 존재하는지 확인
    await expect(householdTab).toBeVisible();
  });

  test("11-2. 사용자는 거점을 삭제하고 거점 목록에서 제거됨을 확인한다", async ({ page }) => {
    await signupAndWait(page);
    await setupFullHousehold(page, "우리 집");
    // 두 번째 거점 생성 (삭제 후 하나는 남아야 하므로)
    await createHousehold(page, "사무실");

    await page.reload();
    await page.waitForLoadState("networkidle");

    // "우리 집" 거점 탭이 보이는지 확인
    const targetTab = page.locator('button[role="tab"]:has-text("우리 집")');
    await expect(targetTab).toBeVisible({ timeout: 10_000 });

    // API 로 거점 삭제
    const hId = await getHouseholdId("우리 집");
    const deleteRes = await page.request.delete(`/api/households/${hId}`);
    expect([200, 204]).toContain(deleteRes.status());

    // 페이지 새로고침 후 거점 목록에서 제거 확인
    await page.reload();
    await page.waitForLoadState("networkidle");

    // "우리 집" 탭이 사라졌는지 확인
    await expect(
      page.locator('button[role="tab"]:has-text("우리 집")')
    ).toBeHidden({ timeout: 10_000 });

    // "사무실" 탭은 여전히 존재
    await expect(
      page.locator('button[role="tab"]:has-text("사무실")')
    ).toBeVisible({ timeout: 5_000 });

    // DB 에서 거점 삭제 확인
    const households = await query<{ name: string }>("SELECT name FROM households");
    expect(households.length).toBe(1);
    expect(households[0].name).toBe("사무실");
  });

  test("11-3. 시스템은 삭제된 거점의 하위 데이터(방/가구/보관장소/재고)에 접근 불가 상태로 만든다", async ({ page }) => {
    await signupAndWait(page);
    const ctx = await setupFullHousehold(page, "우리 집");

    // 삭제 전 하위 데이터 존재 확인
    const beforeRooms = await query<{ id: string }>(
      `SELECT r.id FROM rooms r INNER JOIN house_structures hs ON r."houseStructureId" = hs.id WHERE hs."householdId" = $1`, [ctx.hId]);
    expect(beforeRooms.length).toBeGreaterThanOrEqual(1);

    const beforeStorages = await query<{ id: string }>(
      `SELECT id FROM storage_locations WHERE "householdId" = $1`, [ctx.hId]);
    expect(beforeStorages.length).toBeGreaterThanOrEqual(1);

    const beforeCategories = await query<{ id: string }>(
      `SELECT id FROM categories WHERE "householdId" = $1`, [ctx.hId]);
    expect(beforeCategories.length).toBeGreaterThanOrEqual(1);

    const beforeItems = await query<{ id: string }>(
      `SELECT id FROM inventory_items WHERE id = $1`, [ctx.itemId]);
    expect(beforeItems.length).toBe(1);

    // API 로 거점 삭제
    const deleteRes = await page.request.delete(`/api/households/${ctx.hId}`);
    expect([200, 204]).toContain(deleteRes.status());

    // CASCADE 삭제로 하위 데이터가 모두 제거되었는지 확인
    const afterHouseholds = await query<{ id: string }>(
      `SELECT id FROM households WHERE id = $1`, [ctx.hId]);
    expect(afterHouseholds).toHaveLength(0);

    const afterStructures = await query<{ id: string }>(
      `SELECT id FROM house_structures WHERE "householdId" = $1`, [ctx.hId]);
    expect(afterStructures).toHaveLength(0);

    const afterRooms = await query<{ id: string }>(
      `SELECT r.id FROM rooms r INNER JOIN house_structures hs ON r."houseStructureId" = hs.id WHERE hs."householdId" = $1`, [ctx.hId]);
    expect(afterRooms).toHaveLength(0);

    const afterStorages = await query<{ id: string }>(
      `SELECT id FROM storage_locations WHERE "householdId" = $1`, [ctx.hId]);
    expect(afterStorages).toHaveLength(0);

    const afterCategories = await query<{ id: string }>(
      `SELECT id FROM categories WHERE "householdId" = $1`, [ctx.hId]);
    expect(afterCategories).toHaveLength(0);

    const afterItems = await query<{ id: string }>(
      `SELECT id FROM inventory_items WHERE id = $1`, [ctx.itemId]);
    expect(afterItems).toHaveLength(0);

    // 삭제된 거점 API 접근 시 에러 반환
    const accessRes = await page.request.get(`/api/households/${ctx.hId}/members`);
    expect([403, 404, 500]).toContain(accessRes.status());
  });
});
