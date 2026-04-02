import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import {
  seedFullCatalogAndInventory,
  seedPurchase,
  seedPurchaseBatch,
  type FullSeedResult,
} from "../../utils/seed";

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

  function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function futureDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function pastDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  /** 전체 사전 조건 세팅 (거점 + DB 시드) */
  async function setupFullPrerequisites(page: Page): Promise<FullSeedResult> {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    await expect(
      page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")'),
    ).toBeVisible({ timeout: 5_000 });

    const householdId = await getHouseholdId();
    const seed = await seedFullCatalogAndInventory(householdId, {
      inventoryQuantity: 3,
    });

    // 대시보드를 새로고침하여 시드 데이터를 localStorage 에 반영
    await page.reload();
    await page.waitForLoadState("networkidle");

    return seed;
  }

  /** 구매·로트 페이지로 이동하여 "구매 등록" 모달을 연다 */
  async function openPurchaseRegisterModal(page: Page) {
    await page.goto("/purchases");
    await page.waitForLoadState("networkidle");
    // 거점 탭이 선택되었는지 확인
    await expect(
      page.locator('button:has-text("우리 집")').first(),
    ).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("구매 등록")').click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 5_000 });
    return modal;
  }

  /**
   * 구매 등록 모달에서 재고 연결 구매를 등록한다.
   * 재고 드롭다운에서 선택하면 품목명·단위가 자동 채워진다.
   */
  async function registerLinkedPurchaseViaUI(
    page: Page,
    modal: ReturnType<Page["getByRole"]>,
    opts: {
      inventoryItemId: string;
      supplierName?: string;
      unitPrice: string;
      totalPrice: string;
      lots: Array<{ quantity: string; expiresOn: string }>;
    },
  ) {
    // 재고에서 선택
    await modal.locator("select").first().selectOption(opts.inventoryItemId);

    // 구매처
    if (opts.supplierName) {
      await modal.locator('input[placeholder="마트 이름 등"]').fill(opts.supplierName);
    }

    // 단가·총액
    await modal.locator("label").filter({ hasText: "단가" }).locator("input").fill(opts.unitPrice);
    await modal.locator("label").filter({ hasText: "총액" }).locator("input").fill(opts.totalPrice);

    // 로트
    for (let i = 0; i < opts.lots.length; i++) {
      if (i > 0) await modal.locator('button:has-text("로트 추가")').click();
      const lot = modal.locator("ul li").nth(i);
      const qtyInput = lot.locator('input[type="number"]');
      await qtyInput.clear();
      await qtyInput.fill(opts.lots[i].quantity);
      await lot.locator('input[type="date"]').fill(opts.lots[i].expiresOn);
    }

    // 등록
    await modal.locator('button:has-text("등록")').click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  }

  /**
   * 구매 등록 모달에서 재고 미연결 구매를 등록한다.
   * "직접 입력" 상태로 모든 필드를 수동 입력한다.
   */
  async function registerUnlinkedPurchaseViaUI(
    page: Page,
    modal: ReturnType<Page["getByRole"]>,
    opts: {
      itemName: string;
      unitSymbol: string;
      supplierName?: string;
      unitPrice: string;
      totalPrice: string;
      lots: Array<{ quantity: string; expiresOn: string }>;
    },
  ) {
    // 직접 입력 (드롭다운 기본값)
    await modal.locator('input[placeholder="예: 우유 1L"]').fill(opts.itemName);
    const unitInput = modal.locator('input[placeholder="팩, 개, ml…"]');
    await unitInput.clear();
    await unitInput.fill(opts.unitSymbol);

    // 구매처
    if (opts.supplierName) {
      await modal.locator('input[placeholder="마트 이름 등"]').fill(opts.supplierName);
    }

    // 단가·총액
    await modal.locator("label").filter({ hasText: "단가" }).locator("input").fill(opts.unitPrice);
    await modal.locator("label").filter({ hasText: "총액" }).locator("input").fill(opts.totalPrice);

    // 로트
    for (let i = 0; i < opts.lots.length; i++) {
      if (i > 0) await modal.locator('button:has-text("로트 추가")').click();
      const lot = modal.locator("ul li").nth(i);
      const qtyInput = lot.locator('input[type="number"]');
      await qtyInput.clear();
      await qtyInput.fill(opts.lots[i].quantity);
      await lot.locator('input[type="date"]').fill(opts.lots[i].expiresOn);
    }

    // 등록
    await modal.locator('button:has-text("등록")').click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6-A. 구매 등록 (재고 연결)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("6-A-1. 사용자는 재고와 ���결하여 구매를 등록한다 (단가·구매처·유통기한 로트 포함)", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);
    const expiryDate = futureDateStr(30);

    // 구매·로트 페이지에서 구매 등록 모달을 연다
    const modal = await openPurchaseRegisterModal(page);

    // 재고 연결 구매 등록
    await registerLinkedPurchaseViaUI(page, modal, {
      inventoryItemId: ctx.inventoryItemId,
      supplierName: "이마트",
      unitPrice: "2500",
      totalPrice: "5000",
      lots: [{ quantity: "2", expiresOn: expiryDate }],
    });

    // DB 에서 구매 레코드 확인
    await expect(async () => {
      const purchases = await query<{ id: string; inventoryItemId: string | null; supplierName: string | null }>(
        `SELECT id, "inventoryItemId", "supplierName" FROM purchases WHERE "householdId" = $1`,
        [ctx.householdId],
      );
      expect(purchases).toHaveLength(1);
      expect(purchases[0].inventoryItemId).toBe(ctx.inventoryItemId);
      expect(purchases[0].supplierName).toBe("이마트");

      // 배치(로트) 확인
      const batches = await query<{ quantity: string; expirationDate: string | null }>(
        `SELECT quantity::text, "expirationDate"::text FROM purchase_batches WHERE "purchaseId" = $1`,
        [purchases[0].id],
      );
      expect(batches).toHaveLength(1);
      expect(parseFloat(batches[0].quantity)).toBe(2);
    }).toPass({ timeout: 10_000 });
  });

  test("6-A-2. 시스템은 구매 등록 시 재고 수량을 자동으로 증가시킨다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 초기 재고 수량 확인 (3)
    const beforeItems = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`,
      [ctx.inventoryItemId],
    );
    expect(parseFloat(beforeItems[0].quantity)).toBe(3);

    // 구매 등록 모달에서 재고 연결 구매 (수량 5)
    const modal = await openPurchaseRegisterModal(page);
    await registerLinkedPurchaseViaUI(page, modal, {
      inventoryItemId: ctx.inventoryItemId,
      unitPrice: "2000",
      totalPrice: "10000",
      lots: [{ quantity: "5", expiresOn: futureDateStr(14) }],
    });

    // 재고 수량이 3 + 5 = 8 으로 증가했는지 확인
    await expect(async () => {
      const afterItems = await query<{ quantity: string }>(
        `SELECT quantity::text FROM inventory_items WHERE id = $1`,
        [ctx.inventoryItemId],
      );
      expect(parseFloat(afterItems[0].quantity)).toBe(8);
    }).toPass({ timeout: 10_000 });
  });

  test("6-A-3. 시스템은 구매 등록 시 재고 변경 이력에 입고 레코드를 자동 생성한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 구매 등록 모달에서 재고 연결 구매 (수량 4)
    const modal = await openPurchaseRegisterModal(page);
    await registerLinkedPurchaseViaUI(page, modal, {
      inventoryItemId: ctx.inventoryItemId,
      unitPrice: "1500",
      totalPrice: "6000",
      lots: [{ quantity: "4", expiresOn: futureDateStr(7) }],
    });

    // 재고 변경 이력에서 입고(in) 레코드 확인
    await expect(async () => {
      const logs = await query<{
        type: string;
        quantityDelta: string;
        quantityAfter: string;
      }>(
        `SELECT type, "quantityDelta"::text, "quantityAfter"::text FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
        [ctx.inventoryItemId],
      );
      expect(logs).toHaveLength(1);
      expect(logs[0].type).toBe("in");
      expect(parseFloat(logs[0].quantityDelta)).toBe(4);
      expect(parseFloat(logs[0].quantityAfter)).toBe(7); // 3 + 4
    }).toPass({ timeout: 10_000 });
  });

  test("6-A-4. 사용자는 구매 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // DB 에 구매 2건 시드
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;
    const p1 = await seedPurchase(ctx.householdId, {
      inventoryItemId: ctx.inventoryItemId,
      unitPrice: 2500,
      purchasedAt: todayStr(),
      supplierName: "이마트",
      itemName: "우유",
      unitSymbol: "팩",
      userId,
    });
    await seedPurchaseBatch(p1, 2, futureDateStr(14));

    const p2 = await seedPurchase(ctx.householdId, {
      unitPrice: 3000,
      purchasedAt: todayStr(),
      supplierName: "홈플러스",
      itemName: "치즈",
      unitSymbol: "개",
      userId,
    });
    await seedPurchaseBatch(p2, 1, futureDateStr(30));

    // 구매·로트 페이지로 이동
    await page.goto("/purchases");
    await page.waitForLoadState("networkidle");

    // 구매 목록 테이블에서 "우유" 와 "치즈" 확인
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

    // 구매 등록 모달에서 재고 미연결 구매
    const modal = await openPurchaseRegisterModal(page);
    await registerUnlinkedPurchaseViaUI(page, modal, {
      itemName: "세제",
      unitSymbol: "개",
      supplierName: "쿠팡",
      unitPrice: "5000",
      totalPrice: "15000",
      lots: [{ quantity: "3", expiresOn: futureDateStr(365) }],
    });

    // DB 에서 재고 미연결 확인
    await expect(async () => {
      const purchases = await query<{ inventoryItemId: string | null }>(
        `SELECT "inventoryItemId" FROM purchases WHERE "householdId" = $1`,
        [ctx.householdId],
      );
      expect(purchases).toHaveLength(1);
      expect(purchases[0].inventoryItemId).toBeNull();
    }).toPass({ timeout: 10_000 });
  });

  test("6-B-6. 사용자는 구매 목록에서 재고 미연결 상태를 확인한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // DB 에 재고 미연결 구매 시드
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;
    const pId = await seedPurchase(ctx.householdId, {
      unitPrice: 5000,
      purchasedAt: todayStr(),
      supplierName: "쿠팡",
      itemName: "세제",
      unitSymbol: "개",
      userId,
    });
    await seedPurchaseBatch(pId, 3, futureDateStr(365));

    // 구매·로트 페이지로 이동
    await page.goto("/purchases");
    await page.waitForLoadState("networkidle");

    // "세제" 가 목록 테이블에 표시되는지 확인
    await expect(page.locator('td:has-text("세제")').first()).toBeVisible({ timeout: 10_000 });

    // DB 에서 재고 미연결 확인
    const purchases = await query<{ inventoryItemId: string | null; itemName: string | null }>(
      `SELECT "inventoryItemId", "itemName" FROM purchases WHERE "householdId" = $1`,
      [ctx.householdId],
    );
    const unlinked = purchases.filter((p) => p.inventoryItemId === null);
    expect(unlinked.length).toBeGreaterThanOrEqual(1);
    expect(unlinked.some((p) => p.itemName === "세제")).toBe(true);
  });

  // NOTE: 6-B-7, 6-B-8 — "재고 나중에 연결" UI 가 아직 미구현 상태이므로 API 호출 유지
  test("6-B-7. 사용자는 구매 기록에 재고를 나중에 연결한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // DB 에 재고 미연결 구매 시드
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;
    const purchaseId = await seedPurchase(ctx.householdId, {
      unitPrice: 2500,
      purchasedAt: todayStr(),
      itemName: "우유",
      unitSymbol: "팩",
      userId,
    });
    await seedPurchaseBatch(purchaseId, 3, futureDateStr(14));

    // 재고 연결 API 호출 (UI 미구현)
    const linkRes = await page.request.patch(
      `/api/households/${ctx.householdId}/purchases/${purchaseId}/link-inventory`,
      { data: { inventoryItemId: ctx.inventoryItemId } },
    );
    expect(linkRes.ok()).toBe(true);

    // DB 에서 연결 확인
    const purchases = await query<{ inventoryItemId: string | null }>(
      `SELECT "inventoryItemId" FROM purchases WHERE id = $1`,
      [purchaseId],
    );
    expect(purchases[0].inventoryItemId).toBe(ctx.inventoryItemId);
  });

  test("6-B-8. 시스템은 재고 연결 후 재고 수량을 증가시킨다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);

    // 초기 재고 수량 확인 (3)
    const before = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`,
      [ctx.inventoryItemId],
    );
    expect(parseFloat(before[0].quantity)).toBe(3);

    // DB 에 재고 미연결 구매 시드 (수량 4)
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;
    const purchaseId = await seedPurchase(ctx.householdId, {
      unitPrice: 2000,
      purchasedAt: todayStr(),
      itemName: "우유",
      unitSymbol: "팩",
      userId,
    });
    await seedPurchaseBatch(purchaseId, 4, futureDateStr(14));

    // 재고 미연결 상태에서는 수량 변동 없음
    const middle = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`,
      [ctx.inventoryItemId],
    );
    expect(parseFloat(middle[0].quantity)).toBe(3);

    // 재고 연결 API 호출 (UI 미구현)
    await page.request.patch(
      `/api/households/${ctx.householdId}/purchases/${purchaseId}/link-inventory`,
      { data: { inventoryItemId: ctx.inventoryItemId } },
    );

    // 연결 후 재고 수량 3 + 4 = 7
    const after = await query<{ quantity: string }>(
      `SELECT quantity::text FROM inventory_items WHERE id = $1`,
      [ctx.inventoryItemId],
    );
    expect(parseFloat(after[0].quantity)).toBe(7);

    // 입고 이력 레코드 확인
    const logs = await query<{ type: string; quantityDelta: string }>(
      `SELECT type, "quantityDelta"::text FROM inventory_logs WHERE "inventoryItemId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [ctx.inventoryItemId],
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

    // DB 에 구매·로트 시드
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;
    const pId = await seedPurchase(ctx.householdId, {
      inventoryItemId: ctx.inventoryItemId,
      unitPrice: 2500,
      purchasedAt: todayStr(),
      itemName: "우유",
      unitSymbol: "팩",
      userId,
    });
    await seedPurchaseBatch(pId, 2, expiryDate);

    // 구매·로트 페이지로 이동
    await page.goto("/purchases");
    await page.waitForLoadState("networkidle");

    // 유통기한이 테이블에 표시되는지 확인
    await expect(page.locator(`td:has-text("${expiryDate}")`).first()).toBeVisible({ timeout: 10_000 });

    // D-10 뱃지가 표시되는지 확인
    await expect(page.locator('td:has-text("D-10")').first()).toBeVisible({ timeout: 5_000 });
  });

  // NOTE: 6-C-10, 6-C-11 — 유통기한 임박/만료 전용 UI 가 없으므로 API 조회 유지, 사전 데이터는 DB 시드
  test("6-C-10. 사용자는 유통기한 임박 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;

    // 임박 구매 (3일 후 만료) — DB 시드
    const p1 = await seedPurchase(ctx.householdId, {
      unitPrice: 2500,
      purchasedAt: todayStr(),
      itemName: "우유",
      unitSymbol: "팩",
      userId,
    });
    await seedPurchaseBatch(p1, 1, futureDateStr(3));

    // 여유로운 구매 (60일 후 만료) — DB 시드
    const p2 = await seedPurchase(ctx.householdId, {
      unitPrice: 3000,
      purchasedAt: todayStr(),
      itemName: "치즈",
      unitSymbol: "개",
      userId,
    });
    await seedPurchaseBatch(p2, 1, futureDateStr(60));

    // 유통기한 임박 API 조회 (7일 이내) — 전용 UI 미존재
    const res = await page.request.get(
      `/api/households/${ctx.householdId}/batches/expiring?days=7`,
    );
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const batches = body.data;

    // 3일 후 만료 배치만 포함되어야 함
    expect(batches.length).toBeGreaterThanOrEqual(1);
    const expiringDates = batches.map((b: { expirationDate: string }) => b.expirationDate);
    expect(expiringDates.some((d: string) => d === futureDateStr(3))).toBe(true);
    expect(expiringDates.some((d: string) => d === futureDateStr(60))).toBe(false);
  });

  test("6-C-11. 사용자는 이미 만료된 목록을 조회한다", async ({ page }) => {
    const ctx = await setupFullPrerequisites(page);
    const userId = (await query<{ id: string }>("SELECT id FROM users LIMIT 1"))[0].id;

    // 만료된 구매 (3일 전 만료) — DB 시드
    const p1 = await seedPurchase(ctx.householdId, {
      unitPrice: 2500,
      purchasedAt: pastDateStr(10),
      itemName: "우유",
      unitSymbol: "팩",
      userId,
    });
    await seedPurchaseBatch(p1, 1, pastDateStr(3));

    // 아직 유효한 구매 (30일 후 만료) — DB 시드
    const p2 = await seedPurchase(ctx.householdId, {
      unitPrice: 3000,
      purchasedAt: todayStr(),
      itemName: "치즈",
      unitSymbol: "개",
      userId,
    });
    await seedPurchaseBatch(p2, 1, futureDateStr(30));

    // 만료 API 조회 — 전용 UI 미존재
    const res = await page.request.get(
      `/api/households/${ctx.householdId}/batches/expired`,
    );
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const batches = body.data;

    // 만료된 배치만 포함
    expect(batches.length).toBeGreaterThanOrEqual(1);
    const expiredDates = batches.map((b: { expirationDate: string }) => b.expirationDate);
    expect(expiredDates.some((d: string) => d === pastDateStr(3))).toBe(true);
    expect(expiredDates.some((d: string) => d === futureDateStr(30))).toBe(false);
  });
});
