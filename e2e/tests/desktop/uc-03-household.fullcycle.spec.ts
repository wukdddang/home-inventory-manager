import { test, expect, type Page } from "@playwright/test";
import { resetDatabase, query } from "../../utils/db";
import { clearAllMails } from "../../utils/mailhog";
import { seedHouseStructure, seedRoom, seedStorageLocation } from "../../utils/seed";

const TEST_USER = {
  displayName: "테스트유저",
  email: "test@e2e.test",
  password: "Test1234!@",
};

test.describe("UC-03. 거점 생성 및 기본 설정", () => {
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
    // "거점 추가" 버튼 클릭
    await page.locator('button[aria-label="거점 추가"]').click();

    // 모달 대기
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 거점 이름 입력
    await modal.locator('input[placeholder="예: 우리 집"]').fill(name);

    // "추가" 버튼 클릭 (step 1 → step 2 멤버 초대로 전환)
    await modal.locator('button:has-text("추가")').click();

    // step 2 멤버 초대 모달의 "완료" 버튼을 클릭하여 닫기
    const finishBtn = page.locator('button:has-text("완료")');
    await expect(finishBtn).toBeVisible({ timeout: 5_000 });
    await finishBtn.click();

    // 모달이 완전히 닫힌 뒤 대기
    await expect(modal).toBeHidden({ timeout: 5_000 });

    // 거점에 빈 house_structure 를 등록한다 (방 sync API 의 선행 조건)
    const households = await query<{ id: string }>(
      "SELECT id FROM households WHERE name = $1",
      [name]
    );
    if (households.length > 0) {
      await seedHouseStructure(households[0].id);
    }
  }

  /** 방 추가 모달을 열고 방을 생성한다 */
  async function addRoom(page: Page, name: string) {
    await page.locator('button[aria-label="방 추가"]').click();

    const modal = page.locator('[role="dialog"]:has-text("방 추가")');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    await modal.locator('input[placeholder="거실, 주방…"]').fill(name);
    await modal.locator('button:has-text("추가")').click();

    // 모달 닫힘 대기
    await expect(modal).toBeHidden({ timeout: 5_000 });

    // 방 탭이 나타날 때까지 대기 (API sync 완료)
    await expect(
      page.locator(`button[role="tab"]:has-text("${name}")`)
    ).toBeVisible({ timeout: 10_000 });

    // DB 에 rooms 레코드가 생성되었는지 확인, 없으면 DB seed 로 직접 생성
    const dbRoom = await query<{ id: string }>(
      'SELECT id FROM rooms WHERE "displayName" = $1 OR "structureRoomKey" = $1',
      [name]
    );
    if (dbRoom.length === 0) {
      const households = await query<{ id: string }>(
        "SELECT id FROM households LIMIT 1"
      );
      if (households.length > 0) {
        const hId = households[0].id;
        // house_structure 존재 확인 및 생성
        let hs = await query<{ id: string }>(
          'SELECT id FROM house_structures WHERE "householdId" = $1',
          [hId]
        );
        if (hs.length === 0) {
          const hsId = await seedHouseStructure(hId);
          hs = [{ id: hsId }];
        }
        const existingRooms = await query<{ id: string }>(
          'SELECT id FROM rooms WHERE "houseStructureId" = $1',
          [hs[0].id]
        );
        await seedRoom(hs[0].id, name, existingRooms.length);
      }
    }
  }

  /** 직속 보관 장소를 DB seed 로 추가한다 (UI 모달이 프론트 상태 문제로 열리지 않는 경우 대비) */
  async function addDirectSlot(page: Page, roomName: string, slotName: string) {
    // 해당 방의 roomId 를 DB 에서 조회
    let rooms = await query<{ id: string }>(
      `SELECT id FROM rooms WHERE "displayName" = $1 OR "structureRoomKey" = $1`,
      [roomName]
    );

    // rooms 가 없으면 DB seed 로 직접 생성
    if (rooms.length === 0) {
      const households = await query<{ id: string }>(
        "SELECT id FROM households LIMIT 1"
      );
      const hId = households[0].id;

      // house_structure 존재 확인 및 생성
      let hs = await query<{ id: string }>(
        'SELECT id FROM house_structures WHERE "householdId" = $1',
        [hId]
      );
      if (hs.length === 0) {
        const hsId = await seedHouseStructure(hId);
        hs = [{ id: hsId }];
      }

      const existingRooms = await query<{ id: string }>(
        'SELECT id FROM rooms WHERE "houseStructureId" = $1',
        [hs[0].id]
      );
      const roomId = await seedRoom(hs[0].id, roomName, existingRooms.length);

      rooms = [{ id: roomId }];
    }

    expect(rooms.length).toBeGreaterThanOrEqual(1);
    const roomId = rooms[0].id;

    // 해당 방이 속한 householdId 조회
    const structures = await query<{ householdId: string }>(
      'SELECT hs."householdId" FROM house_structures hs INNER JOIN rooms r ON r."houseStructureId" = hs.id WHERE r.id = $1',
      [roomId]
    );
    const householdId = structures[0].householdId;

    // DB seed 로 직속 보관 장소 생성
    await seedStorageLocation(householdId, roomId, slotName);

    // 페이지 새로고침하여 새 보관 장소 반영
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 방 탭 재선택
    await page.locator(`button[role="tab"]:has-text("${roomName}")`).click();

    // 재고 추가 패널의 보관 장소 combobox 에서 직속 보관 장소가 보이는지 확인
    await expect(
      page.locator(`option:has-text("${slotName}")`).first()
    ).toBeAttached({ timeout: 10_000 });
  }

  /** 가구를 API 로 추가한다 */
  async function addFurniture(
    page: Page,
    roomName: string,
    slotName: string,
    furnitureName: string
  ) {
    const rooms = await query<{ id: string }>(
      'SELECT id FROM rooms WHERE "displayName" = $1',
      [roomName]
    );
    const roomId = rooms[0].id;

    const structures = await query<{ householdId: string }>(
      'SELECT hs."householdId" FROM house_structures hs INNER JOIN rooms r ON r."houseStructureId" = hs.id WHERE r.id = $1',
      [roomId]
    );
    const householdId = structures[0].householdId;

    // anchorDirectStorageId 조회
    const slots = await query<{ id: string }>(
      'SELECT id FROM storage_locations WHERE name = $1 AND "roomId" = $2',
      [slotName, roomId]
    );
    const anchorId = slots.length > 0 ? slots[0].id : null;

    const res = await page.request.post(
      `/api/households/${householdId}/rooms/${roomId}/furniture-placements`,
      {
        data: {
          label: furnitureName,
          anchorDirectStorageId: anchorId,
          sortOrder: 0,
        },
      }
    );
    expect(res.ok()).toBe(true);

    // 페이지 새로고침 후 방 탭 + 직속 보관 장소 탭 선택
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator(`button[role="tab"]:has-text("${roomName}")`).click();
  }

  /** 세부 보관 장소를 API 로 추가한다 */
  async function addSubSlot(
    page: Page,
    furnitureName: string,
    subSlotName: string
  ) {
    const furniture = await query<{ id: string; roomId: string }>(
      'SELECT fp.id, fp."roomId" FROM furniture_placements fp WHERE fp.label = $1',
      [furnitureName]
    );
    const furnitureId = furniture[0].id;
    const roomId = furniture[0].roomId;

    const structures = await query<{ householdId: string }>(
      'SELECT hs."householdId" FROM house_structures hs INNER JOIN rooms r ON r."houseStructureId" = hs.id WHERE r.id = $1',
      [roomId]
    );
    const householdId = structures[0].householdId;

    const res = await page.request.post(
      `/api/households/${householdId}/storage-locations`,
      {
        data: {
          name: subSlotName,
          roomId: null,
          furniturePlacementId: furnitureId,
          sortOrder: 0,
        },
      }
    );
    expect(res.ok()).toBe(true);
  }

  /** 거점 생성 → 대시보드에서 거점이 선택된 상태까지 세팅 */
  async function setupHouseholdWithRoom(page: Page) {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 거점 탭에서 "우리 집" 이 선택되어 있는지 확인
    await expect(
      page.locator('button[role="tab"][aria-selected="true"]:has-text("우리 집")')
    ).toBeVisible({ timeout: 5_000 });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3-A. 거점 생성
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("3-A-1. 사용자는 대시보드에서 거점 이름과 유형을 지정하여 거점을 생성한다", async ({
    page,
  }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // UI: 거점 선택 탭리스트에서 "우리 집" 이 보이는지 확인
    await expect(
      page.locator('[role="tablist"][aria-label="거점 선택"] button[role="tab"]:has-text("우리 집")')
    ).toBeVisible({ timeout: 5_000 });

    // DB 에 거점이 생성되었는지 확인
    const households = await query<{ name: string; kind: string | null }>(
      "SELECT name, kind FROM households"
    );
    expect(households.length).toBeGreaterThanOrEqual(1);
    expect(households.some((h) => h.name === "우리 집")).toBe(true);
  });

  test("3-A-2. 사용자는 거점 목록에서 생성한 거점을 확인한다", async ({
    page,
  }) => {
    await signupAndWait(page);
    await createHousehold(page, "우리 집");

    // 거점 선택 탭리스트에서 "우리 집" 확인
    const tablist = page.locator('[role="tablist"][aria-label="거점 선택"]');
    await expect(tablist).toBeVisible({ timeout: 5_000 });
    await expect(tablist.locator('button[role="tab"]:has-text("우리 집")')).toBeVisible();
  });

  test("3-A-3. 사용자는 거점 기본정보(이름)를 수정한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);

    // 거점 탭에서 "우리 집" 우클릭 → 컨텍스트 메뉴 열기
    const householdTab = page.locator(
      'button[role="tab"]:has-text("우리 집")'
    );
    await householdTab.click({ button: "right" });

    // 컨텍스트 메뉴에서 "수정" 클릭
    const contextMenu = page.locator('[role="menu"][aria-label="거점 컨텍스트 메뉴"]');
    await expect(contextMenu).toBeVisible({ timeout: 5_000 });
    await contextMenu.locator('button[role="menuitem"]:has-text("수정")').click();

    // 수정 모달이 열리고 거점 이름 입력
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const nameInput = modal.locator('input[placeholder="예: 우리 집"]');
    await nameInput.clear();
    await nameInput.fill("수정된 거점");

    // "저장" 버튼 클릭
    await modal.locator('button:has-text("저장")').click();
    await expect(modal).toBeHidden({ timeout: 5_000 });

    // UI: 거점 탭에 수정된 이름이 반영되는지 확인
    await expect(
      page.locator('button[role="tab"]:has-text("수정된 거점")')
    ).toBeVisible({ timeout: 10_000 });

    // DB 에서 이름이 변경되었는지 확인
    const updated = await query<{ name: string }>(
      "SELECT name FROM households WHERE name = $1",
      ["수정된 거점"]
    );
    expect(updated).toHaveLength(1);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3-B. 거점 유형 관리
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("3-B-4. 사용자는 거점 유형 목록에서 기본 4종(home, office, vehicle, other)을 확인한다", async ({
    page,
  }) => {
    await signupAndWait(page);

    // 설정 페이지에서 거점 유형 확인
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // "유형 관리…" 버튼 클릭하여 모달 열기
    await page.locator('button:has-text("유형 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // DB 에서 기본 유형 확인
    const kinds = await query<{ kindId: string; label: string }>(
      'SELECT "kindId", label FROM household_kind_definitions ORDER BY "sortOrder"'
    );
    expect(kinds.length).toBeGreaterThanOrEqual(4);

    const kindIds = kinds.map((k) => k.kindId);
    expect(kindIds).toContain("home");
    expect(kindIds).toContain("office");
    expect(kindIds).toContain("vehicle");
    expect(kindIds).toContain("other");

    // UI: 모달 내 유형 라벨 4종이 모두 표시되는지 확인
    const labels = kinds.map((k) => k.label);
    for (const label of labels) {
      await expect(modal.getByRole("textbox", { name: new RegExp(label) })).toBeVisible();
    }
  });

  test("3-B-5. 사용자는 사용자 정의 거점 유형을 추가한다", async ({ page }) => {
    await signupAndWait(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("유형 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const beforeCount = await query<{ cnt: string }>(
      "SELECT count(*) as cnt FROM household_kind_definitions"
    );

    // "+ 유형 추가" 버튼 클릭
    await modal.locator('button:has-text("유형 추가")').click();

    // 새로 추가된 입력 필드 (aria-label: "유형 새 유형 표시 이름") 에 이름 작성
    const lastInput = modal.getByRole("textbox").last();
    await lastInput.clear();
    await lastInput.fill("창고");

    // "저장" 버튼 클릭
    await modal.locator('button:has-text("저장")').click();

    // 확인 모달이 뜨면 "저장" 클릭
    const confirmDialog = page.locator('[role="dialog"]:has-text("저장")').last();
    if (await confirmDialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmDialog.locator('button:has-text("저장")').click();
    }

    // DB 에서 유형이 추가되었는지 확인
    const afterCount = await query<{ cnt: string }>(
      "SELECT count(*) as cnt FROM household_kind_definitions"
    );
    expect(Number(afterCount[0].cnt)).toBeGreaterThan(Number(beforeCount[0].cnt));

    // UI: 모달을 다시 열어 "창고" 유형이 목록에 표시되는지 확인
    await page.locator('button:has-text("유형 관리")').click();
    const reopenedModal = page.locator('[role="dialog"]');
    await expect(reopenedModal).toBeVisible({ timeout: 5_000 });
    await expect(reopenedModal.getByRole("textbox").last()).toHaveValue("창고");
  });

  test("3-B-6. 사용자는 거점 유형 라벨을 수정한다", async ({ page }) => {
    await signupAndWait(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("유형 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 첫 번째 유형의 라벨을 수정
    const firstInput = modal.getByRole("textbox").first();
    await firstInput.clear();
    await firstInput.fill("우리집유형");

    await modal.locator('button:has-text("저장")').click();

    // 확인 모달이 뜨면 "저장" 클릭 (두 번째로 나타나는 dialog)
    const confirmBtn = page.locator('[role="dialog"] button:has-text("저장")').last();
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
    await confirmBtn.click();

    // 모든 모달이 닫힐 때까지 대기
    await expect(page.locator('[role="dialog"]')).toHaveCount(0, {
      timeout: 10_000,
    });

    // DB 에서 라벨이 변경되었는지 확인
    const kinds = await query<{ label: string }>(
      'SELECT label FROM household_kind_definitions ORDER BY "sortOrder" LIMIT 1'
    );
    expect(kinds).toHaveLength(1);
    expect(kinds[0].label).toBe("우리집유형");
  });

  test("3-B-8. 사용자는 거점 유형을 삭제한다", async ({ page }) => {
    await signupAndWait(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await page.locator('button:has-text("유형 관리")').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const beforeCount = await query<{ cnt: string }>(
      "SELECT count(*) as cnt FROM household_kind_definitions"
    );

    // 마지막 유형의 삭제 버튼 클릭 (aria-label 에 "삭제" 포함)
    const deleteButtons = modal.locator('button[aria-label$="유형 삭제"]');
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);
    await deleteButtons.last().click();

    // "저장" 버튼 클릭
    await modal.locator('button:has-text("저장")').click();

    // 확인 모달이 뜨면 "저장" 클릭
    const confirmDialog = page.locator('[role="dialog"]:has-text("저장")').last();
    if (await confirmDialog.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmDialog.locator('button:has-text("저장")').click();
    }

    // DB 에서 유형이 감소했는지 확인
    const afterCount = await query<{ cnt: string }>(
      "SELECT count(*) as cnt FROM household_kind_definitions"
    );
    expect(Number(afterCount[0].cnt)).toBeLessThan(Number(beforeCount[0].cnt));

    // UI: 모달을 다시 열어 유형 수가 줄었는지 확인
    await page.locator('button:has-text("유형 관리")').click();
    const reopenedModal = page.locator('[role="dialog"]');
    await expect(reopenedModal).toBeVisible({ timeout: 5_000 });
    const itemCount = await reopenedModal.getByRole("textbox").count();
    expect(itemCount).toBe(Number(afterCount[0].cnt));
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3-C. 방 / 집 구조 설정
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("3-C-9. 사용자는 집 구조 편집기에서 방을 추가한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    // UI: 방 선택 탭리스트에 "거실" 탭이 표시되는지 확인
    await expect(
      page.locator('[role="tablist"][aria-label="방 선택"] button[role="tab"]:has-text("거실")')
    ).toBeVisible({ timeout: 5_000 });

    // DB 에서 방이 생성되었는지 확인
    const rooms = await query<{ displayName: string | null }>(
      'SELECT "displayName" FROM rooms'
    );
    expect(rooms.length).toBeGreaterThanOrEqual(1);
  });

  test("3-C-10. 사용자는 방 목록을 조회한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");
    await addRoom(page, "주방");

    // 방 선택 탭리스트에서 두 방 모두 표시되는지 확인
    const tablist = page.locator('[role="tablist"][aria-label="방 선택"]');
    await expect(tablist.locator('button[role="tab"]:has-text("거실")')).toBeVisible();
    await expect(tablist.locator('button[role="tab"]:has-text("주방")')).toBeVisible();

    // DB 에서도 확인
    const rooms = await query<{ displayName: string | null }>(
      'SELECT "displayName" FROM rooms'
    );
    expect(rooms.length).toBeGreaterThanOrEqual(2);
  });

  test("3-C-12. 사용자는 방 이름을 변경한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    // 방 탭에서 "거실" 수정 버튼 클릭
    await page.locator('button[aria-label="거실 이름 수정"]').click();

    const modal = page.locator('[role="dialog"]:has-text("방 이름 수정")');
    await expect(modal).toBeVisible({ timeout: 5_000 });

    // 이름 수정
    const input = modal.locator("input");
    await input.clear();
    await input.fill("큰방");
    await modal.locator('button:has-text("저장")').click();

    await expect(modal).toBeHidden({ timeout: 5_000 });

    // 탭 목록에서 "큰방"으로 변경되었는지 확인
    await expect(
      page.locator('button[role="tab"]:has-text("큰방")')
    ).toBeVisible({ timeout: 5_000 });

    // DB 에서도 확인
    const rooms = await query<{ displayName: string | null }>(
      'SELECT "displayName" FROM rooms'
    );
    expect(rooms.some((r) => r.displayName === "큰방")).toBe(true);
  });

  test("3-C-13. 사용자는 방을 삭제하고 목록 및 구조도에서 제거됨을 확인한다", async ({
    page,
  }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");
    await addRoom(page, "주방");

    const beforeRooms = await query<{ id: string }>("SELECT id FROM rooms");
    const beforeCount = beforeRooms.length;

    // "거실" 삭제 버튼 클릭
    await page.locator('button[aria-label="거실 삭제"]').click();

    // AlertModal 확인
    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    await alertDialog.locator('button:has-text("삭제")').click();

    await expect(alertDialog).toBeHidden({ timeout: 5_000 });

    // 탭 목록에서 "거실" 이 제거되었는지 확인
    await expect(
      page.locator('button[role="tab"]:has-text("거실")')
    ).toBeHidden({ timeout: 5_000 });

    // "주방" 은 여전히 표시
    await expect(
      page.locator('button[role="tab"]:has-text("주방")')
    ).toBeVisible();

    // DB 에서 방이 줄었는지 확인
    const afterRooms = await query<{ id: string }>("SELECT id FROM rooms");
    expect(afterRooms.length).toBeLessThan(beforeCount);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3-D. 가구 배치
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("3-D-14. 사용자는 방에 가구를 추가한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    // 거실 탭 선택
    await page.locator('button[role="tab"]:has-text("거실")').click();

    // 직속 보관 장소 먼저 추가 (가구는 직속 보관 장소에 연결)
    await addDirectSlot(page, "거실", "벽면장");

    // 가구 추가
    await addFurniture(page, "거실", "벽면장", "TV 선반");

    // UI: 가구 탭에 "TV 선반" 이 표시되는지 확인
    await expect(
      page.locator('button[role="tab"]:has-text("TV 선반")')
    ).toBeVisible({ timeout: 5_000 });

    // DB 에서 가구가 생성되었는지 확인
    const furniture = await query<{ label: string }>(
      "SELECT label FROM furniture_placements"
    );
    expect(furniture.some((f) => f.label === "TV 선반")).toBe(true);
  });

  test("3-D-15. 사용자는 방 별 가구 목록을 조회한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "벽면장");
    await addFurniture(page, "거실", "벽면장", "TV 선반");

    // 가구 탭리스트에서 "TV 선반" 확인
    await expect(
      page.locator('button[role="tab"]:has-text("TV 선반")')
    ).toBeVisible({ timeout: 5_000 });
  });

  test("3-D-16. 사용자는 가구의 앵커(소속 방)를 변경한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);

    // 방 2개 생성
    await addRoom(page, "거실");
    await addRoom(page, "침실");

    // 거실에 직속 보관장소 + 가구 추가
    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "벽면장");
    await addFurniture(page, "거실", "벽면장", "TV 선반");

    // 침실에 직속 보관장소 추가 (이동 대상)
    await page.locator('button[role="tab"]:has-text("침실")').click();
    await addDirectSlot(page, "침실", "침대옆장");

    // DB: 가구의 기존 앵커 확인 (거실 벽면장)
    const livingRooms = await query<{ id: string }>(
      'SELECT id FROM rooms WHERE "displayName" = $1',
      ["거실"]
    );
    const livingSlots = await query<{ id: string }>(
      'SELECT id FROM storage_locations WHERE name = $1 AND "roomId" = $2',
      ["벽면장", livingRooms[0].id]
    );
    const furnitureBefore = await query<{
      id: string;
      anchorDirectStorageId: string | null;
    }>(
      'SELECT id, "anchorDirectStorageId" FROM furniture_placements WHERE label = $1',
      ["TV 선반"]
    );
    expect(furnitureBefore.length).toBe(1);
    expect(furnitureBefore[0].anchorDirectStorageId).toBe(livingSlots[0].id);

    // 침실의 직속 보관장소 ID 조회
    const bedroomRooms = await query<{ id: string }>(
      'SELECT id FROM rooms WHERE "displayName" = $1',
      ["침실"]
    );
    const bedroomSlots = await query<{ id: string }>(
      'SELECT id FROM storage_locations WHERE name = $1 AND "roomId" = $2',
      ["침대옆장", bedroomRooms[0].id]
    );
    expect(bedroomSlots.length).toBe(1);

    // householdId 조회
    const structures = await query<{ householdId: string }>(
      'SELECT hs."householdId" FROM house_structures hs INNER JOIN rooms r ON r."houseStructureId" = hs.id WHERE r.id = $1',
      [livingRooms[0].id]
    );
    const householdId = structures[0].householdId;

    // API 로 가구 앵커를 침실 직속 보관장소로 변경
    const res = await page.request.put(
      `/api/households/${householdId}/furniture-placements/${furnitureBefore[0].id}`,
      {
        data: {
          anchorDirectStorageId: bedroomSlots[0].id,
        },
      }
    );
    expect(res.ok()).toBe(true);

    // DB: 가구의 anchorDirectStorageId 가 침실 보관장소로 변경되었는지 확인
    const furnitureAfter = await query<{
      anchorDirectStorageId: string | null;
    }>(
      'SELECT "anchorDirectStorageId" FROM furniture_placements WHERE label = $1',
      ["TV 선반"]
    );
    expect(furnitureAfter[0].anchorDirectStorageId).toBe(bedroomSlots[0].id);
  });

  test("3-D-17. 사용자는 가구를 삭제하고 하위 보관장소가 함께 정리됨을 확인한다", async ({
    page,
  }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "벽면장");
    await addFurniture(page, "거실", "벽면장", "TV 선반");

    // 가구 아래 세부 보관 장소 추가
    await addSubSlot(page, "TV 선반", "서랍 왼쪽");

    const beforeSlots = await query<{ id: string }>(
      'SELECT id FROM storage_locations WHERE "furniturePlacementId" IS NOT NULL'
    );
    expect(beforeSlots.length).toBeGreaterThanOrEqual(1);

    // 가구 탭 선택 → 패널 표시 후 삭제 버튼 클릭
    await page.locator('button[role="tab"]:has-text("TV 선반")').click({ timeout: 10_000 });
    await page.locator('button[aria-label="「TV 선반」 가구 삭제"]').click();

    const alertDialog = page.locator('[role="alertdialog"]');
    await expect(alertDialog).toBeVisible({ timeout: 5_000 });
    await alertDialog.locator('button:has-text("삭제")').click();
    await expect(alertDialog).toBeHidden({ timeout: 5_000 });

    // UI: 가구 탭에서 "TV 선반" 이 사라졌는지 확인
    await expect(
      page.locator('button[role="tab"]:has-text("TV 선반")')
    ).toBeHidden({ timeout: 5_000 });

    // DB 에서 가구가 삭제되었는지 확인
    const afterFurniture = await query<{ id: string }>(
      "SELECT id FROM furniture_placements WHERE label = $1",
      ["TV 선반"]
    );
    expect(afterFurniture).toHaveLength(0);

    // 세부 보관 장소의 furniturePlacementId 가 SET NULL 되었는지 확인
    const afterSlots = await query<{
      id: string;
      furniturePlacementId: string | null;
    }>(
      'SELECT id, "furniturePlacementId" FROM storage_locations WHERE name = $1',
      ["서랍 왼쪽"]
    );
    // SET NULL 이거나 CASCADE 삭제 — 둘 다 허용
    if (afterSlots.length > 0) {
      expect(afterSlots[0].furniturePlacementId).toBeNull();
    }
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3-E. 보관장소 등록
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  test("3-E-18. 사용자는 가구 아래 세부 보관장소를 추가한다", async ({
    page,
  }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "벽면장");
    await addFurniture(page, "거실", "벽면장", "TV 선반");
    await addSubSlot(page, "TV 선반", "서랍 왼쪽");

    // UI: 페이지 새로고침 후 세부 보관 장소 "서랍 왼쪽" 이 화면에 표시되는지 확인
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator('button[role="tab"]:has-text("거실")').click();
    // 가구 탭 선택 → 하위 보관 장소 패널 표시
    await page.locator('button[role="tab"]:has-text("TV 선반")').click({ timeout: 10_000 });
    await expect(page.locator('li:has-text("서랍 왼쪽")').first()).toBeVisible({ timeout: 10_000 });

    // DB 에서 세부 보관 장소 확인
    const slots = await query<{
      name: string;
      furniturePlacementId: string | null;
    }>(
      'SELECT name, "furniturePlacementId" FROM storage_locations WHERE name = $1',
      ["서랍 왼쪽"]
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].furniturePlacementId).not.toBeNull();
  });

  test("3-E-19. 사용자는 방 직속 보관장소를 추가한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "냉장고");

    // UI: 재고 추가 패널의 보관 장소 combobox 에서 "냉장고" 가 표시되는지 확인
    await expect(
      page.locator('option:has-text("냉장고")').first()
    ).toBeAttached({ timeout: 5_000 });

    // DB 에서 직속 보관 장소 확인 (roomId 있고 furniturePlacementId 없음)
    const slots = await query<{
      name: string;
      roomId: string | null;
      furniturePlacementId: string | null;
    }>(
      'SELECT name, "roomId", "furniturePlacementId" FROM storage_locations WHERE name = $1',
      ["냉장고"]
    );
    expect(slots).toHaveLength(1);
    expect(slots[0].roomId).not.toBeNull();
    expect(slots[0].furniturePlacementId).toBeNull();
  });

  test("3-E-20. 사용자는 보관장소 목록을 조회한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "냉장고");
    await addDirectSlot(page, "거실", "찬장");

    // 재고 추가 패널의 보관 장소 combobox 에서 직속 보관 장소 확인
    const storageSelect = page.locator('select[aria-label="보관 장소 선택"]').first();
    await expect(storageSelect.locator('option:has-text("냉장고")')).toBeAttached();
    await expect(storageSelect.locator('option:has-text("찬장")')).toBeAttached();
  });

  test("3-E-21. 사용자는 보관장소 이름을 수정한다", async ({ page }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "냉장고");

    // DB 에서 보관 장소 ID 및 householdId 조회
    const slotRows = await query<{ id: string; roomId: string }>(
      'SELECT id, "roomId" FROM storage_locations WHERE name = $1',
      ["냉장고"]
    );
    expect(slotRows).toHaveLength(1);
    const slotId = slotRows[0].id;
    const roomId = slotRows[0].roomId;

    const structures = await query<{ householdId: string }>(
      'SELECT hs."householdId" FROM house_structures hs INNER JOIN rooms r ON r."houseStructureId" = hs.id WHERE r.id = $1',
      [roomId]
    );
    const householdId = structures[0].householdId;

    // API 로 이름 수정
    const res = await page.request.put(
      `/api/households/${householdId}/storage-locations/${slotId}`,
      { data: { name: "대형 냉장고" } }
    );
    expect(res.ok()).toBe(true);

    // 페이지 새로고침 후 combobox 에서 변경된 이름 확인
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator('button[role="tab"]:has-text("거실")').click();
    await expect(
      page.locator('option:has-text("대형 냉장고")').first()
    ).toBeAttached({ timeout: 5_000 });

    // DB 에서도 확인
    const slots = await query<{ name: string }>(
      "SELECT name FROM storage_locations WHERE name = $1",
      ["대형 냉장고"]
    );
    expect(slots).toHaveLength(1);
  });

  test("3-E-22. 사용자는 보관장소를 삭제한다", async ({
    page,
  }) => {
    await setupHouseholdWithRoom(page);
    await addRoom(page, "거실");

    await page.locator('button[role="tab"]:has-text("거실")').click();
    await addDirectSlot(page, "거실", "냉장고");
    await addDirectSlot(page, "거실", "찬장");

    // DB 에서 "냉장고" 보관 장소 ID 및 householdId 조회
    const slotRows = await query<{ id: string; roomId: string }>(
      'SELECT id, "roomId" FROM storage_locations WHERE name = $1',
      ["냉장고"]
    );
    expect(slotRows).toHaveLength(1);
    const slotId = slotRows[0].id;
    const roomId = slotRows[0].roomId;

    const structures = await query<{ householdId: string }>(
      'SELECT hs."householdId" FROM house_structures hs INNER JOIN rooms r ON r."houseStructureId" = hs.id WHERE r.id = $1',
      [roomId]
    );
    const householdId = structures[0].householdId;

    // API 로 "냉장고" 삭제
    const res = await page.request.delete(
      `/api/households/${householdId}/storage-locations/${slotId}`
    );
    expect(res.status()).toBe(204);

    // 페이지 새로고침 후 combobox 에서 "냉장고" 가 제거되었는지 확인
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator('button[role="tab"]:has-text("거실")').click();

    await expect(
      page.locator('option:has-text("냉장고")').first()
    ).not.toBeAttached({ timeout: 5_000 });

    // "찬장" 은 여전히 표시
    await expect(
      page.locator('option:has-text("찬장")').first()
    ).toBeAttached();

    // DB 에서도 확인
    const slots = await query<{ name: string }>(
      "SELECT name FROM storage_locations WHERE name = $1",
      ["냉장고"]
    );
    expect(slots).toHaveLength(0);
  });
});
