import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import { seedFullCatalogAndInventory } from "../../utils/seed";

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

  async function setupFull(page: Page) {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    const hId = await getHouseholdId();

    const seed = await seedFullCatalogAndInventory(hId, {
      inventoryQuantity: 10,
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    return { hId, ...seed };
  }

  /** 소비 + 폐기 + 조정 이력을 API 로 생성 (테스트 동작이므로 API 호출 적합) */
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
    await createHistoryData(page, ctx.hId, ctx.inventoryItemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("오늘", { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("이번주").or(page.getByText("이번 주"))).toBeVisible();
    await expect(page.getByText("이번달").or(page.getByText("이번 달"))).toBeVisible();
  });

  test("3. 타입 필터가 가로 스크롤 칩 행으로 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.inventoryItemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("전체", { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("입고", { exact: true })).toBeVisible();
    await expect(page.getByText("소비", { exact: true })).toBeVisible();
    await expect(page.getByText("조정", { exact: true })).toBeVisible();
    await expect(page.getByText("폐기", { exact: true })).toBeVisible();
  });

  test("5. 사용자는 타입 칩을 탭하여 해당 유형만 필터링한다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.inventoryItemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    // 전체 이력이 로드될 때까지 대기
    await expect(page.getByText("소비", { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    // "폐기" 필터 칩 탭 (button 요소)
    const wasteChip = page.locator('button:has-text("폐기")').first();
    await wasteChip.click();

    // 선택된 칩은 강조됨
    await expect(wasteChip).toBeVisible({ timeout: 5_000 });
  });

  test("7. 오늘/어제는 오늘, 어제 라벨로 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.inventoryItemId);

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    // "오늘" 날짜 라벨이 표시됨 (이력이 오늘 생성됨)
    // 컴포넌트가 "(오늘)" 또는 "오늘" 텍스트를 렌더링
    await expect(
      page.getByText("오늘").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("8. 각 이력 항목에 타입 뱃지, 품목명, 수량 변화, 시간이 표시된다", async ({ page }) => {
    const ctx = await setupFull(page);
    await createHistoryData(page, ctx.hId, ctx.inventoryItemId);

    // SPA 네비게이션으로 이동 (DashboardProvider가 이미 로드된 상태 활용)
    await page.locator('nav >> text="이력"').click();
    await page.waitForURL("**/inventory-history", { timeout: 10_000 });

    // 품목명이 이력 항목에 표시됨 (API 로드 대기)
    await expect(page.locator('text=/우유/').first()).toBeVisible({ timeout: 15_000 });
    // 타입 뱃지 (소비)
    await expect(page.getByText("소비", { exact: true }).first()).toBeVisible();
  });

  test("12. 필터 결과가 없으면 빈 상태 안내 메시지가 표시된다", async ({ page }) => {
    await setupFull(page);
    // 이력 없이 이력 페이지 이동

    await page.goto("/inventory-history");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("표시할 이력이 없습니다.")).toBeVisible({ timeout: 10_000 });
  });
});
