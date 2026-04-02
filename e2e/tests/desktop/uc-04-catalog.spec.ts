import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import { seedCategory, seedUnit, seedProduct, seedProductVariant } from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-04. 카탈로그 설정 (카테고리 · 단위 · 상품)", () => {
  test.beforeEach(async () => {
    await resetDatabase();
    await clearAllMails();
  });

  // ── 헬퍼 ──

  /** 회원가입 후 대시보드까지 이동 */
  async function signupAndWait(page: Page) {
    await page.goto("/signup");
    await page.locator("input#name").fill(TEST_USER.displayName);
    await page.locator("input#email").fill(TEST_USER.email);
    await page.locator("input#password").fill(TEST_USER.password);
    await page.locator("input#confirm").fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  }

  /** 거점 추가 모달을 열고 거점을 생성한 뒤, 멤버 초대 모달(step 2)을 닫는다 */
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

  /** 거점 생성 → 대시보드에서 거점이 선택된 상태까지 세팅 */
  async function setupHousehold(page: Page) {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    await expect(
      page.locator(
        'button[role="tab"][aria-selected="true"]:has-text("우리 집")'
      )
    ).toBeVisible({ timeout: 5_000 });
  }

  /** 설정 페이지로 이동하고 카탈로그 섹션이 로드될 때까지 대기 */
  async function goToSettings(page: Page) {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    // 상품 카탈로그 섹션이 보일 때까지 대기
    await expect(
      page.locator('text="상품 카탈로그"')
    ).toBeVisible({ timeout: 10_000 });
  }

  /** householdId 를 DB 에서 조회한다 */
  async function getHouseholdId(): Promise<string> {
    const rows = await query<{ id: string }>(
      "SELECT id FROM households LIMIT 1"
    );
    return rows[0].id;
  }

  /** DB seed 로 카테고리를 직접 생성한다 */
  async function createCategoryApi(
    householdId: string,
    name: string
  ): Promise<string> {
    return seedCategory(householdId, name);
  }

  /** DB seed 로 단위를 직접 생성한다 */
  async function createUnitApi(
    householdId: string,
    symbol: string,
    name?: string
  ): Promise<string> {
    return seedUnit(householdId, symbol, name ?? null);
  }

  /** DB seed 로 품목을 직접 생성한다 */
  async function createProductApi(
    householdId: string,
    categoryId: string,
    name: string,
    isConsumable = true
  ): Promise<string> {
    return seedProduct(householdId, categoryId, name, isConsumable);
  }

  /** DB seed 로 변형을 직접 생성한다 */
  async function createVariantApi(
    productId: string,
    unitId: string,
    quantityPerUnit: number,
    name?: string
  ): Promise<string> {
    return seedProductVariant(productId, unitId, quantityPerUnit, name ?? null);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-A. 카테고리 관리 모달
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('4-A-1. 사용자는 "카테고리 관리" 버튼을 클릭하여 카테고리 관리 모달을 연다', async ({
    page,
  }) => {
    await setupHousehold(page);
    await goToSettings(page);

    await page.locator('button:has-text("카테고리 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(
      modal.locator("h2:has-text('카테고리 관리')")
    ).toBeVisible();
  });

  test("4-A-2. 사용자는 카테고리 관리 모달에서 카테고리 목록과 품목 수를 조회한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();

    // API 로 카테고리와 품목 생성
    const catId = await createCategoryApi(householdId, "식료품");
    await createProductApi(householdId, catId, "라면");
    await createProductApi(householdId, catId, "우유");
    await createCategoryApi(householdId, "생활용품");

    await goToSettings(page);
    await page.locator('button:has-text("카테고리 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 카테고리 목록에 "식료품", "생활용품" 표시
    await expect(modal.locator('text="식료품"')).toBeVisible();
    await expect(modal.locator('text="생활용품"')).toBeVisible();

    // "식료품" 의 품목 수 표시 (2개 품목)
    await expect(modal.locator('text="2개 품목"')).toBeVisible();
    // "생활용품" 의 품목 수 표시 (0개 품목)
    await expect(modal.locator('text="0개 품목"')).toBeVisible();
  });

  test("4-A-3. 사용자는 카테고리 관리 모달에서 새 카테고리를 등록한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    await goToSettings(page);

    await page.locator('button:has-text("카테고리 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 새 카테고리 입력 후 Enter 로 추가
    const addInput = modal.locator('input[placeholder="새 카테고리 이름"]');
    await addInput.fill("식료품");
    await addInput.press("Enter");

    // API sync 대기 후 DB 에서 카테고리가 생성되었는지 확인
    await expect(async () => {
      const categories = await query<{ name: string }>(
        "SELECT name FROM categories WHERE name = $1",
        ["식료품"]
      );
      expect(categories).toHaveLength(1);
    }).toPass({ timeout: 10_000 });

    // 페이지 새로고침 후 UI 에서도 확인
    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToSettings(page);

    await page.locator('button:has-text("카테고리 관리")').click();
    const modal2 = page.locator('[role="dialog"]');
    await expect(modal2).toBeVisible({ timeout: 5_000 });
    await expect(modal2.locator('span:has-text("식료품")')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("4-A-4. 사용자는 카테고리 관리 모달에서 카테고리 이름을 인라인 수정한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");

    await goToSettings(page);
    await page.locator('button:has-text("카테고리 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 수정 버튼 클릭
    await modal.locator('button[aria-label="식료품 수정"]').click();

    // 인라인 수정 입력 필드에 새 이름 입력 (autoFocus 된 input)
    const editInput = modal.locator("input[type='text']").last();
    await editInput.clear();
    await editInput.fill("음료");

    // Enter 로 저장
    await editInput.press("Enter");

    // API sync 대기 후 DB 에서 이름이 변경되었는지 확인
    await expect(async () => {
      const categories = await query<{ name: string }>(
        "SELECT name FROM categories WHERE name = $1",
        ["음료"]
      );
      expect(categories).toHaveLength(1);
    }).toPass({ timeout: 10_000 });

    // 페이지 새로고침 후 UI 에서도 확인
    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToSettings(page);

    await page.locator('button:has-text("카테고리 관리")').click();
    const modal2 = page.locator('[role="dialog"]');
    await expect(modal2).toBeVisible({ timeout: 5_000 });
    await expect(modal2.locator('span:has-text("음료")')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("4-A-5. 사용자는 카테고리 관리 모달에서 카테고리를 삭제하고 하위 품목·용량·포장이 함께 삭제됨을 확인한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "개");
    const prodId = await createProductApi(
      householdId,
      catId,
      "라면"
    );
    await createVariantApi(prodId, unitId, 1);

    await goToSettings(page);
    await page.locator('button:has-text("카테고리 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 삭제 버튼 클릭
    await modal.locator('button[aria-label="식료품 삭제"]').click();

    // AlertModal 에서 "삭제" 확인
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    await alertDialog.locator('button:has-text("삭제")').click();
    await expect(alertDialog).toBeHidden({ timeout: 5_000 });

    // API sync 대기 후 DB 에서 카테고리·품목·변형이 삭제되었는지 확인
    await expect(async () => {
      const cats = await query<{ id: string }>(
        "SELECT id FROM categories WHERE name = $1",
        ["식료품"]
      );
      expect(cats).toHaveLength(0);
    }).toPass({ timeout: 10_000 });

    const prods = await query<{ id: string }>(
      "SELECT id FROM products WHERE name = $1",
      ["라면"]
    );
    expect(prods).toHaveLength(0);

    const variants = await query<{ id: string }>(
      'SELECT id FROM product_variants WHERE "productId" = $1',
      [prodId]
    );
    expect(variants).toHaveLength(0);

    // 페이지 새로고침 후 UI 에서도 삭제 확인
    await page.reload();
    await page.waitForLoadState("networkidle");
    await goToSettings(page);

    await page.locator('button:has-text("카테고리 관리")').click();
    const modal2 = page.locator('[role="dialog"]');
    await expect(modal2).toBeVisible({ timeout: 5_000 });
    await expect(modal2.locator('span:has-text("식료품")')).toBeHidden();
  });

  test("4-A-6. 사용자는 카테고리 관리 모달 하단 네비게이션에서 다른 관리 모달(품목)로 이동한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "개");

    await goToSettings(page);
    await page.locator('button:has-text("카테고리 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 하단 네비게이션에서 "품목 관리" 클릭
    await modal.locator('button:has-text("품목 관리")').click();

    // 품목 관리 모달로 전환되었는지 확인
    await expect(
      page.locator('[role="dialog"] h2:has-text("품목 관리")')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-B. 단위 관리 (용량·포장 추가 모달 우측 패널)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("4-B-6. 사용자는 용량·포장 추가 모달 우측 단위 패널에서 단위를 등록한다 (기호+이름)", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "개");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 우측 패널의 "단위" 섹션 옆 "추가" 버튼 클릭
    // 용량·포장 모달 내에서 "추가" 버튼 중 단위 추가용 버튼 (작은 크기, 상단 우측)
    await modal.getByRole("button", { name: "추가" }).first().click();

    // 단위 추가 FormModal 대기
    const unitModal = page.getByRole("dialog", { name: "단위 추가" });
    await expect(unitModal).toBeVisible({ timeout: 5_000 });

    // 기호 입력
    await unitModal.locator('input[placeholder="예: ml, 개, kg"]').fill("ml");
    // 이름 입력
    await unitModal
      .locator('input[placeholder="예: 밀리리터, 개, 킬로그램"]')
      .fill("밀리리터");

    // 추가 버튼 클릭
    await unitModal.getByRole("button", { name: "추가" }).click();

    // API sync 대기 후 DB 에서 단위가 생성되었는지 확인
    await expect(async () => {
      const units = await query<{ symbol: string; name: string | null }>(
        "SELECT symbol, name FROM units WHERE symbol = $1",
        ["ml"]
      );
      expect(units).toHaveLength(1);
      expect(units[0].name).toBe("밀리리터");
    }).toPass({ timeout: 10_000 });
  });

  test("4-B-7. 사용자는 단위 목록을 조회하고 각 단위의 사용 건수를 확인한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "ml", "밀리리터");
    await createUnitApi(householdId, "개");
    const prodId = await createProductApi(
      householdId,
      catId,
      "우유"
    );
    await createVariantApi(prodId, unitId, 500);

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 단위 목록에 "ml", "개" 이 표시되는지 확인
    await expect(modal.locator('text="ml"')).toBeVisible();
    await expect(modal.locator('text="개"')).toBeVisible();
  });

  test("4-B-8. 사용자는 단위 기호·이름을 인라인 수정한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "ml", "밀리리터");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // "ml" 단위의 수정 버튼 클릭
    await modal.locator('button[aria-label="ml 수정"]').click();

    // 단위 수정 FormModal 대기
    const editModal = page.getByRole("dialog", { name: "단위 수정" });
    await expect(editModal).toBeVisible({ timeout: 5_000 });

    // 기호를 "L" 로 수정
    const symbolInput = editModal.locator("input").first();
    await symbolInput.clear();
    await symbolInput.fill("L");

    // 이름을 "리터" 로 수정
    const nameInput = editModal.locator('input[placeholder="비우면 기호만 표시"]');
    await nameInput.clear();
    await nameInput.fill("리터");

    // 저장 클릭
    await editModal.getByRole("button", { name: "저장" }).click();

    // API sync 대기 후 DB 에서 변경 확인
    await expect(async () => {
      const units = await query<{ symbol: string; name: string | null }>(
        "SELECT symbol, name FROM units WHERE symbol = $1",
        ["L"]
      );
      expect(units).toHaveLength(1);
      expect(units[0].name).toBe("리터");
    }).toPass({ timeout: 10_000 });
  });

  test("4-B-9. 사용자는 단위를 삭제한다", async ({ page }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "ml", "밀리리터");
    await createUnitApi(householdId, "개");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // "ml" 단위의 삭제 버튼 클릭
    await modal.locator('button[aria-label="ml 삭제"]').click();

    // AlertModal 에서 "삭제" 확인
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    await alertDialog.locator('button:has-text("삭제")').click();
    await expect(alertDialog).toBeHidden({ timeout: 5_000 });

    // DB 에서 삭제 확인
    const units = await query<{ id: string }>(
      "SELECT id FROM units WHERE symbol = $1",
      ["ml"]
    );
    expect(units).toHaveLength(0);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-C. 품목 관리 모달
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('4-C-10. 사용자는 "품목 관리" 버튼을 클릭하여 품목 관리 모달을 연다', async ({
    page,
  }) => {
    await setupHousehold(page);
    await goToSettings(page);

    await page.locator('button:has-text("품목 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(
      modal.locator('h2:has-text("품목 관리")')
    ).toBeVisible();
  });

  test("4-C-11. 사용자는 품목 관리 모달에서 카테고리별 아코디언으로 품목 목록을 조회한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId1 = await createCategoryApi(householdId, "식료품");
    const catId2 = await createCategoryApi(householdId, "생활용품");
    await createProductApi(householdId, catId1, "라면");
    await createProductApi(householdId, catId1, "우유");
    await createProductApi(householdId, catId2, "세제");

    await goToSettings(page);
    await page.locator('button:has-text("품목 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 카테고리 헤더가 표시되는지 확인
    await expect(modal.locator('text="식료품"').first()).toBeVisible();
    await expect(modal.locator('text="생활용품"').first()).toBeVisible();

    // 품목이 표시되는지 확인
    await expect(modal.locator('text="라면"')).toBeVisible();
    await expect(modal.locator('text="우유"')).toBeVisible();
    await expect(modal.locator('text="세제"')).toBeVisible();
  });

  test("4-C-12. 사용자는 품목 관리 모달에서 품목명·카테고리·용량으로 검색하고 카테고리 필터 칩으로 필터링한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId1 = await createCategoryApi(householdId, "식료품");
    const catId2 = await createCategoryApi(householdId, "생활용품");
    await createProductApi(householdId, catId1, "라면");
    await createProductApi(householdId, catId2, "세제");

    await goToSettings(page);
    await page.locator('button:has-text("품목 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 검색어 입력
    await modal
      .locator('input[placeholder="품목명, 카테고리, 용량 검색…"]')
      .fill("라면");

    // "라면" 만 표시되고 "세제" 는 숨겨지는지 확인 (p 태그 내 품목명)
    await expect(modal.locator('p:has-text("라면")')).toBeVisible({ timeout: 5_000 });
    await expect(modal.locator('p:has-text("세제")')).toBeHidden();

    // 검색어 지우기
    await modal.locator('button[aria-label="검색어 지우기"]').click();

    // 카테고리 필터 칩 "식료품" 클릭
    await modal.locator('button:has-text("식료품")').first().click();

    // "라면" 만 표시되고 "세제" 는 숨겨지는지 확인
    await expect(modal.locator('p:has-text("라면")')).toBeVisible({ timeout: 5_000 });
    await expect(modal.locator('p:has-text("세제")')).toBeHidden();
  });

  test("4-C-13. 사용자는 품목 관리 모달에서 카테고리·이름·설명·소비재 여부를 입력하여 등록한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");

    await goToSettings(page);
    await page.locator('button:has-text("품목 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // "추가" 버튼 클릭
    await modal.locator('button:has-text("추가")').first().click();

    // 품목 추가 FormModal 대기
    const addModal = page.getByRole("dialog", { name: "품목 추가" });
    await expect(addModal).toBeVisible({ timeout: 5_000 });

    // 품목명 입력
    await addModal
      .locator(
        'input[placeholder="예: 신라면, 열라면 (품목마다 따로 등록)"]'
      )
      .fill("신라면");

    // 설명 입력
    await addModal
      .locator('textarea[placeholder="브랜드·메모 등"]')
      .fill("농심 신라면");

    // 추가 버튼 클릭 (FormModal footer)
    await addModal.getByRole("button", { name: "추가" }).click();

    // API sync 대기 후 DB 에서 품목이 생성되었는지 확인
    await expect(async () => {
      const products = await query<{
        name: string;
        description: string | null;
        isConsumable: boolean;
      }>(
        'SELECT name, description, "isConsumable" FROM products WHERE name = $1',
        ["신라면"]
      );
      expect(products).toHaveLength(1);
      expect(products[0].description).toBe("농심 신라면");
    }).toPass({ timeout: 10_000 });
  });

  test("4-C-14. 사용자는 품목 관리 모달에서 품목 정보(이름·카테고리·설명·소비재 여부)를 수정한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    await createProductApi(householdId, catId, "라면");

    await goToSettings(page);
    await page.locator('button:has-text("품목 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // "라면" 수정 버튼 클릭
    await modal.locator('button[aria-label="라면 수정"]').click();

    // 품목 수정 FormModal 대기
    const editModal = page.getByRole("dialog", { name: "품목 수정" });
    await expect(editModal).toBeVisible({ timeout: 5_000 });

    // 이름 수정
    const nameInput = editModal.locator("input#edit-prod-name");
    await nameInput.clear();
    await nameInput.fill("열라면");

    // 저장 클릭
    await editModal.getByRole("button", { name: "저장" }).click();

    // API sync 대기 후 DB 에서 변경 확인
    await expect(async () => {
      const products = await query<{ name: string }>(
        "SELECT name FROM products WHERE name = $1",
        ["열라면"]
      );
      expect(products).toHaveLength(1);
    }).toPass({ timeout: 10_000 });
  });

  test("4-C-15. 사용자는 품목 관리 모달에서 품목을 삭제하고 하위 용량·포장도 제거됨을 확인한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "개");
    const prodId = await createProductApi(
      householdId,
      catId,
      "라면"
    );
    await createVariantApi(prodId, unitId, 5);

    await goToSettings(page);
    await page.locator('button:has-text("품목 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // "라면" 삭제 버튼 클릭
    await modal.locator('button[aria-label="라면 삭제"]').click();

    // AlertModal 에서 "삭제" 확인
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    await alertDialog.locator('button:has-text("삭제")').click();
    await expect(alertDialog).toBeHidden({ timeout: 5_000 });

    // API sync 대기 후 DB 에서 품목·변형이 삭제되었는지 확인
    await expect(async () => {
      const prods = await query<{ id: string }>(
        "SELECT id FROM products WHERE name = $1",
        ["라면"]
      );
      expect(prods).toHaveLength(0);
    }).toPass({ timeout: 10_000 });

    const variants = await query<{ id: string }>(
      'SELECT id FROM product_variants WHERE "productId" = $1',
      [prodId]
    );
    expect(variants).toHaveLength(0);
  });

  test("4-C-16. 사용자는 품목 관리 모달 하단 네비게이션에서 다른 관리 모달로 이동한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "개");

    await goToSettings(page);
    await page.locator('button:has-text("품목 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 하단 네비게이션에서 "카테고리 관리" 클릭
    await modal.locator('button:has-text("카테고리 관리")').click();

    // 카테고리 관리 모달로 전환되었는지 확인
    await expect(
      page.locator('[role="dialog"] h2:has-text("카테고리 관리")')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-D. 용량·포장 관리 모달
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('4-D-17. 사용자는 "용량·포장 관리" 버튼을 클릭하여 용량·포장 관리 모달(2-column)을 연다', async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "개");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(
      modal.locator('h2:has-text("용량·포장 관리")')
    ).toBeVisible();
  });

  test("4-D-18. 사용자는 용량·포장 관리 모달 좌측에서 카테고리·품목을 선택하여 변형 목록을 조회한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "ml", "밀리리터");
    const prodId = await createProductApi(
      householdId,
      catId,
      "우유"
    );
    await createVariantApi(prodId, unitId, 500, "500ml");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 좌측: 카테고리 선택 (첫 번째 select)
    const categorySelect = modal.locator("select").first();
    await categorySelect.selectOption({ label: "식료품" });

    // 좌측: 품목 선택 (두 번째 select)
    const productSelect = modal.locator("select").nth(1);
    await productSelect.selectOption({ label: "우유" });

    // 변형 목록에 "500ml" 이 표시되는지 확인
    await expect(modal.locator('text="500ml"')).toBeVisible({
      timeout: 5_000,
    });
  });

  test("4-D-19. 사용자는 용량·포장 관리 모달 우측에서 단위를 선택하고 용량·라벨을 입력하여 변형을 등록한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "ml", "밀리리터");
    await createProductApi(householdId, catId, "우유");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 카테고리·품목 선택
    const categorySelect = modal.locator("select").first();
    await categorySelect.selectOption({ label: "식료품" });
    const productSelect = modal.locator("select").nth(1);
    await productSelect.selectOption({ label: "우유" });

    // 우측: 단위 "ml" 선택 (단위 목록에서 ml 텍스트가 포함된 버튼)
    await modal.getByText("ml", { exact: true }).click();

    // 용량 입력
    await modal
      .locator('input[inputmode="decimal"]')
      .fill("1000");

    // 표시 이름 입력
    await modal
      .locator('input[placeholder="비우면 자동 생성"]')
      .fill("1L 팩");

    // "추가" 버튼 클릭 (하단 전체 너비 추가 버튼)
    await modal
      .locator('button:has-text("추가")')
      .last()
      .click();

    // API sync 대기 후 DB 에서 변형이 생성되었는지 확인
    await expect(async () => {
      const variants = await query<{
        name: string | null;
        quantityPerUnit: string;
      }>(
        'SELECT name, "quantityPerUnit"::text FROM product_variants WHERE name = $1',
        ["1L 팩"]
      );
      expect(variants).toHaveLength(1);
      expect(parseFloat(variants[0].quantityPerUnit)).toBe(1000);
    }).toPass({ timeout: 10_000 });
  });

  test("4-D-20. 사용자는 용량·포장 관리 모달에서 변형 정보(단위·용량·표시 이름)를 수정한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "ml", "밀리리터");
    const prodId = await createProductApi(
      householdId,
      catId,
      "우유"
    );
    await createVariantApi(prodId, unitId, 500, "500ml");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 카테고리·품목 선택
    await modal.locator("select").first().selectOption({ label: "식료품" });
    await modal.locator("select").nth(1).selectOption({ label: "우유" });

    // "500ml" 수정 버튼 클릭
    await modal.locator('button[aria-label="500ml 수정"]').click();

    // 변형 수정 FormModal 대기
    const editModal = page.getByRole("dialog", { name: "용량·포장 수정" });
    await expect(editModal).toBeVisible({ timeout: 5_000 });

    // 표시 이름 수정
    const nameInput = editModal.locator(
      'input[placeholder="비우면 단위·수량으로 생성"]'
    );
    await nameInput.clear();
    await nameInput.fill("대용량 500ml");

    // 저장 클릭
    await editModal.getByRole("button", { name: "저장" }).click();

    // API sync 대기 후 DB 에서 변경 확인
    await expect(async () => {
      const variants = await query<{ name: string | null }>(
        "SELECT name FROM product_variants WHERE name = $1",
        ["대용량 500ml"]
      );
      expect(variants).toHaveLength(1);
    }).toPass({ timeout: 10_000 });
  });

  test("4-D-21. 사용자는 용량·포장 관리 모달에서 변형을 삭제한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "ml", "밀리리터");
    const prodId = await createProductApi(
      householdId,
      catId,
      "우유"
    );
    const variantId = await createVariantApi(
      prodId,
      unitId,
      500,
      "500ml"
    );

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 카테고리·품목 선택
    await modal.locator("select").first().selectOption({ label: "식료품" });
    await modal.locator("select").nth(1).selectOption({ label: "우유" });

    // "500ml" 삭제 버튼 클릭
    await modal.locator('button[aria-label="500ml 삭제"]').click();

    // AlertModal 에서 "삭제" 확인
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    await alertDialog.locator('button:has-text("삭제")').click();
    await expect(alertDialog).toBeHidden({ timeout: 5_000 });

    // DB 에서 변형이 삭제되었는지 확인
    const variants = await query<{ id: string }>(
      "SELECT id FROM product_variants WHERE id = $1",
      [variantId]
    );
    expect(variants).toHaveLength(0);
  });

  test("4-D-22. 사용자는 용량·포장 관리 모달 하단 네비게이션에서 다른 관리 모달로 이동한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "개");

    await goToSettings(page);
    await page.locator('button:has-text("용량·포장 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 하단 네비게이션에서 "카탈로그 관리" 클릭
    await modal.locator('button:has-text("카탈로그 관리")').click();

    // 카탈로그 브라우저 모달로 전환되었는지 확인
    await expect(
      page.locator('[role="dialog"] h2:has-text("카탈로그 관리")')
    ).toBeVisible({ timeout: 5_000 });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4-E. 카탈로그 브라우저 모달 (전체 조회)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test('4-E-23. 사용자는 "카탈로그 관리" 버튼을 클릭하여 카탈로그 브라우저 모달을 연다', async ({
    page,
  }) => {
    await setupHousehold(page);
    await goToSettings(page);

    await page.locator('button:has-text("카탈로그 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });
    await expect(
      modal.locator('h2:has-text("카탈로그 관리")')
    ).toBeVisible();
  });

  test("4-E-24. 사용자는 카탈로그 브라우저에서 카테고리 › 품목 › 용량·포장 3단 트리 구조를 조회한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    const unitId = await createUnitApi(householdId, "ml", "밀리리터");
    const prodId = await createProductApi(
      householdId,
      catId,
      "우유"
    );
    await createVariantApi(prodId, unitId, 500, "500ml");

    await goToSettings(page);
    await page.locator('button:has-text("카탈로그 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 3단 트리: 카테고리 표시 확인
    await expect(modal.locator('text="식료품"').first()).toBeVisible();

    // 카테고리 아코디언을 펼쳐서 품목을 확인
    const prodVisible = await modal.locator('text="우유"').isVisible().catch(() => false);
    if (!prodVisible) {
      await modal.locator('button:has-text("식료품")').click();
    }
    await expect(modal.locator('text="우유"')).toBeVisible({ timeout: 5_000 });

    // 품목 행을 클릭하여 변형 펼치기 (품목 행은 div, 버튼이 아님)
    const variantVisible = await modal.locator('text="500ml"').isVisible().catch(() => false);
    if (!variantVisible) {
      await modal.locator('p:has-text("우유")').click();
    }
    await expect(modal.locator('text="500ml"')).toBeVisible({ timeout: 5_000 });
  });

  test("4-E-25. 사용자는 카탈로그 브라우저에서 카테고리·품목·용량·포장을 키워드로 검색한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId1 = await createCategoryApi(householdId, "식료품");
    const catId2 = await createCategoryApi(householdId, "생활용품");
    await createProductApi(householdId, catId1, "라면");
    await createProductApi(householdId, catId2, "세제");

    await goToSettings(page);
    await page.locator('button:has-text("카탈로그 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 검색어 입력
    await modal
      .locator('input[placeholder="카테고리, 품목, 용량·포장 검색…"]')
      .fill("라면");

    // "라면" 만 표시되는지 확인
    await expect(modal.locator('text="라면"')).toBeVisible({ timeout: 5_000 });
    // "세제" 는 숨겨지는지 확인
    await expect(modal.locator('text="세제"')).toBeHidden();
  });

  test("4-E-26. 사용자는 카탈로그 브라우저에서 카테고리를 모두 펼치기/접기한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    const catId = await createCategoryApi(householdId, "식료품");
    await createProductApi(householdId, catId, "라면");

    await goToSettings(page);
    await page.locator('button:has-text("카탈로그 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 카테고리 "식료품" 이 보이는지 확인
    await expect(modal.locator('text="식료품"').first()).toBeVisible();

    // 카테고리 헤더 클릭하여 접기
    await modal.locator('button:has-text("식료품")').click();

    // 접힌 상태에서 "라면" 이 숨겨지는지 확인
    await expect(modal.locator('text="라면"')).toBeHidden({ timeout: 3_000 });

    // 다시 펼치기
    await modal.locator('button:has-text("식료품")').click();

    // "라면" 이 다시 표시되는지 확인
    await expect(modal.locator('text="라면"')).toBeVisible({ timeout: 3_000 });
  });

  test("4-E-27. 사용자는 카탈로그 브라우저 하단 네비게이션에서 다른 관리 모달(카테고리/품목/용량·포장)로 이동한다", async ({
    page,
  }) => {
    await setupHousehold(page);
    const householdId = await getHouseholdId();
    await createCategoryApi(householdId, "식료품");
    await createUnitApi(householdId, "개");

    await goToSettings(page);
    await page.locator('button:has-text("카탈로그 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 하단 네비게이션에서 "카테고리 관리" 클릭
    await modal.locator('button:has-text("카테고리 관리")').click();

    // 카테고리 관리 모달로 전환되었는지 확인
    await expect(
      page.locator('[role="dialog"] h2:has-text("카테고리 관리")')
    ).toBeVisible({ timeout: 5_000 });
  });
});
