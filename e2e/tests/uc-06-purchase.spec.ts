import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../utils/db";
import { clearAllMails } from "../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-06. 구매 기록 및 재고 자동 반영", () => {
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
    const rows = await query<{ id: string }>("SELECT id FROM households LIMIT 1");
    return rows[0].id;
  }

  async function ensureHouseStructure(page: Page, householdId: string) {
    await page.request.put(
      `/api/households/${householdId}/house-structure`,
      { data: { name: "default", structurePayload: { rooms: {} }, diagramLayout: null } }
    );
  }

  async function addRoomApi(page: Page, householdId: string, roomName: string): Promise<string> {
    const existingRooms = await query<{ structureRoomKey: string; displayName: string | null; sortOrder: number }>(
      `SELECT r."structureRoomKey", r."displayName", r."sortOrder" FROM rooms r INNER JOIN house_structures hs ON r."houseStructureId" = hs.id WHERE hs."householdId" = $1`, [householdId]
    );
    const syncPayload = [...existingRooms.map(r => ({ structureRoomKey: r.structureRoomKey, displayName: r.displayName, sortOrder: r.sortOrder })),
      { structureRoomKey: "room-" + Date.now(), displayName: roomName, sortOrder: existingRooms.length }];
    await page.request.put(`/api/households/${householdId}/rooms/sync`, { data: { rooms: syncPayload } });
    const rows = await query<{ id: string }>('SELECT id FROM rooms WHERE "displayName" = $1', [roomName]);
    return rows[0].id;
  }

  async function addStorageLocationApi(page: Page, householdId: string, roomId: string, name: string): Promise<string> {
    const res = await page.request.post(`/api/households/${householdId}/storage-locations`, { data: { name, roomId, furniturePlacementId: null, sortOrder: 0 } });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
  }

  async function createCategoryApi(page: Page, householdId: string, name: string): Promise<string> {
    const res = await page.request.post(`/api/households/${householdId}/categories`, { data: { name, sortOrder: 0 } });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
  }

  async function createUnitApi(page: Page, householdId: string, symbol: string, name?: string): Promise<string> {
    const res = await page.request.post(`/api/households/${householdId}/units`, { data: { symbol, name: name ?? null, sortOrder: 0 } });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
  }

  async function createProductApi(page: Page, householdId: string, categoryId: string, name: string): Promise<string> {
    const res = await page.request.post(`/api/households/${householdId}/products`, { data: { categoryId, name, isConsumable: true } });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
  }

  async function createVariantApi(page: Page, householdId: string, productId: string, unitId: string, qty: number, name?: string): Promise<string> {
    const res = await page.request.post(`/api/households/${householdId}/products/${productId}/variants`, { data: { unitId, quantityPerUnit: qty, name: name ?? null, isDefault: true } });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
  }

  async function createInventoryItemApi(page: Page, householdId: string, productVariantId: string, storageLocationId: string, quantity: number, minStockLevel?: number): Promise<string> {
    const res = await page.request.post(`/api/households/${householdId}/inventory-items`, { data: { productVariantId, storageLocationId, quantity, minStockLevel: minStockLevel ?? null } });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
  }

  /** 오늘 날짜 문자열 (YYYY-MM-DD) */
  function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** N일 후 날짜 문자열 */
  function futureDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  /** N일 전 날짜 문자열 */
  function pastDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  /** 전체 사전 조건 세팅 (거점 + 방 + 보관장소 + 카탈로그 + 재고) */
  async function setupFullPrerequisites(page: Page) {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")')).toBeVisible({ timeout: 5_000 });

    const householdId = await getHouseholdId();
    await ensureHouseStructure(page, householdId);
    const roomId = await addRoomApi(page, householdId, "주방");
    const storageId = await addStorageLocationApi(page, householdId, roomId, "냉장고");
    const categoryId = await createCategoryApi(page, householdId, "식료품");
    const unitId = await createUnitApi(page, householdId, "팩");
    const productId = await createProductApi(page, householdId, categoryId, "우유");
    const variantId = await createVariantApi(page, householdId, productId, unitId, 1, "1L");
    const inventoryItemId = await createInventoryItemApi(page, householdId, variantId, storageId, 3);

    return { householdId, roomId, storageId, categoryId, unitId, productId, variantId, inventoryItemId };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6-A. 구매 등록 (재고 연결)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("6-A-1. 사용자는 재고와 연결하여 구매를 등록한다 (단가·구매처·유통기한 로트 포함)", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);
    const expiryDate = futureDateStr(30);

    // 구매 API 로 재고 연결 구매 등록
    const res = await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        inventoryItemId: ctx.inventoryItemId,
        unitPrice: 2500,
        purchasedAt: todayStr(),
        supplierName: "이마트",
        itemName: "우유",
        variantCaption: "1L",
        unitSymbol: "팩",
        batches: [{ quantity: 2, expirationDate: expiryDate }],
      },
    });
    expect(res.ok()).toBe(true);
    const purchase = (await res.json()).data;
    expect(purchase.id).toBeTruthy();
    expect(purchase.inventoryItemId).toBe(ctx.inventoryItemId);

    // DB 에서 구매 레코드 확인
    const purchases = await query<{ id: string; "inventoryItemId": string | null; "supplierName": string | null }>(
      `SELECT id, "inventoryItemId", "supplierName" FROM purchases WHERE "householdId" = $1`, [ctx.householdId]
    );
    expect(purchases).toHaveLength(1);
    expect(purchases[0].inventoryItemId).toBe(ctx.inventoryItemId);
    expect(purchases[0].supplierName).toBe("이마트");

    // DB 에서 배치(로트) 확인
    const batches = await query<{ quantity: string; "expirationDate": string | null }>(
      `SELECT quantity::text, "expirationDate"::text FROM purchase_batches WHERE "purchaseId" = $1`, [purchases[0].id]
    );
    expect(batches).toHaveLength(1);
    expect(parseFloat(batches[0].quantity)).toBe(2);
  });

  test("6-A-2. 시스템은 구매 등록 시 재고 수량을 자동으로 증가시킨다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 초기 재고 수량 확인 (3)
    const beforeItems = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.inventoryItemId]
    );
    expect(parseFloat(beforeItems[0].quantity)).toBe(3);

    // 재고 연결 구매 등록 (수량 5)
    const res = await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        inventoryItemId: ctx.inventoryItemId,
        unitPrice: 2000,
        purchasedAt: todayStr(),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 5, expirationDate: futureDateStr(14) }],
      },
    });
    expect(res.ok()).toBe(true);

    // 재고 수량이 3 + 5 = 8 으로 증가했는지 확인
    const afterItems = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.inventoryItemId]
    );
    expect(parseFloat(afterItems[0].quantity)).toBe(8);
  });

  test("6-A-3. 시스템은 구매 등록 시 재고 변경 이력에 입고 레코드를 자동 생성한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 재고 연결 구매 등록
    const res = await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        inventoryItemId: ctx.inventoryItemId,
        unitPrice: 1500,
        purchasedAt: todayStr(),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 4, expirationDate: futureDateStr(7) }],
      },
    });
    expect(res.ok()).toBe(true);

    // 재고 변경 이력에서 입고(in) 레코드 확인
    const logs = await query<{ type: string; quantityDelta: string; quantityAfter: string; memo: string | null }>(
      `SELECT type, "quantityDelta"::text, "quantityAfter"::text, memo FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [ctx.inventoryItemId]
    );
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe("in");
    expect(parseFloat(logs[0].quantityDelta)).toBe(4);
    expect(parseFloat(logs[0].quantityAfter)).toBe(7); // 3 + 4
  });

  test("6-A-4. 사용자는 구매 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 구매 2건 API 로 등록
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        inventoryItemId: ctx.inventoryItemId,
        unitPrice: 2500,
        purchasedAt: todayStr(),
        supplierName: "이마트",
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 2, expirationDate: futureDateStr(14) }],
      },
    });
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 3000,
        purchasedAt: todayStr(),
        supplierName: "홈플러스",
        itemName: "치즈",
        unitSymbol: "개",
        batches: [{ quantity: 1, expirationDate: futureDateStr(30) }],
      },
    });

    // 구매·로트 페이지로 이동
    await page.goto("/purchases");
    await page.waitForLoadState("networkidle");

    // 구매 목록 테이블에서 "우유" 와 "치즈" 확인 (td 내 텍스트)
    await expect(page.locator('td:has-text("우유")').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('td:has-text("치즈")').first()).toBeVisible({ timeout: 5_000 });

    // 구매처 확인
    await expect(page.locator('td:has-text("이마트")').first()).toBeVisible();
    await expect(page.locator('td:has-text("홈플러스")').first()).toBeVisible();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6-B. 구매 등록 (재고 미연결 → 나중에 연결)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("6-B-5. 사용자는 재고 미연결 상태로 구매를 등록한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 재고 미연결 구매 등록 (inventoryItemId 없음)
    const res = await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 5000,
        purchasedAt: todayStr(),
        supplierName: "쿠팡",
        itemName: "세제",
        unitSymbol: "개",
        batches: [{ quantity: 3, expirationDate: futureDateStr(365) }],
      },
    });
    expect(res.ok()).toBe(true);
    const purchase = (await res.json()).data;
    expect(purchase.inventoryItemId).toBeNull();

    // DB 에서 재고 미연결 확인
    const purchases = await query<{ "inventoryItemId": string | null }>(
      `SELECT "inventoryItemId" FROM purchases WHERE id = $1`, [purchase.id]
    );
    expect(purchases[0].inventoryItemId).toBeNull();
  });

  test("6-B-6. 사용자는 구매 목록에서 재고 미연결 상태를 확인한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 재고 미연결 구매 등록
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 5000,
        purchasedAt: todayStr(),
        supplierName: "쿠팡",
        itemName: "세제",
        unitSymbol: "개",
        batches: [{ quantity: 3, expirationDate: futureDateStr(365) }],
      },
    });

    // 구매·로트 페이지로 이동
    await page.goto("/purchases");
    await page.waitForLoadState("networkidle");

    // "세제" 가 목록 테이블에 표시되는지 확인 (td 내)
    await expect(page.locator('td:has-text("세제")').first()).toBeVisible({ timeout: 10_000 });

    // DB 에서 재고 미연결 확인
    const purchases = await query<{ "inventoryItemId": string | null; "itemName": string | null }>(
      `SELECT "inventoryItemId", "itemName" FROM purchases WHERE "householdId" = $1`, [ctx.householdId]
    );
    const unlinked = purchases.filter(p => p.inventoryItemId === null);
    expect(unlinked.length).toBeGreaterThanOrEqual(1);
    expect(unlinked.some(p => p.itemName === "세제")).toBe(true);
  });

  test("6-B-7. 사용자는 구매 기록에 재고를 나중에 연결한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 재고 미연결 구매 등록
    const createRes = await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 2500,
        purchasedAt: todayStr(),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 3, expirationDate: futureDateStr(14) }],
      },
    });
    expect(createRes.ok()).toBe(true);
    const purchaseId = (await createRes.json()).data.id;

    // 재고 연결 API 호출
    const linkRes = await page.request.patch(
      `/api/households/${ctx.householdId}/purchases/${purchaseId}/link-inventory`,
      { data: { inventoryItemId: ctx.inventoryItemId } }
    );
    expect(linkRes.ok()).toBe(true);

    // DB 에서 연결 확인
    const purchases = await query<{ "inventoryItemId": string | null }>(
      `SELECT "inventoryItemId" FROM purchases WHERE id = $1`, [purchaseId]
    );
    expect(purchases[0].inventoryItemId).toBe(ctx.inventoryItemId);
  });

  test("6-B-8. 시스템은 재고 연결 후 재고 수량을 증가시킨다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 초기 재고 수량 확인 (3)
    const before = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.inventoryItemId]
    );
    expect(parseFloat(before[0].quantity)).toBe(3);

    // 재고 미연결 구매 등록 (수량 4)
    const createRes = await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 2000,
        purchasedAt: todayStr(),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 4, expirationDate: futureDateStr(14) }],
      },
    });
    const purchaseId = (await createRes.json()).data.id;

    // 재고 미연결 상태에서는 수량 변동 없음
    const middle = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.inventoryItemId]
    );
    expect(parseFloat(middle[0].quantity)).toBe(3);

    // 재고 연결
    await page.request.patch(
      `/api/households/${ctx.householdId}/purchases/${purchaseId}/link-inventory`,
      { data: { inventoryItemId: ctx.inventoryItemId } }
    );

    // 연결 후 재고 수량 3 + 4 = 7
    const after = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.inventoryItemId]
    );
    expect(parseFloat(after[0].quantity)).toBe(7);

    // 입고 이력 레코드 확인
    const logs = await query<{ type: string; quantityDelta: string }>(
      `SELECT type, "quantityDelta"::text FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [ctx.inventoryItemId]
    );
    expect(logs).toHaveLength(1);
    expect(logs[0].type).toBe("in");
    expect(parseFloat(logs[0].quantityDelta)).toBe(4);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6-C. 로트 / 유통기한 관리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("6-C-9. 사용자는 로트 목록에서 유통기한 정보를 확인한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);
    const expiryDate = futureDateStr(10);

    // 구매 등록 (로트 포함)
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        inventoryItemId: ctx.inventoryItemId,
        unitPrice: 2500,
        purchasedAt: todayStr(),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 2, expirationDate: expiryDate }],
      },
    });

    // 구매·로트 페이지로 이동
    await page.goto("/purchases");
    await page.waitForLoadState("networkidle");

    // 유통기한이 테이블에 표시되는지 확인 (td 내)
    await expect(page.locator(`td:has-text("${expiryDate}")`).first()).toBeVisible({ timeout: 10_000 });

    // D-10 뱃지가 표시되는지 확인 (td 내)
    await expect(page.locator('td:has-text("D-10")').first()).toBeVisible({ timeout: 5_000 });
  });

  test("6-C-10. 사용자는 유통기한 임박 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 임박 구매 (3일 후 만료)
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 2500,
        purchasedAt: todayStr(),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 1, expirationDate: futureDateStr(3) }],
      },
    });

    // 여유로운 구매 (60일 후 만료)
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 3000,
        purchasedAt: todayStr(),
        itemName: "치즈",
        unitSymbol: "개",
        batches: [{ quantity: 1, expirationDate: futureDateStr(60) }],
      },
    });

    // 유통기한 임박 API 조회 (7일 이내)
    const res = await page.request.get(
      `/api/households/${ctx.householdId}/batches/expiring?days=7`
    );
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const batches = body.data;

    // 3일 후 만료 배치만 포함되어야 함
    expect(batches.length).toBeGreaterThanOrEqual(1);
    const expiringDates = batches.map((b: { expirationDate: string }) => b.expirationDate);
    expect(expiringDates.some((d: string) => d === futureDateStr(3))).toBe(true);
    // 60일 후 배치는 포함되지 않아야 함
    expect(expiringDates.some((d: string) => d === futureDateStr(60))).toBe(false);
  });

  test("6-C-11. 사용자는 이미 만료된 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 만료된 구매 (3일 전 만료)
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 2500,
        purchasedAt: pastDateStr(10),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 1, expirationDate: pastDateStr(3) }],
      },
    });

    // 아직 유효한 구매 (30일 후 만료)
    await page.request.post(`/api/households/${ctx.householdId}/purchases`, {
      data: {
        unitPrice: 3000,
        purchasedAt: todayStr(),
        itemName: "치즈",
        unitSymbol: "개",
        batches: [{ quantity: 1, expirationDate: futureDateStr(30) }],
      },
    });

    // 만료 API 조회
    const res = await page.request.get(
      `/api/households/${ctx.householdId}/batches/expired`
    );
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const batches = body.data;

    // 만료된 배치만 포함
    expect(batches.length).toBeGreaterThanOrEqual(1);
    const expiredDates = batches.map((b: { expirationDate: string }) => b.expirationDate);
    expect(expiredDates.some((d: string) => d === pastDateStr(3))).toBe(true);
    // 유효한 배치는 포함되지 않아야 함
    expect(expiredDates.some((d: string) => d === futureDateStr(30))).toBe(false);
  });
});
