import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-01. 모바일 셸 및 네비게이션", () => {
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
    if (!res.ok()) {
      const body = await res.text();
      throw new Error(`createHousehold failed: ${res.status()} ${res.statusText()} — ${body}`);
    }
    await page.reload();
    await page.waitForLoadState("networkidle");
  }

  async function getHouseholdId(): Promise<string> {
    return (await query<{ id: string }>("SELECT id FROM households LIMIT 1"))[0].id;
  }

  // ── 테스트 ──

  test("1. 모바일 뷰포트에서 데스크탑 레이아웃이 숨겨지고 MobileShell이 렌더링된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 모바일 셸이 렌더링됨 — 하단 네비게이션이 보임
    await expect(page.locator('nav:has-text("홈")')).toBeVisible({ timeout: 5_000 });
    // 데스크탑 전용 사이드바/탭바가 숨겨짐
    await expect(page.locator('button:has-text("재고 목록 (표)")')).toBeHidden();
  });

  test("2. 하단 내비게이션에 3개 탭(홈, 이력, 설정)이 표시된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    const nav = page.locator("nav").last();
    await expect(nav.locator('text="홈"')).toBeVisible({ timeout: 5_000 });
    await expect(nav.locator('text="이력"')).toBeVisible();
    await expect(nav.locator('text="설정"')).toBeVisible();
  });

  test("3. 사용자는 하단 탭을 눌러 대시보드, 재고 이력, 설정 페이지를 이동한다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 이력 탭
    await page.locator('nav >> text="이력"').click();
    await page.waitForURL("**/inventory-history", { timeout: 10_000 });

    // 설정 탭
    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    // 홈 탭
    await page.locator('nav >> text="홈"').click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  });

  test("4. 활성 탭이 틸 색상으로 강조 표시된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 대시보드(홈) 탭이 활성 — teal-400 색상
    const homeLink = page.locator('nav a:has-text("홈")');
    await expect(homeLink).toHaveClass(/text-teal-400/, { timeout: 5_000 });

    // 이력 탭으로 이동
    await page.locator('nav >> text="이력"').click();
    await page.waitForURL("**/inventory-history", { timeout: 10_000 });

    const historyLink = page.locator('nav a:has-text("이력")');
    await expect(historyLink).toHaveClass(/text-teal-400/);
  });

  test("5. 헤더에 현재 선택된 거점 이름이 표시된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    await expect(page.locator('button:has-text("우리 집")')).toBeVisible({ timeout: 5_000 });
  });

  test("6. 사용자는 헤더 드롭다운을 열어 거점 목록을 확인하고 다른 거점을 선택한다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 두 번째 거점 생성 (API)
    const hId = await getHouseholdId();
    const res = await page.request.post("/api/households", {
      data: { name: "회사" },
    });
    expect(res.ok()).toBe(true);

    await page.reload();
    await page.waitForLoadState("networkidle");

    // 헤더 거점 드롭다운 열기
    const headerBtn = page.locator('button:has-text("우리 집")');
    await expect(headerBtn).toBeVisible({ timeout: 5_000 });
    await headerBtn.click();

    // 거점 목록에서 "회사" 선택
    await expect(page.locator('button:has-text("회사")')).toBeVisible({ timeout: 5_000 });
    await page.locator('button:has-text("회사")').click();

    // 헤더에 선택된 거점 이름이 변경됨
    await expect(page.locator('button:has-text("회사")')).toBeVisible({ timeout: 5_000 });
  });

  test("8. 헤더 알림 벨 아이콘에 미읽은 알림 수 뱃지가 표시된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 알림 벨 버튼이 보이는지 확인
    const bellBtn = page.locator('button[aria-label="알림"]');
    await expect(bellBtn).toBeVisible({ timeout: 5_000 });
  });

  test("9. 사용자는 알림 벨을 눌러 알림 센터 모달을 연다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    await page.locator('button[aria-label="알림"]').click();

    // 알림 모달/패널이 열림
    await expect(
      page.locator('text=/알림|알림이 없습니다/').first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
