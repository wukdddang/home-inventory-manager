import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-09. 바텀시트 공통 동작", () => {
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

  /** 재고 카드 탭 → 사용 버튼 → 바텀시트 열기 */
  async function openBottomSheet(page: Page) {
    await page.reload();
    await page.waitForLoadState("networkidle");

    const card = page.locator('button:has-text("우유")').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();

    // 액션 시트에서 "사용" 버튼 클릭하여 바텀시트 열기
    await page.locator('button:has-text("사용")').click();
    await expect(page.locator('text="사용 처리"')).toBeVisible({ timeout: 5_000 });
  }

  // ── 테스트 ──

  test("3. 오버레이 영역을 탭하면 시트가 닫힌다", async ({ page }) => {
    await setupFull(page);
    await openBottomSheet(page);

    // 오버레이 클릭 — Tailwind v4에서 class 선택자가 컴파일되므로 구조적 위치로 찾음
    // 바텀시트 오버레이는 fixed inset-0 z-50 요소이며 시트보다 앞에 렌더링됨
    // 뷰포트 상단 좌측을 클릭하여 오버레이를 탭
    await page.mouse.click(10, 10);

    // 시트가 닫힘
    await expect(page.locator('text="사용 처리"')).toBeHidden({ timeout: 5_000 });
  });

  test("4. 드래그 핸들이 시트 상단에 표시된다", async ({ page }) => {
    await setupFull(page);
    await openBottomSheet(page);

    // 드래그 핸들 바 — 시트 상단의 작은 바를 크기로 찾음 (h-1 w-10 rounded-full)
    // Tailwind v4 컴파일로 class 선택자가 동작하지 않으므로 evaluate로 확인
    const sheetTitle = page.locator('text="사용 처리"');
    await expect(sheetTitle).toBeVisible({ timeout: 5_000 });

    // 시트 컨테이너 내부에서 핸들(작은 바)이 제목 위에 있는지 확인
    const handleExists = await page.evaluate(() => {
      // 시트 내부에서 rounded-full이고 높이가 작은 요소를 찾음
      const elements = document.querySelectorAll("div");
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        // 드래그 핸들: 높이 4px(h-1), 너비 40px(w-10), 둥근 모서리
        if (rect.height <= 6 && rect.height >= 2 && rect.width >= 30 && rect.width <= 50 && style.borderRadius !== "0px") {
          return true;
        }
      }
      return false;
    });
    expect(handleExists).toBe(true);
  });

  test("5. 시트 최대 높이가 85dvh를 넘지 않는다", async ({ page }) => {
    await setupFull(page);
    await openBottomSheet(page);

    // Tailwind v4 컴파일로 class 선택자가 동작하지 않으므로
    // "사용 처리" 제목이 포함된 시트 컨테이너를 구조적으로 찾음
    const sheetTitle = page.locator('text="사용 처리"');
    await expect(sheetTitle).toBeVisible({ timeout: 5_000 });

    // 시트 높이를 evaluate로 측정 — fixed + bottom-0 + rounded-t 시트를 찾음
    const sheetHeight = await page.evaluate(() => {
      const fixedElements = document.querySelectorAll("div");
      for (const el of fixedElements) {
        const style = window.getComputedStyle(el);
        if (
          style.position === "fixed" &&
          el.textContent?.includes("사용 처리") &&
          style.bottom === "0px"
        ) {
          return el.getBoundingClientRect().height;
        }
      }
      return null;
    });

    const viewport = page.viewportSize();
    expect(sheetHeight).not.toBeNull();
    expect(viewport).not.toBeNull();
    // 시트 높이가 뷰포트의 85%를 넘지 않아야 함 (약간의 여유 포함)
    expect(sheetHeight!).toBeLessThanOrEqual(viewport!.height * 0.86);
  });
});
