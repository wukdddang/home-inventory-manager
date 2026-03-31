import type {
  FurniturePlacement,
  GroupMember,
  Household,
  HouseholdKindDefinition,
  HouseholdStructureDiagramLayout,
  InventoryRow,
  MemberRole,
  MockInvitation,
  ProductCatalog,
  StorageLocationRow,
  StructureRoom,
} from "@/types/domain";

export type CreateInvitationParams = {
  role: MemberRole;
  inviteeEmail?: string;
  expiresInDays?: number;
};

/**
 * 대시보드 거점 데이터 소스 포트.
 * mock 모드와 api 모드 모두 이 인터페이스를 구현한다.
 */
export type DashboardHouseholdsPort = {
  // ── 거점 목록 (읽기) ──
  list(): Promise<Household[]>;

  // ── 거점 CRUD ──
  create(name: string, kind: string): Promise<Household>;
  update(id: string, updates: { name?: string; kind?: string }): Promise<Household>;
  remove(id: string): Promise<void>;

  // ── 전체 스냅샷 저장 (mock 전용, api 모드는 no-op) ──
  saveAll(households: Household[]): Promise<void>;

  // ── 거점 유형 정의 ──
  listKinds(): Promise<HouseholdKindDefinition[]>;
  saveKinds(items: HouseholdKindDefinition[]): Promise<void>;

  // ── 멤버 관리 ──
  listMembers(householdId: string): Promise<GroupMember[]>;
  changeMemberRole(householdId: string, memberId: string, role: MemberRole): Promise<void>;
  removeMember(householdId: string, memberId: string): Promise<void>;

  // ── 초대 ──
  listInvitations(householdId: string): Promise<MockInvitation[]>;
  createInvitation(householdId: string, params: CreateInvitationParams): Promise<MockInvitation>;
  revokeInvitation(householdId: string, invitationId: string): Promise<void>;

  // ── 방 / 집 구조 (API 전용; mock은 no-op 또는 패스스루) ──
  /**
   * 논리적 방 목록을 서버에 동기화한다 (PUT /rooms/sync).
   * 서버에서 할당된 UUID가 포함된 StructureRoom 배열을 반환한다.
   */
  syncRooms(householdId: string, rooms: StructureRoom[]): Promise<StructureRoom[]>;
  /** 집 구조(2D 좌표 + 다이어그램 레이아웃)를 서버에 저장한다 (PUT /house-structure). */
  saveHouseStructure(
    householdId: string,
    rooms: StructureRoom[],
    layout?: HouseholdStructureDiagramLayout,
  ): Promise<void>;

  // ── 가구 배치 CUD (API 전용; mock은 no-op) ──
  /** 방에 가구 배치를 생성한다 (POST /rooms/:roomId/furniture-placements). */
  createFurniturePlacement(
    householdId: string,
    roomId: string,
    label: string,
    anchorDirectStorageId?: string | null,
    sortOrder?: number,
  ): Promise<FurniturePlacement>;
  /** 가구 배치를 수정한다 (PUT /furniture-placements/:id). */
  patchFurniturePlacement(
    householdId: string,
    id: string,
    patch: { anchorDirectStorageId?: string | null },
  ): Promise<void>;
  /** 가구 배치를 삭제한다 (DELETE /furniture-placements/:id). */
  removeFurniturePlacement(householdId: string, id: string): Promise<void>;

  // ── 보관 장소 CUD (API 전용; mock은 no-op) ──
  /** 보관 장소를 생성한다 (POST /storage-locations). */
  createStorageLocation(
    householdId: string,
    data: {
      name: string;
      roomId?: string | null;
      furniturePlacementId?: string | null;
      sortOrder?: number;
    },
  ): Promise<StorageLocationRow>;
  /** 보관 장소 이름을 수정한다 (PUT /storage-locations/:id). */
  updateStorageLocation(householdId: string, id: string, name: string): Promise<void>;
  /** 보관 장소를 삭제한다 (DELETE /storage-locations/:id). */
  removeStorageLocation(householdId: string, id: string): Promise<void>;

  // ── 카탈로그 동기화 (API 전용; mock은 no-op) ──
  syncCatalogDiff(
    householdId: string,
    before: ProductCatalog,
    after: ProductCatalog,
  ): Promise<void>;

  // ── 재고 기록 Side-effect (API 전용; mock은 no-op) ──
  recordInventoryConsumption(
    householdId: string,
    itemId: string,
    quantity: number,
    memo?: string,
  ): Promise<void>;
  recordInventoryWaste(
    householdId: string,
    itemId: string,
    quantity: number,
    reason: string,
    memo?: string,
  ): Promise<void>;

  // ── 재고 품목 CRUD (API 전용; mock은 로컬 처리) ──
  /** 재고 품목을 등록한다 (POST /inventory-items). 서버 할당 id가 포함된 InventoryRow 반환. */
  createInventoryItem(
    householdId: string,
    data: {
      productVariantId: string;
      storageLocationId: string;
      quantity: number;
      minStockLevel?: number;
    },
  ): Promise<Pick<InventoryRow, "id">>;

  /** 구매를 재고 품목에 나중에 연결한다 (PATCH /purchases/:pid/link-inventory). */
  linkPurchaseToInventoryItem(
    householdId: string,
    purchaseId: string,
    inventoryItemId: string,
  ): Promise<void>;

  /** 재고 수량을 수동 조정한다 (POST /inventory-items/:id/logs/adjustment). */
  recordInventoryAdjustment(
    householdId: string,
    itemId: string,
    quantityDelta: number,
    memo?: string,
  ): Promise<void>;
};
