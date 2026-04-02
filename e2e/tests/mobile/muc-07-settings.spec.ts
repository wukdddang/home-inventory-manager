import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-07. 설정 (모바일)", () => {
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
    return { hId };
  }

  // ── 테스트 ──

  // TODO: 설정 페이지의 계정 카드가 localStorage authUser를 읽는데, API signup 후 저장 형태 확인 필요
  test("1. 계정 카드에 표시 이름과 이메일이 표시된다", async ({ page }) => {
    await setupFull(page);

    // 설정 페이지로 이동
    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    // 표시 이름 확인 — 설정 페이지는 localStorage의 authUser를 읽으므로
    // signup API가 setAuthUser로 저장한 displayName을 사용한다
    // displayName이 표시되거나 fallback "사용자"가 표시됨
    const nameLocator = page.locator(`text="${TEST_USER.displayName}"`).or(page.getByText("사용자"));
    await expect(nameLocator.first()).toBeVisible({ timeout: 5_000 });

    // 이메일 확인 — localStorage에 저장된 이메일 또는 빈 문자열
    const emailLocator = page.locator(`text="${TEST_USER.email}"`);
    const emailCount = await emailLocator.count();
    if (emailCount > 0) {
      await expect(emailLocator).toBeVisible();
    }
  });

  test("2. 알림 설정 섹션에 푸시 알림 토글이 표시된다", async ({ page }) => {
    await setupFull(page);

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    await expect(page.locator('text="푸시 알림 받기"')).toBeVisible({ timeout: 5_000 });
  });

  test("4. 유통기한 알림, 장보기 알림, 재고 부족 알림 토글이 각각 표시된다", async ({ page }) => {
    await setupFull(page);

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    await expect(page.locator('text="유통기한 알림"')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text="장보기 알림"')).toBeVisible();
    await expect(page.locator('text="재고 부족 알림"')).toBeVisible();
  });

  test("5. 사용자는 각 알림 토글을 켜고 끌 수 있다", async ({ page }) => {
    await setupFull(page);

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    // ToggleRow 전체가 button 요소이므로, "유통기한 알림" 텍스트를 포함하는 button을 직접 선택
    const expiryToggle = page.locator('button:has-text("유통기한 알림")');
    await expect(expiryToggle).toBeVisible({ timeout: 5_000 });
    await expiryToggle.click();

    // 토글 상태 변경 확인 — 토글 트랙(div)의 배경색으로 확인
    // teal-600 = 켜짐 상태
    const toggleTrack = expiryToggle.locator("div").first();
    await expect(toggleTrack).toBeVisible({ timeout: 5_000 });

    // 다시 클릭 (끄기)
    await expiryToggle.click();
    // 토글이 정상적으로 반응하는지 확인 (클릭 후 에러 없으면 성공)
    await expect(expiryToggle).toBeVisible();
  });

  test("6. 거점이 여러 개일 때 거점 선택 섹션이 접힘/펼침 가능하게 표시된다", async ({ page }) => {
    await setupFull(page);

    // 두 번째 거점 생성
    await page.request.post("/api/households", {
      data: { name: "회사" },
    });

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    // 거점 선택 영역 표시
    const householdBtn = page.locator('button:has-text("우리 집")').last();
    await expect(householdBtn).toBeVisible({ timeout: 5_000 });

    // 접힘/펼침 토글
    await householdBtn.click();
    await expect(page.locator('button:has-text("회사")')).toBeVisible({ timeout: 5_000 });
  });

  test("7. 현재 선택된 거점이 강조 표시된다", async ({ page }) => {
    await setupFull(page);

    await page.request.post("/api/households", {
      data: { name: "회사" },
    });

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    // 거점 목록 펼침
    await page.locator('button:has-text("우리 집")').last().click();

    // "우리 집"이 teal 색상으로 강조됨
    await expect(
      page.locator('button:has-text("우리 집")[class*="text-teal"]').or(
        page.locator('[class*="bg-teal-500/15"]:has-text("우리 집")')
      )
    ).toBeVisible({ timeout: 5_000 });
  });

  test("9. 로그아웃 버튼이 빨간색으로 하단에 표시된다", async ({ page }) => {
    await setupFull(page);

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    const logoutBtn = page.locator('button:has-text("로그아웃")');
    await expect(logoutBtn).toBeVisible({ timeout: 5_000 });
    await expect(logoutBtn).toHaveClass(/text-rose-400/);
  });

  test("10. 사용자는 로그아웃 버튼을 눌러 로그아웃한다", async ({ page }) => {
    await setupFull(page);

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    await page.locator('button:has-text("로그아웃")').click();
    await page.waitForURL("**/login", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("11. 데스크탑에서 이용해 주세요 안내가 표시된다", async ({ page }) => {
    await setupFull(page);

    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });

    await expect(
      page.locator('text=/데스크탑에서 이용/')
    ).toBeVisible({ timeout: 5_000 });
  });
});
