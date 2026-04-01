import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../utils/db";
import { clearAllMails } from "../utils/mailhog";

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

  /** 장보기 항목을 API 로 추가한다 */
  async function addShoppingItemApi(
    page: Page, hId: string,
    opts: { label: string; unit: string; catId?: string; prodId?: string; pvId?: string; inventoryItemId?: string; qty?: number }
  ): Promise<string> {
    const res = await page.request.post(`/api/households/${hId}/shopping-list-items`, {
      data: {
        categoryId: opts.catId ?? null,
        productId: opts.prodId ?? null,
        productVariantId: opts.pvId ?? null,
        sourceInventoryItemId: opts.inventoryItemId ?? null,
        quantity: opts.qty ?? 1,
        memo: opts.label,
      },
    });
    expect(res.ok()).toBe(true);
    return (await res.json()).data.id;
  }

  /** 전체 사전 조건 세팅 */
  async function setupFull(page: Page) {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")')).toBeVisible({ timeout: 5_000 });

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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8-A. 장보기 항목 CRUD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("8-A-1. 사용자는 카탈로그에서 선택하여 장보기 항목을 추가한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // API 로 장보기 항목 추가
    const itemId = await addShoppingItemApi(page, ctx.hId, {
      label: "우유",
      unit: "팩",
      catId: ctx.catId,
      prodId: ctx.prodId,
      pvId: ctx.varId,
      qty: 2,
    });

    expect(itemId).toBeTruthy();

    // DB 에서 장보기 항목 확인
    const items = await query<{ id: string; memo: string | null; quantity: string | null }>(
      `SELECT id, memo, quantity::text FROM shopping_list_items WHERE "householdId" = $1`,
      [ctx.hId]
    );
    expect(items).toHaveLength(1);
    expect(items[0].memo).toBe("우유");
  });

  test("8-A-2. 사용자는 장보기 항목 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 장보기 항목 2개 추가
    await addShoppingItemApi(page, ctx.hId, { label: "우유", unit: "팩", catId: ctx.catId, prodId: ctx.prodId, pvId: ctx.varId, qty: 2 });
    await addShoppingItemApi(page, ctx.hId, { label: "빵", unit: "개", qty: 1 });

    // API 로 목록 조회
    const res = await page.request.get(`/api/households/${ctx.hId}/shopping-list-items`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.length).toBe(2);

    // 장보기 목록 모달 열기 (헤더의 장보기 버튼)
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator('button[aria-label="장보기 목록"]').click();

    // 장보기 모달이 열렸는지 확인
    const modal = page.getByRole("dialog", { name: /장보기/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });
  });

  test("8-A-3. 사용자는 장보기 항목을 수정한다 (수량 변경)", async ({ page }) => {
    const ctx = await setupFull(page);

    // 장보기 항목 추가
    const shoppingItemId = await addShoppingItemApi(page, ctx.hId, {
      label: "우유", unit: "팩", catId: ctx.catId, prodId: ctx.prodId, pvId: ctx.varId, qty: 2,
    });

    // API 로 수량 변경 (2 → 5)
    const res = await page.request.put(
      `/api/households/${ctx.hId}/shopping-list-items/${shoppingItemId}`,
      { data: { quantity: 5 } }
    );
    expect(res.ok()).toBe(true);

    // DB 에서 수량 변경 확인
    const items = await query<{ quantity: string | null }>(
      `SELECT quantity::text FROM shopping_list_items WHERE id = $1`,
      [shoppingItemId]
    );
    expect(items).toHaveLength(1);
    expect(parseFloat(items[0].quantity!)).toBe(5);
  });

  test("8-A-4. 사용자는 장보기 항목을 삭제한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 장보기 항목 추가
    const shoppingItemId = await addShoppingItemApi(page, ctx.hId, {
      label: "우유", unit: "팩", qty: 2,
    });

    // DB 에서 존재 확인
    const before = await query<{ id: string }>(
      `SELECT id FROM shopping_list_items WHERE "householdId" = $1`, [ctx.hId]);
    expect(before).toHaveLength(1);

    // API 로 삭제
    const res = await page.request.delete(
      `/api/households/${ctx.hId}/shopping-list-items/${shoppingItemId}`
    );
    expect(res.status()).toBe(204);

    // DB 에서 삭제 확인
    const after = await query<{ id: string }>(
      `SELECT id FROM shopping_list_items WHERE "householdId" = $1`, [ctx.hId]);
    expect(after).toHaveLength(0);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8-B. 장보기 구매 완료 처리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("8-B-5. 사용자는 장보기 항목을 구매 완료 처리한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 장보기 항목 추가 (재고 연결)
    const shoppingItemId = await addShoppingItemApi(page, ctx.hId, {
      label: "우유", unit: "팩", catId: ctx.catId, prodId: ctx.prodId, pvId: ctx.varId,
      inventoryItemId: ctx.itemId, qty: 3,
    });

    // 구매 완료 API 호출
    const res = await page.request.post(
      `/api/households/${ctx.hId}/shopping-list-items/${shoppingItemId}/complete`,
      { data: { inventoryItemId: ctx.itemId, quantity: 3 } }
    );
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.inventoryLog.type).toBe("in");
    expect(body.data.inventoryLog.quantityDelta).toBe(3);
  });

  test("8-B-6. 시스템은 구매 완료 시 재고 수량을 자동 증가시킨다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 초기 재고 수량 확인 (5)
    const before = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.itemId]);
    expect(parseFloat(before[0].quantity)).toBe(5);

    // 장보기 항목 추가 + 구매 완료 (수량 4)
    const shoppingItemId = await addShoppingItemApi(page, ctx.hId, {
      label: "우유", unit: "팩", inventoryItemId: ctx.itemId, qty: 4,
    });
    await page.request.post(
      `/api/households/${ctx.hId}/shopping-list-items/${shoppingItemId}/complete`,
      { data: { inventoryItemId: ctx.itemId, quantity: 4 } }
    );

    // 재고 수량 5 + 4 = 9 확인
    const after = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`, [ctx.itemId]);
    expect(parseFloat(after[0].quantity)).toBe(9);

    // 입고(in) 이력 레코드 확인
    const logs = await query<{ type: string; quantityDelta: string }>(
      `SELECT type, "quantityDelta"::text FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [ctx.itemId]);
    expect(logs[0].type).toBe("in");
    expect(parseFloat(logs[0].quantityDelta)).toBe(4);
  });

  test("8-B-7. 시스템은 구매 완료된 항목을 장보기 목록에서 제거한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 장보기 항목 2개 추가
    const item1 = await addShoppingItemApi(page, ctx.hId, {
      label: "우유", unit: "팩", inventoryItemId: ctx.itemId, qty: 2,
    });
    const item2 = await addShoppingItemApi(page, ctx.hId, {
      label: "빵", unit: "개", qty: 1,
    });

    // item1 만 구매 완료
    await page.request.post(
      `/api/households/${ctx.hId}/shopping-list-items/${item1}/complete`,
      { data: { inventoryItemId: ctx.itemId, quantity: 2 } }
    );

    // DB: 완료된 항목은 제거되고, 미완료 항목만 남아야 함
    const remaining = await query<{ id: string; memo: string | null }>(
      `SELECT id, memo FROM shopping_list_items WHERE "householdId" = $1`, [ctx.hId]);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(item2);
    expect(remaining[0].memo).toBe("빵");
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8-C. 장보기 자동 제안
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("8-C-8. 시스템은 부족 품목에 대해 장보기 자동 제안을 표시한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 재고를 최소 기준(3) 이하로 감소시켜 부족 상태 만들기
    // 현재 수량 5, 최소 3 → 수량을 2 로 조정하면 부족 상태
    await page.request.post(
      `/api/households/${ctx.hId}/inventory-items/${ctx.itemId}/logs/adjustment`,
      { data: { quantityDelta: -3, memo: "테스트용 감소" } }
    );

    // 재고 수량 확인 (5 - 3 = 2, minStock = 3 → 부족)
    const items = await query<{ quantity: string; minStockLevel: string | null }>(
      `SELECT quantity::text, "minStockLevel"::text FROM inventory_items WHERE id = $1`, [ctx.itemId]);
    expect(parseFloat(items[0].quantity)).toBe(2);
    expect(parseFloat(items[0].minStockLevel!)).toBe(3);

    // 대시보드로 이동하여 장보기 제안 확인
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 장보기 목록 모달 열기
    await page.locator('button[aria-label="장보기 목록"]').click();
    const modal = page.getByRole("dialog", { name: /장보기/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // "장보기에 담을 만한 재고" 제안 카드 또는 "재고 부족" 뱃지가 표시되는지 확인
    // 또는 "재고 없음" / 자동 제안 섹션 확인
    await expect(
      modal.locator('text=/재고 부족|부족|장보기에 담을/').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("8-C-9. 시스템은 유통기한 임박 품목에 대해 장보기 자동 제안을 표시한다", async ({ page }) => {
    const ctx = await setupFull(page);

    // 유통기한 임박 구매 등록 (2일 후 만료)
    const twoDaysLater = new Date();
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    const expiryDate = twoDaysLater.toISOString().slice(0, 10);

    await page.request.post(`/api/households/${ctx.hId}/purchases`, {
      data: {
        inventoryItemId: ctx.itemId,
        unitPrice: 2500,
        purchasedAt: new Date().toISOString().slice(0, 10),
        itemName: "우유",
        unitSymbol: "팩",
        batches: [{ quantity: 1, expirationDate: expiryDate }],
      },
    });

    // 유통기한 임박 배치 API 검증 (7일 이내)
    const expiringRes = await page.request.get(
      `/api/households/${ctx.hId}/batches/expiring?days=7`
    );
    expect(expiringRes.ok()).toBe(true);
    const expiringBody = await expiringRes.json();
    expect(expiringBody.data.length).toBeGreaterThanOrEqual(1);

    // 대시보드에서 장보기 모달 열기
    await page.reload();
    await page.waitForLoadState("networkidle");

    await page.locator('button[aria-label="장보기 목록"]').click();
    const modal = page.getByRole("dialog", { name: /장보기/ });
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 유통기한 임박 제안이 표시되는지 확인
    // 프론트엔드 computeShoppingSuggestions 가 임박 품목을 감지
    await expect(
      modal.locator('text=/유통기한 임박|임박|장보기에 담을/').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
