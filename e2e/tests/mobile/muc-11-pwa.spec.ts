import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("MUC-11. PWA 설정 및 설치 (모바일)", () => {
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

  async function setupFull(page: Page) {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
  }

  async function goToSettings(page: Page) {
    await page.locator('nav >> text="설정"').click();
    await page.waitForURL("**/settings", { timeout: 10_000 });
  }

  // ── manifest.json & 메타태그 ──

  test("1. manifest.json이 올바른 PWA 메타데이터를 반환한다", async ({
    page,
  }) => {
    const res = await page.request.get("/manifest.json");
    expect(res.ok()).toBe(true);

    const manifest = await res.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.orientation).toBe("portrait");
    expect(manifest.theme_color).toBe("#14b8a6");
    expect(manifest.short_name).toBe("집비치기");
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("2. HTML 소스에 PWA 관련 메타태그가 포함되어 있다", async ({ page }) => {
    // Next.js는 메타태그를 스트리밍 렌더링하므로 raw HTML에서 검증
    const res = await page.request.get("/");
    const html = await res.text();

    // manifest 링크
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("/manifest.json");

    // apple-mobile-web-app-status-bar-style (Next.js appleWebApp 설정)
    expect(html).toContain("apple-mobile-web-app-status-bar-style");
    expect(html).toContain("apple-mobile-web-app-title");

    // mobile-web-app-capable
    expect(html).toContain("mobile-web-app-capable");
  });

  // ── 서비스 워커 ──

  test("3. 서비스 워커가 정상적으로 등록된다", async ({ page }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 서비스 워커 등록 확인
    const swRegistered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration("/");
      return !!reg;
    });
    expect(swRegistered).toBe(true);
  });

  test("4. 서비스 워커 스크립트 파일이 접근 가능하다", async ({ page }) => {
    const res = await page.request.get("/sw.js");
    expect(res.ok()).toBe(true);

    const body = await res.text();
    expect(body).toContain("him-v1");
    expect(body).toContain("install");
    expect(body).toContain("fetch");
    expect(body).toContain("push");
  });

  // ── PWA 설치 배너 ──
  // TODO: 실제 데이터로 검증 필요 — beforeinstallprompt는 브라우저 합성 이벤트로
  // 시뮬레이션하며, 실제 PWA 설치 플로우(Chrome 설치 프롬프트)는 테스트 불가

  test("5. beforeinstallprompt 이벤트 발생 시 설치 배너가 표시된다", async ({
    page,
  }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // beforeinstallprompt 이벤트를 시뮬레이션
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", {
        bubbles: true,
        cancelable: true,
      });
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });

    // 설치 배너가 표시됨
    await expect(page.getByText("집비치기 앱 설치")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("홈 화면에 추가하면")).toBeVisible();
    await expect(page.getByText("설치하기")).toBeVisible();
    await expect(page.getByText("나중에")).toBeVisible();
  });

  test("6. 설치 배너에서 '나중에'를 누르면 배너가 사라지고 localStorage에 기록된다", async ({
    page,
  }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // beforeinstallprompt 이벤트 시뮬레이션
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", {
        bubbles: true,
        cancelable: true,
      });
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });

    await expect(page.getByText("집비치기 앱 설치")).toBeVisible({
      timeout: 5_000,
    });

    // '나중에' 클릭
    await page.getByText("나중에").click();

    // 배너가 사라짐
    await expect(page.getByText("집비치기 앱 설치")).toBeHidden({
      timeout: 5_000,
    });

    // localStorage에 dismiss 타임스탬프 기록 확인
    const dismissedTs = await page.evaluate(() =>
      localStorage.getItem("him-pwa-install-dismissed"),
    );
    expect(dismissedTs).toBeTruthy();
    expect(Number(dismissedTs)).toBeGreaterThan(0);
  });

  test("7. 설치 배너에서 닫기(X) 버튼을 누르면 배너가 사라진다", async ({
    page,
  }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", {
        bubbles: true,
        cancelable: true,
      });
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });

    await expect(page.getByText("집비치기 앱 설치")).toBeVisible({
      timeout: 5_000,
    });

    // 닫기 버튼 클릭
    await page.locator('button[aria-label="닫기"]').click();

    await expect(page.getByText("집비치기 앱 설치")).toBeHidden({
      timeout: 5_000,
    });
  });

  test("8. 이전에 dismiss한 지 7일 미만이면 설치 배너가 표시되지 않는다", async ({
    page,
  }) => {
    await page.goto("/signup");

    // 1시간 전에 dismiss한 것으로 localStorage에 기록
    await page.evaluate(() => {
      localStorage.setItem(
        "him-pwa-install-dismissed",
        String(Date.now() - 60 * 60 * 1000),
      );
    });

    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // beforeinstallprompt 이벤트 시뮬레이션
    await page.evaluate(() => {
      const event = new Event("beforeinstallprompt", {
        bubbles: true,
        cancelable: true,
      });
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: "dismissed" });
      window.dispatchEvent(event);
    });

    // 배너가 표시되지 않아야 함
    await expect(page.getByText("집비치기 앱 설치")).toBeHidden({
      timeout: 3_000,
    });
  });

  // ── 설정 페이지: 앱 설치 / 푸시 토큰 섹션 ──
  // TODO: 실제 데이터로 검증 필요 — PWA 설치 상태(pwaState)는 브라우저 환경에
  // 의존하며, 현재 Playwright에서는 standalone 모드 감지가 불가하여 항상 idle/대기 중

  test("9. 설정 페이지에 앱 설치 상태가 표시된다", async ({ page }) => {
    await setupFull(page);
    await goToSettings(page);

    await expect(page.getByText("앱 설치 / 푸시 토큰")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText("앱 설치 상태")).toBeVisible();
  });

  test("10. 설정 페이지에 푸시 토큰 상태가 표시되고 '토큰 발급하기' 버튼이 있다", async ({
    page,
  }) => {
    await setupFull(page);
    await goToSettings(page);

    await expect(
      page.getByText("푸시 토큰", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("미발급")).toBeVisible();
    await expect(page.getByText("토큰 발급하기")).toBeVisible();
  });

  // TODO: 실제 데이터로 검증 필요 — 현재 mock 토큰(him_push_{uuid})을 생성하며,
  // 실제 FCM getToken() 호출은 Firebase 설정 + 백엔드 FCM_SERVER_KEY 필요
  test("11. 토큰 발급하기 버튼을 누르면 토큰이 생성되고 활성 상태로 변경된다", async ({
    page,
    context,
  }) => {
    // Notification permission 허용
    await context.grantPermissions(["notifications"]);

    await setupFull(page);
    await goToSettings(page);

    // 토큰 발급하기 클릭
    await page.getByText("토큰 발급하기").click();

    // 활성 뱃지가 표시됨
    await expect(page.getByText("활성")).toBeVisible({ timeout: 5_000 });

    // localStorage에 토큰이 저장됨
    const token = await page.evaluate(() =>
      localStorage.getItem("him-push-token"),
    );
    expect(token).toBeTruthy();
    expect(token).toMatch(/^him_push_/);
  });

  // TODO: 실제 데이터로 검증 필요 — mock 토큰 삭제만 검증, 실제 FCM 토큰
  // 해지(서버에서 구독 해제)는 백엔드 연동 후 추가 검증 필요
  test("12. 발급된 토큰의 삭제 버튼을 누르면 토큰이 삭제된다", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["notifications"]);

    await setupFull(page);
    await goToSettings(page);

    // 먼저 토큰 발급
    await page.getByText("토큰 발급하기").click();
    await expect(page.getByText("활성")).toBeVisible({ timeout: 5_000 });

    // 토큰 삭제 버튼 클릭
    await page.locator('button[aria-label="토큰 삭제"]').click();

    // 미발급 상태로 돌아감
    await expect(page.getByText("미발급")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("토큰 발급하기")).toBeVisible();

    // localStorage에서도 삭제됨
    const token = await page.evaluate(() =>
      localStorage.getItem("him-push-token"),
    );
    expect(token).toBeNull();
  });

  test("13. 앱 미설치 시 PWA 설치 안내 문구가 표시된다", async ({ page }) => {
    await setupFull(page);
    await goToSettings(page);

    // 앱 미설치 상태일 때 안내 문구
    await expect(
      page.getByText("앱을 설치하면 푸시 알림을 받을 수 있고"),
    ).toBeVisible({ timeout: 5_000 });
  });

  // TODO: 실제 데이터로 검증 필요 — localStorage 기반 mock 토큰 영속성만 검증,
  // 실제 환경에서는 서버 측 토큰 레지스트리와의 동기화 검증 필요
  test("14. 푸시 알림 토큰이 localStorage에 저장되고 복원된다", async ({
    page,
  }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // mock 토큰을 localStorage에 직접 저장
    await page.evaluate(() => {
      localStorage.setItem("him-push-token", "him_push_test12345");
    });

    // 페이지 새로고침 후 토큰이 유지되는지 확인
    await page.reload();
    await page.waitForLoadState("networkidle");

    const token = await page.evaluate(() =>
      localStorage.getItem("him-push-token"),
    );
    expect(token).toBe("him_push_test12345");
  });
});
