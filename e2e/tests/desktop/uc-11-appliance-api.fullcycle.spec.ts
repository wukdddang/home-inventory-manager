import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import {
  seedAppliance,
  seedMaintenanceSchedule,
  seedMaintenanceLog,
  seedFullCatalogAndInventory,
} from "../../utils/seed";

/**
 * UC-11. 가전/설비 등록 및 관리 (풀사이클)
 *
 * 프론트엔드 → Next.js API Route → NestJS 백엔드 → PostgreSQL
 * 전체 사이클을 검증한다.
 */

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-11. 가전/설비 등록 및 관리 (풀사이클)", () => {
  let householdId: string;
  let userId: string;
  let roomId: string;

  test.beforeEach(async ({ page }) => {
    await resetDatabase();
    await clearAllMails();
    await signupAndWait(page);
    await createHousehold(page, "우리 집");
    householdId = await getHouseholdId();
    userId = await getUserId();
    const seed = await seedFullCatalogAndInventory(householdId);
    roomId = seed.roomId;
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
    await expect(page.locator('button:has-text("완료")')).toBeVisible({
      timeout: 5_000,
    });
    await page.locator('button:has-text("완료")').click();
    await expect(modal).toBeHidden({ timeout: 5_000 });
  }

  async function getHouseholdId(): Promise<string> {
    return (
      await query<{ id: string }>("SELECT id FROM households LIMIT 1")
    )[0].id;
  }

  async function getUserId(): Promise<string> {
    return (
      await query<{ id: string }>(
        "SELECT id FROM users WHERE email = $1",
        [TEST_USER.email],
      )
    )[0].id;
  }

  async function goToAppliances(page: Page) {
    await page.goto("/appliances");
    await page.waitForLoadState("networkidle");
    // 로딩 완료 대기
    await page.waitForTimeout(1_000);
  }

  function todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  function futureDateStr(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11-A. 가전 등록 및 CRUD (API 연동)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("11-A-1. 사용자는 UI에서 가전을 등록하고 DB에 저장됨을 확인한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    // 가전 등록 버튼 클릭
    await page.locator('[data-testid="add-appliance-btn"]').click();
    await expect(
      page.locator('[data-testid="appliance-register-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 폼 입력
    await page
      .locator('[data-testid="appliance-name-input"]')
      .fill("드럼세탁기");
    await page
      .locator('[data-testid="appliance-brand-input"]')
      .fill("LG");
    await page
      .locator('[data-testid="appliance-model-input"]')
      .fill("FX24KN");

    // 등록
    await page.locator('[data-testid="appliance-register-submit"]').click();

    // UI에서 확인
    await expect(
      page
        .locator('[data-testid="appliance-list"]')
        .locator('text="드럼세탁기"'),
    ).toBeVisible({ timeout: 10_000 });

    // DB에서 확인
    const rows = await query<{ name: string; brand: string; status: string }>(
      `SELECT name, brand, status FROM appliances WHERE "householdId" = $1`,
      [householdId],
    );
    expect(rows.some((r) => r.name === "드럼세탁기")).toBe(true);
    const washer = rows.find((r) => r.name === "드럼세탁기")!;
    expect(washer.brand).toBe("LG");
    expect(washer.status).toBe("active");
  });

  test("11-A-2. 사용자는 DB에 시드된 가전 목록을 UI에서 조회한다", async ({
    page,
  }) => {
    // DB에 가전 시드
    await seedAppliance(householdId, userId, {
      name: "세탁기",
      brand: "LG",
      status: "active",
    });
    await seedAppliance(householdId, userId, {
      name: "에어컨",
      brand: "삼성",
      status: "retired",
    });

    await goToAppliances(page);

    // 기본 필터(활성)에서 세탁기만 보여야 함
    const list = page.locator('[data-testid="appliance-list"]');
    await expect(list).toBeVisible({ timeout: 10_000 });
    await expect(list.locator('text="세탁기"')).toBeVisible({ timeout: 5_000 });
    // 폐기된 에어컨은 기본 필터에서 안 보임
    await expect(list.locator('text="에어컨"')).toBeHidden();
  });

  test("11-A-3. 사용자는 필터를 전환하여 폐기된 가전도 조회한다", async ({
    page,
  }) => {
    await seedAppliance(householdId, userId, {
      name: "세탁기",
      status: "active",
    });
    await seedAppliance(householdId, userId, {
      name: "에어컨",
      status: "retired",
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    // "전체" 필터
    await page.locator('[data-testid="filter-all"]').click();
    await expect(
      page
        .locator('[data-testid="appliance-list"]')
        .locator('text="에어컨"'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page
        .locator('[data-testid="appliance-list"]')
        .locator('text="세탁기"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-A-4. 사용자는 가전 상세를 조회하고 등록 정보를 확인한다", async ({
    page,
  }) => {
    await seedAppliance(householdId, userId, {
      name: "드럼세탁기",
      brand: "LG",
      modelName: "FX24KN",
      warrantyExpiresAt: futureDateStr(365),
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    // 카드 클릭 → 상세
    await page.locator('text="드럼세탁기"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="detail-name"]')).toHaveText(
      "드럼세탁기",
    );
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText(
      "활성",
    );
    await expect(
      page.locator('[data-testid="detail-warranty"]'),
    ).toBeVisible();
  });

  test("11-A-5. 사용자는 가전 정보를 수정하고 DB에 반영됨을 확인한다", async ({
    page,
  }) => {
    const appId = await seedAppliance(householdId, userId, {
      name: "세탁기",
      brand: "LG",
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('text="세탁기"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 수정 버튼
    await page.locator('[data-testid="edit-btn"]').click();
    await expect(
      page.locator('[data-testid="appliance-edit-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    await page
      .locator('[data-testid="edit-name-input"]')
      .fill("건조기");
    await page.locator('[data-testid="edit-submit"]').click();

    // UI 반영 확인
    await expect(page.locator('[data-testid="detail-name"]')).toHaveText(
      "건조기",
      { timeout: 5_000 },
    );

    // DB 반영 확인
    const rows = await query<{ name: string }>(
      `SELECT name FROM appliances WHERE id = $1`,
      [appId],
    );
    expect(rows[0].name).toBe("건조기");
  });

  test("11-A-6. 사용자는 가전을 폐기하고 DB 상태가 retired로 변경됨을 확인한다", async ({
    page,
  }) => {
    const appId = await seedAppliance(householdId, userId, {
      name: "공기청정기",
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    // 폐기 버튼 (hover)
    const card = page.locator(`[data-testid="appliance-card-${appId}"]`);
    await card.hover();
    await page.locator(`[data-testid="dispose-btn-${appId}"]`).click();

    // "전체" 필터에서 폐기 뱃지 확인
    await page.locator('[data-testid="filter-all"]').click();
    await expect(
      page
        .locator(`[data-testid="appliance-card-${appId}"]`)
        .locator('[data-testid="disposed-badge"]'),
    ).toBeVisible({ timeout: 5_000 });

    // DB 확인
    const rows = await query<{ status: string }>(
      `SELECT status FROM appliances WHERE id = $1`,
      [appId],
    );
    expect(rows[0].status).toBe("retired");
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11-B. 유지보수 스케줄 (API 연동)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("11-B-7. 사용자는 UI에서 유지보수 스케줄을 등록하고 DB에 저장됨을 확인한다", async ({
    page,
  }) => {
    const appId = await seedAppliance(householdId, userId, {
      name: "세탁기",
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('text="세탁기"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 스케줄 추가
    await page.locator('[data-testid="add-schedule-btn"]').click();
    await expect(
      page.locator('[data-testid="schedule-add-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    await page
      .locator('[data-testid="schedule-task-input"]')
      .fill("통세척");
    await page
      .locator('[data-testid="schedule-rule-select"]')
      .selectOption("quarterly");
    await page.locator('[data-testid="schedule-add-submit"]').click();

    // UI 확인
    await expect(
      page
        .locator('[data-testid="schedule-list"]')
        .locator('text="통세척"'),
    ).toBeVisible({ timeout: 10_000 });

    // DB 확인
    const rows = await query<{ taskName: string; isActive: boolean }>(
      `SELECT "taskName", "isActive" FROM maintenance_schedules WHERE "applianceId" = $1`,
      [appId],
    );
    expect(rows.some((r) => r.taskName === "통세척")).toBe(true);
    expect(rows.find((r) => r.taskName === "통세척")!.isActive).toBe(true);
  });

  test("11-B-8. DB 시드된 스케줄이 UI에 표시된다", async ({ page }) => {
    const appId = await seedAppliance(householdId, userId, {
      name: "세탁기",
    });
    await seedMaintenanceSchedule(appId, {
      taskName: "필터 청소",
      nextOccurrenceAt: futureDateStr(30),
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('text="세탁기"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      page.locator('[data-testid="schedule-list"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page
        .locator('[data-testid="schedule-list"]')
        .locator('text="필터 청소"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11-C. 유지보수 이력 (API 연동)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("11-C-12. 사용자는 UI에서 유지보수 이력을 기록하고 DB에 저장됨을 확인한다", async ({
    page,
  }) => {
    const appId = await seedAppliance(householdId, userId, {
      name: "세탁기",
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('text="세탁기"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 이력 기록
    await page.locator('[data-testid="add-log-btn"]').click();
    await expect(
      page.locator('[data-testid="log-add-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    await page
      .locator('[data-testid="log-type-select"]')
      .selectOption("repair");
    await page
      .locator('[data-testid="log-desc-input"]')
      .fill("모터 교체");
    await page
      .locator('[data-testid="log-provider-input"]')
      .fill("LG 서비스");
    await page.locator('[data-testid="log-cost-input"]').fill("150000");
    await page.locator('[data-testid="log-add-submit"]').click();

    // UI 확인
    await expect(
      page
        .locator('[data-testid="log-list"]')
        .locator('text="모터 교체"'),
    ).toBeVisible({ timeout: 10_000 });

    // DB 확인
    const rows = await query<{
      type: string;
      description: string;
      servicedBy: string;
    }>(
      `SELECT type, description, "servicedBy" FROM maintenance_logs WHERE "applianceId" = $1`,
      [appId],
    );
    expect(rows.some((r) => r.description === "모터 교체")).toBe(true);
    const log = rows.find((r) => r.description === "모터 교체")!;
    expect(log.type).toBe("repair");
    expect(log.servicedBy).toBe("LG 서비스");
  });

  test("11-C-16. DB 시드된 이력이 UI에 시간순으로 표시된다", async ({
    page,
  }) => {
    const appId = await seedAppliance(householdId, userId, {
      name: "냉장고",
    });
    await seedMaintenanceLog(appId, {
      type: "repair",
      description: "냉각 불량 수리",
      performedAt: todayStr(),
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('text="냉장고"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });

    const logList = page.locator('[data-testid="log-list"]');
    await expect(logList).toBeVisible({ timeout: 5_000 });
    await expect(logList.locator('text="냉각 불량 수리"')).toBeVisible();
  });

  test("11-C-17. 사용자는 유형 필터로 이력을 조회한다", async ({ page }) => {
    const appId = await seedAppliance(householdId, userId, {
      name: "냉장고",
    });
    await seedMaintenanceLog(appId, {
      type: "repair",
      description: "수리 기록",
      performedAt: todayStr(),
    });
    await seedMaintenanceLog(appId, {
      type: "inspection",
      description: "점검 기록",
      performedAt: todayStr(),
    });

    await goToAppliances(page);
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 10_000 });

    await page.locator('text="냉장고"').click();
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });

    // "수리" 필터
    await page.locator('[data-testid="log-filter-repair"]').click();
    await expect(
      page
        .locator('[data-testid="log-list"]')
        .locator('text="수리 기록"'),
    ).toBeVisible({ timeout: 5_000 });

    // "점검" 필터
    await page.locator('[data-testid="log-filter-inspection"]').click();
    await expect(
      page
        .locator('[data-testid="log-list"]')
        .locator('text="점검 기록"'),
    ).toBeVisible({ timeout: 5_000 });
  });
});
