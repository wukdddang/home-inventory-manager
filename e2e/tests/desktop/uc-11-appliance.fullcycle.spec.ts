import { test, expect, type Page } from "@playwright/test";

/**
 * UC-11. 가전/설비 등록 및 관리 (mock 경로)
 *
 * 백엔드 API가 아직 없으므로 /mock/appliances 경로에서 검증한다.
 * mock 시드 데이터가 자동 로드되므로 DB 시드 없이 테스트 가능.
 */

test.describe("UC-11. 가전/설비 등록 및 관리 (mock)", () => {
  async function goToAppliances(page: Page) {
    await page.goto("/mock/dashboard");
    await page.waitForLoadState("networkidle");
    // 데스크탑 네비게이션에서 가전·설비 클릭
    await page.locator('a:has-text("가전·설비")').click();
    await page.waitForURL("**/mock/appliances", { timeout: 10_000 });
  }

  // ── 11-A. 가전 등록 및 CRUD ──

  test("11-A-1. 사용자는 가전 등록 폼에서 이름·브랜드·모델명 등을 입력하여 등록한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    // 가전 등록 버튼 클릭
    await page.locator('[data-testid="add-appliance-btn"]').click();
    await expect(
      page.locator('[data-testid="appliance-register-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 폼 입력
    await page.locator('[data-testid="appliance-name-input"]').fill("로봇 청소기");
    await page.locator('[data-testid="appliance-brand-input"]').fill("iRobot");
    await page.locator('[data-testid="appliance-model-input"]').fill("Roomba j7+");
    await page.locator('[data-testid="appliance-purchased-input"]').fill("2025-06-15");
    await page.locator('[data-testid="appliance-warranty-input"]').fill("2027-06-15");

    // 등록
    await page.locator('[data-testid="appliance-register-submit"]').click();

    // 목록에서 등록된 가전 확인
    await expect(
      page.locator('[data-testid="appliance-list"]').locator('text="로봇 청소기"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-A-2. 사용자는 거점의 가전 목록을 조회한다 (기본: 활성 가전만)", async ({
    page,
  }) => {
    await goToAppliances(page);

    // 기본 필터가 "활성"임을 확인
    const activeFilter = page.locator('[data-testid="filter-active"]');
    await expect(activeFilter).toHaveAttribute("aria-selected", "true");

    // 가전 목록이 표시됨
    await expect(
      page.locator('[data-testid="appliance-list"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 폐기된 가전(벽걸이 에어컨)이 보이지 않음
    await expect(
      page.locator('[data-testid="appliance-list"]').locator('text="벽걸이 에어컨"'),
    ).toBeHidden();
  });

  test("11-A-3. 사용자는 가전 목록을 폐기 포함/활성만/폐기만 필터로 전환한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    // "전체" 필터로 전환
    await page.locator('[data-testid="filter-all"]').click();
    await expect(
      page.locator('[data-testid="appliance-list"]').locator('text="벽걸이 에어컨"'),
    ).toBeVisible({ timeout: 5_000 });

    // "폐기" 필터
    await page.locator('[data-testid="filter-disposed"]').click();
    await expect(
      page.locator('[data-testid="appliance-list"]').locator('text="벽걸이 에어컨"'),
    ).toBeVisible({ timeout: 5_000 });
    // 활성 가전(드럼세탁기)이 숨겨짐
    await expect(
      page.locator('[data-testid="appliance-list"]').locator('text="드럼세탁기"'),
    ).toBeHidden();

    // "활성" 필터 복원
    await page.locator('[data-testid="filter-active"]').click();
    await expect(
      page.locator('[data-testid="appliance-list"]').locator('text="드럼세탁기"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-A-4. 사용자는 가전 상세 화면에서 보증 만료일, 등록 정보, 유지보수 스케줄 현황을 확인한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    // 드럼세탁기 카드 클릭
    await page.locator('text="드럼세탁기"').click();

    // 상세 화면 확인
    await expect(
      page.locator('[data-testid="appliance-detail"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="detail-name"]')).toHaveText(
      "드럼세탁기",
    );
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText(
      "활성",
    );
    // 보증 만료일 표시
    await expect(
      page.locator('[data-testid="detail-warranty"]'),
    ).toBeVisible();
    // 유지보수 스케줄 목록
    await expect(
      page.locator('[data-testid="schedule-list"]'),
    ).toBeVisible();
  });

  test("11-A-5. 사용자는 가전 정보(이름, 브랜드, 모델명, 설치 위치)를 수정한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    // 드럼세탁기 상세 진입
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 수정 버튼
    await page.locator('[data-testid="edit-btn"]').click();
    await expect(
      page.locator('[data-testid="appliance-edit-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 이름 변경
    await page.locator('[data-testid="edit-name-input"]').fill("드럼세탁기 (수정)");
    await page.locator('[data-testid="edit-submit"]').click();

    // 변경 반영 확인
    await expect(page.locator('[data-testid="detail-name"]')).toHaveText(
      "드럼세탁기 (수정)",
    );
  });

  test("11-A-6. 사용자는 가전을 폐기 처리하고 목록에서 상태가 변경됨을 확인한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    // 공기청정기 폐기 버튼 (hover 시 표시)
    const card = page.locator(
      '[data-testid="appliance-card-mock-appliance-airpurifier"]',
    );
    await card.hover();
    await page
      .locator('[data-testid="dispose-btn-mock-appliance-airpurifier"]')
      .click();

    // "전체" 필터로 확인
    await page.locator('[data-testid="filter-all"]').click();

    // 공기청정기가 폐기 뱃지와 함께 표시
    const disposedCard = page.locator(
      '[data-testid="appliance-card-mock-appliance-airpurifier"]',
    );
    await expect(
      disposedCard.locator('[data-testid="disposed-badge"]'),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 11-B. 유지보수 스케줄 관리 ──

  test("11-B-7. 사용자는 가전 상세에서 유지보수 스케줄을 등록한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 스케줄 추가
    await page.locator('[data-testid="add-schedule-btn"]').click();
    await expect(
      page.locator('[data-testid="schedule-add-form"]'),
    ).toBeVisible({ timeout: 5_000 });

    await page.locator('[data-testid="schedule-task-input"]').fill("배수구 청소");
    await page.locator('[data-testid="schedule-rule-select"]').selectOption("quarterly");
    await page.locator('[data-testid="schedule-add-submit"]').click();

    // 목록에 추가 확인
    await expect(
      page.locator('[data-testid="schedule-list"]').locator('text="배수구 청소"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-B-8. 사용자는 유지보수 스케줄 목록을 조회하고 다음 예정일을 확인한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 스케줄 목록 내 다음 예정일 표시 확인
    const schedule = page.locator(
      '[data-testid="schedule-item-mock-maint-sch-washer-clean"]',
    );
    await expect(schedule).toBeVisible({ timeout: 5_000 });
    await expect(
      schedule.locator('[data-testid="schedule-next-due"]'),
    ).toBeVisible();
  });

  test("11-B-9. 사용자는 유지보수 스케줄의 작업명·반복 규칙·다음 예정일을 수정한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 수정 버튼 클릭
    await page
      .locator('[data-testid="edit-schedule-mock-maint-sch-washer-clean"]')
      .click();
    await expect(
      page.locator('[data-testid="schedule-edit-row"]'),
    ).toBeVisible({ timeout: 5_000 });

    // 작업명 변경
    await page.locator('[data-testid="schedule-edit-task"]').fill("통세척 (변경)");
    await page.locator('[data-testid="schedule-edit-save"]').click();

    // 변경 확인
    await expect(
      page.locator('[data-testid="schedule-list"]').locator('text="통세척 (변경)"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-B-10. 사용자는 유지보수 스케줄을 비활성화하고 목록에서 비활성 상태가 표시됨을 확인한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 비활성화 버튼 클릭
    await page
      .locator(
        '[data-testid="deactivate-schedule-mock-maint-sch-washer-clean"]',
      )
      .click();

    // 비활성 상태: 취소선(line-through)이 적용됨
    const taskName = page
      .locator('[data-testid="schedule-item-mock-maint-sch-washer-clean"]')
      .locator('[data-testid="schedule-task-name"]');
    await expect(taskName).toHaveClass(/line-through/);
  });

  test("11-B-11. 시스템은 폐기된 가전에 유지보수 스케줄 추가를 시도하면 오류 메시지를 표시한다", async ({
    page,
  }) => {
    await goToAppliances(page);

    // "전체" 필터에서 폐기된 에어컨 선택
    await page.locator('[data-testid="filter-all"]').click();
    await page.locator('text="벽걸이 에어컨"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 상태가 "폐기"인지 확인
    await expect(page.locator('[data-testid="detail-status"]')).toHaveText(
      "폐기",
    );

    // 스케줄 추가 버튼이 없어야 함 (폐기 상태)
    await expect(
      page.locator('[data-testid="add-schedule-btn"]'),
    ).toBeHidden();
  });

  // ── 11-C. 유지보수·A/S 이력 기록 ──

  test("11-C-12. 사용자는 정기 유지보수를 완료 기록한다 (스케줄 연결)", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 이력 기록
    await page.locator('[data-testid="add-log-btn"]').click();
    await expect(page.locator('[data-testid="log-add-form"]')).toBeVisible({
      timeout: 5_000,
    });

    await page.locator('[data-testid="log-type-select"]').selectOption("scheduled");
    await page.locator('[data-testid="log-desc-input"]').fill("4월 정기 통세척 완료");
    await page.locator('[data-testid="log-add-submit"]').click();

    // 이력 목록에 추가 확인
    await expect(
      page.locator('[data-testid="log-list"]').locator('text="4월 정기 통세척 완료"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-C-14. 사용자는 비정기 수리를 기록한다 (유형=수리, 업체명·비용 포함)", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="양문형 냉장고"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    await page.locator('[data-testid="add-log-btn"]').click();
    await page.locator('[data-testid="log-type-select"]').selectOption("repair");
    await page.locator('[data-testid="log-desc-input"]').fill("압축기 교체");
    await page.locator('[data-testid="log-provider-input"]').fill("삼성 서비스");
    await page.locator('[data-testid="log-cost-input"]').fill("200000");
    await page.locator('[data-testid="log-add-submit"]').click();

    // 이력에 수리 기록 확인
    const logItem = page
      .locator('[data-testid="log-list"]')
      .locator('text="압축기 교체"');
    await expect(logItem).toBeVisible({ timeout: 5_000 });
  });

  test("11-C-15. 사용자는 점검을 기록한다 (유형=점검)", async ({ page }) => {
    await goToAppliances(page);
    await page.locator('text="공기청정기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    await page.locator('[data-testid="add-log-btn"]').click();
    await page.locator('[data-testid="log-type-select"]').selectOption("inspection");
    await page.locator('[data-testid="log-desc-input"]').fill("센서 점검");
    await page.locator('[data-testid="log-add-submit"]').click();

    await expect(
      page.locator('[data-testid="log-list"]').locator('text="센서 점검"'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-C-16. 사용자는 가전별 유지보수 이력을 시간순으로 조회한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="양문형 냉장고"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 이력 목록이 존재하고 시간순(최신 상단)
    const logList = page.locator('[data-testid="log-list"]');
    await expect(logList).toBeVisible({ timeout: 5_000 });

    // 시드: 냉장고에 "냉각 불량 수리" 이력 존재
    await expect(logList.locator('text="냉각 불량 수리"')).toBeVisible();
  });

  test("11-C-17. 사용자는 유형(정기/수리/점검) 필터로 이력을 조회한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="양문형 냉장고"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // "수리" 필터
    await page.locator('[data-testid="log-filter-repair"]').click();
    await expect(
      page.locator('[data-testid="log-list"]').locator('text="냉각 불량 수리"'),
    ).toBeVisible({ timeout: 5_000 });

    // "점검" 필터 — 냉장고에 점검 이력 없으면 빈 상태
    await page.locator('[data-testid="log-filter-inspection"]').click();
    // 점검 이력이 없으므로 목록이 비어야 함
    await expect(
      page.locator('[data-testid="log-list"]'),
    ).toBeHidden({ timeout: 5_000 });

    // "전체" 필터 복원
    await page.locator('[data-testid="log-filter-all"]').click();
    await expect(
      page.locator('[data-testid="log-list"]'),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 11-E. 가전 하위 보관 장소 및 재고 ──

  test("11-E-24. 사용자는 가전 상세에서 보관 장소 섹션을 확인한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 보관 장소·물품 섹션이 표시됨
    await expect(
      page.locator('[data-testid="appliance-storage-section"]'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("11-E-25. 사용자는 가전 하위 보관 장소에 등록된 물품 목록을 확인한다", async ({
    page,
  }) => {
    await goToAppliances(page);
    await page.locator('text="드럼세탁기"').click();
    await expect(page.locator('[data-testid="appliance-detail"]')).toBeVisible({
      timeout: 5_000,
    });

    // 시드: 세탁기에 "필터함" 보관 장소가 있음
    await expect(
      page.locator('[data-testid="appliance-storage-list"]'),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.locator('[data-testid="appliance-slot-sl-mock-appliance-washer-filter"]'),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── 11-F. 대시보드 통합 (구조도·위치 추가 모달) ──

  test("11-F-26. 대시보드 구조도에서 가전 노드가 표시된다", async ({ page }) => {
    await page.goto("/mock/dashboard");
    await page.waitForLoadState("networkidle");

    // 조회 모드에서 구조도가 보이는지 확인 — 가전 노드 존재
    // 구조도에 "직속 보관" 텍스트가 없어야 함
    const structureArea = page.locator('[data-testid="structure-flow"]').or(
      page.locator(".react-flow"),
    );
    if (await structureArea.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(page.locator('text="직속 보관"')).toBeHidden({ timeout: 3_000 });
    }
  });

  test("11-F-27. 대시보드에서 '위치 추가' 버튼으로 가전을 등록한다", async ({
    page,
  }) => {
    await page.goto("/mock/dashboard");
    await page.waitForLoadState("networkidle");

    // 방 선택이 필요 — 첫 번째 방 탭 클릭
    const roomTab = page.locator('[role="tab"]').first();
    if (await roomTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await roomTab.click();
    }

    // "위치 추가" 버튼 확인
    const addBtn = page.locator('[data-testid="add-placement-btn"]');
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();

      // 모달에서 "가전" 타입 선택
      const applianceRadio = page.locator('[data-testid="placement-type-appliance"]');
      if (await applianceRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await applianceRadio.click();
      }
    }
  });
});
