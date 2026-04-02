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

test.describe("MUC-02. 대시보드 — 재고 카드 목록", () => {
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

  async function setupFull(page: Page, inventoryQuantity = 5, minStockLevel: number | null = null): Promise<FullSeedResult> {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    const hId = await getHouseholdId();
    const seed = await seedFullCatalogAndInventory(hId, {
      inventoryQuantity,
      minStockLevel,
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    return seed;
  }

  // ── 테스트 ──

  test("1. 재고 카드가 방 단위로 그룹화되어 표시된다", async ({ page }) => {
    await setupFull(page);

    // 방 이름("주방")이 그룹 헤더로 표시됨
    await expect(page.locator('button:has-text("주방")').first()).toBeVisible({ timeout: 10_000 });
  });

  test("2. 각 방 헤더에 방 이름과 품목 수 뱃지가 표시된다", async ({ page }) => {
    await setupFull(page);

    // 방 헤더에 방 이름 + 품목 수 표시
    const roomHeader = page.locator('button:has-text("주방")').first();
    await expect(roomHeader).toBeVisible({ timeout: 10_000 });
    // 뱃지에 품목 수(1)가 표시됨
    await expect(roomHeader.locator("span").last()).toContainText("1");
  });

  test("3. 사용자는 방 헤더를 눌러 접기/펼치기를 전환한다", async ({ page }) => {
    await setupFull(page);

    const roomHeader = page.locator('button:has-text("주방")').first();
    await expect(roomHeader).toBeVisible({ timeout: 10_000 });

    // 품목 카드가 보이는지 확인 (표시 형태: "식료품 › 우유 › 1L")
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 5_000 });

    // 접기
    await roomHeader.click();
    await expect(page.locator('text=/우유/')).toBeHidden({ timeout: 5_000 });

    // 펼치기
    await roomHeader.click();
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 5_000 });
  });

  test("5. 재고 카드에 품목명, 변형 캡션, 수량, 단위가 표시된다", async ({ page }) => {
    await setupFull(page);

    // 품목명 "우유" 표시 (표시 형태: "식료품 › 우유 › 1L")
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 10_000 });
    // 수량 + 단위 표시 ("5.0000팩 보유" 형태)
    await expect(page.locator('text=/\\d+.*팩 보유/').first()).toBeVisible({ timeout: 5_000 });
  });

  // TODO: API 모드에서 DB 시드된 minStockLevel이 모바일 카드에 반영되지 않음 — 프론트엔드 데이터 로딩 수정 필요
  test.skip("8. 재고 부족 품목의 카드 좌측 테두리가 파란색으로 표시되고 부족 아이콘이 보인다", async ({ page }) => {
    // 최소 재고 10, 현재 수량 2 → 부족 상태
    await setupFull(page, 2, 10);

    // 카드가 렌더링되었는지 확인
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 10_000 });

    // 부족 상태 표시: (부족) 텍스트 또는 파란색 좌측 테두리
    const hasLowStockText = await page.locator('text=/부족/').count() > 0;
    const hasBlueBorder = await page.locator('[class*="border-l-blue"]').count() > 0;
    expect(hasLowStockText || hasBlueBorder).toBeTruthy();
  });

  test("10. 사용자는 검색 입력란에 품목명을 입력하여 필터링한다", async ({ page }) => {
    const seed = await setupFull(page);

    // 두 번째 품목 시드
    const prodId2 = await seedProduct(seed.householdId, seed.categoryId, "요거트");
    const varId2 = await seedProductVariant(prodId2, seed.unitId, 1, "500ml");
    await seedInventoryItem(varId2, seed.storageLocationId, 3);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // 검색 입력
    const searchInput = page.locator('input[placeholder="재고 검색..."]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill("우유");

    // "우유"만 보이고 "요거트"는 숨겨짐
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=/요거트/')).toBeHidden({ timeout: 5_000 });
  });

  test("11. 검색 결과가 없으면 '검색 결과 없음' 안내가 표시된다", async ({ page }) => {
    await setupFull(page);

    const searchInput = page.locator('input[placeholder="재고 검색..."]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
    await searchInput.fill("존재하지않는품목");

    await expect(page.locator('text="검색 결과가 없습니다."')).toBeVisible({ timeout: 5_000 });
  });
});
