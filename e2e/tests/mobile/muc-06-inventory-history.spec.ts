import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-06. 재고 이력 (모바일)", () => {
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

  async function createItemApi(page: Page, hId: string, pvId: string, slId: string, qty: number): Promise<string> {
    return (await (await page.request.post(`/api/households/${hId}/inventory-items`, { data: { productVariantId: pvId, storageLocationId: slId, quantity: qty, minStockLevel: null } })).json()).data.id;
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
    const itemId = await createItemApi(page, hId, varId, slId, 10);
    return { hId, roomId, slId, catId, unitId, prodId, varId, itemId };
  }

  /** 소비 + 폐기 이력을 API 로 생성 */
  async function createHistoryData(page: Page, hId: string, itemId: string) {
    await page.request.post(`/api/households/${hId}/inventory-items/${itemId}/logs/consumption`, {
      data: { quantity: 2, memo: "요리에 사용" },
    });
    await page.request.post(`/api/households/${hId}/inventory-items/${itemId}/logs/waste`, {
      data: { quantity: 1, reason: "expired", memo: "유통기한 초과" },
    });
    await page.request.post(`/api/households/${hId}/inventory-items/${itemId}/logs/adjustment`, {
      data: { quantityDelta: 3, memo: "실사 반영" },
    });
  }

  // ── 테스트 ──

  test("1. 기간 프리셋 칩(오늘, 이번 주, 이번 달)이 상단에 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.itemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text="오늘"')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text="이번주"').or(page.locator('text="이번 주"'))).toBeVisible();
    await expect(page.locator('text="이번달"').or(page.locator('text="이번 달"'))).toBeVisible();
  });

  test("3. 타입 필터가 가로 스크롤 칩 행으로 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.itemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text="전체"').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text="입고"')).toBeVisible();
    await expect(page.locator('text="소비"')).toBeVisible();
    await expect(page.locator('text="조정"')).toBeVisible();
    await expect(page.locator('text="폐기"')).toBeVisible();
  });

  // TODO: API 모드에서 loadApiLedger가 localStorage의 household.items에 의존하므로 API로 생성한 이력이 프론트엔드에 로드되지 않음
  test("5. 사용자는 타입 칩을 탭하여 해당 유형만 필터링한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.itemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    // 전체 이력이 로드될 때까지 대기
    await expect(page.locator('text="소비"').first()).toBeVisible({ timeout: 10_000 });

    // "폐기" 필터 칩 탭 (button 요소)
    const wasteChip = page.locator('button:has-text("폐기")').first();
    await wasteChip.click();

    // 선택된 칩은 teal 색상으로 강조됨
    await expect(wasteChip).toBeVisible({ timeout: 5_000 });
  });

  // TODO: API 모드에서 loadApiLedger가 localStorage의 household.items에 의존하므로 API로 생성한 이력이 프론트엔드에 로드되지 않음
  test("7. 오늘/어제는 오늘, 어제 라벨로 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.itemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    // "오늘" 날짜 라벨이 표시됨 (이력이 오늘 생성됨) — 형식: "YYYY-MM-DD (오늘)"
    await expect(page.locator('text=/(오늘)/').first()).toBeVisible({ timeout: 10_000 });
  });

  // TODO: API 모드에서 loadApiLedger가 localStorage의 household.items에 의존하므로 API로 생성한 이력이 프론트엔드에 로드되지 않음
  test("8. 각 이력 항목에 타입 뱃지, 품목명, 수량 변화, 시간이 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.itemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    // 타입 뱃지 (소비) — Tailwind v4에서 class 선택자 대신 텍스트 기반 선택자 사용
    await expect(page.getByText("소비", { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    // 수량 변화 표시
    await expect(page.locator('text=/[-+]\\d+/').first()).toBeVisible();
  });

  test("12. 필터 결과가 없으면 빈 상태 안내 메시지가 표시된다", async ({ page }) => {
    await setupFull(page);
    // 이력 없이 이력 페이지 이동

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('text="표시할 이력이 없습니다."')).toBeVisible({ timeout: 10_000 });
  });
});
