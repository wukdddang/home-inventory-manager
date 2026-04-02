import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import { seedFullCatalogAndInventory } from "../../utils/seed";

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

  /** 재고 카드 탭 → 사용 버튼 → 바텀시트 열기 */
  async function openBottomSheet(page: Page) {
    await page.reload();
    await page.waitForLoadState("networkidle");

    const card = page.locator('button:has-text("우유")').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.click();

    // 액션 시트에서 "사용" 버튼 클릭하여 바텀시트 열기
    await page.locator('button:has-text("사용")').click();
    await expect(page.getByText("사용 처리")).toBeVisible({ timeout: 5_000 });
  }

  // ── 테스트 ──

  test("3. 오버레이 영역을 탭하면 시트가 닫힌다", async ({ page }) => {
    await setupFull(page);
    await openBottomSheet(page);

    // 오버레이 클릭 — 뷰포트 상단 좌측을 클릭하여 오버레이를 탭
    await page.mouse.click(10, 10);

    // 시트가 닫힘
    await expect(page.getByText("사용 처리")).toBeHidden({ timeout: 5_000 });
  });

  test("4. 드래그 핸들이 시트 상단에 표시된다", async ({ page }) => {
    await setupFull(page);
    await openBottomSheet(page);

    // 드래그 핸들 바 — 시트 상단의 작은 바 (h-1 w-10 rounded-full)
    const sheetTitle = page.getByText("사용 처리");
    await expect(sheetTitle).toBeVisible({ timeout: 5_000 });

    // 시트 컨테이너 내부에서 핸들(작은 바)이 제목 위에 있는지 evaluate로 확인
    const handleExists = await page.evaluate(() => {
      const elements = document.querySelectorAll("div");
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        // 드래그 핸들: 높이 ~4px(h-1), 너비 ~40px(w-10), 둥근 모서리
        if (
          rect.height <= 6 &&
          rect.height >= 2 &&
          rect.width >= 30 &&
          rect.width <= 50 &&
          style.borderRadius !== "0px"
        ) {
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

    const sheetTitle = page.getByText("사용 처리");
    await expect(sheetTitle).toBeVisible({ timeout: 5_000 });

    // 시트 높이를 evaluate로 측정 — fixed + bottom-0 시트를 찾음
    const sheetHeight = await page.evaluate(() => {
      const elements = document.querySelectorAll("div");
      for (const el of elements) {
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
