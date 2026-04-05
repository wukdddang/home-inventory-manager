import { query } from "./db";

/**
 * DB 직접 INSERT 를 통해 테스트 사전 데이터를 준비하는 시드 헬퍼.
 *
 * - 회원가입 / 로그인 / 거점 생성은 UI 를 통해 수행한 뒤,
 *   householdId 를 넘겨 받아 나머지 카탈로그·재고 데이터를 INSERT 한다.
 * - 모든 ID 는 DB 의 uuid_generate_v4() 로 생성한다.
 */

// ── house_structure ──

export async function seedHouseStructure(
  householdId: string,
  name = "default",
): Promise<string> {
  // householdId 에 UNIQUE 제약이 있으므로 upsert 처리
  const rows = await query<{ id: string }>(
    `INSERT INTO house_structures ("id", "householdId", "name", "structurePayload", "diagramLayout", "version", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, '{"rooms":{}}'::jsonb, NULL, 1, NOW(), NOW())
     ON CONFLICT ("householdId") DO UPDATE SET "updatedAt" = NOW()
     RETURNING id`,
    [householdId, name],
  );
  return rows[0].id;
}

// ── room ──

export async function seedRoom(
  houseStructureId: string,
  displayName: string,
  sortOrder = 0,
): Promise<string> {
  const key = `room-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const rows = await query<{ id: string }>(
    `INSERT INTO rooms ("id", "houseStructureId", "structureRoomKey", "displayName", "sortOrder", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
    [houseStructureId, key, displayName, sortOrder],
  );
  return rows[0].id;
}

// ── storage_location ──

export async function seedStorageLocation(
  householdId: string,
  roomId: string,
  name: string,
  sortOrder = 0,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO storage_locations ("id", "householdId", "name", "roomId", "furniturePlacementId", "sortOrder", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, NULL, $4, NOW(), NOW())
     RETURNING id`,
    [householdId, name, roomId, sortOrder],
  );
  return rows[0].id;
}

// ── category ──

export async function seedCategory(
  householdId: string,
  name: string,
  sortOrder = 0,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO categories ("id", "householdId", "name", "sortOrder", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, NOW(), NOW())
     RETURNING id`,
    [householdId, name, sortOrder],
  );
  return rows[0].id;
}

// ── unit ──

export async function seedUnit(
  householdId: string,
  symbol: string,
  name: string | null = null,
  sortOrder = 0,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO units ("id", "householdId", "symbol", "name", "sortOrder", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
    [householdId, symbol, name, sortOrder],
  );
  return rows[0].id;
}

// ── product ──

export async function seedProduct(
  householdId: string,
  categoryId: string,
  name: string,
  isConsumable = true,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO products ("id", "householdId", "categoryId", "name", "isConsumable", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
    [householdId, categoryId, name, isConsumable],
  );
  return rows[0].id;
}

// ── product_variant ──

export async function seedProductVariant(
  productId: string,
  unitId: string,
  quantityPerUnit: number,
  name: string | null = null,
  isDefault = true,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO product_variants ("id", "productId", "unitId", "quantityPerUnit", "name", "isDefault", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING id`,
    [productId, unitId, quantityPerUnit, name, isDefault],
  );
  return rows[0].id;
}

// ── inventory_item ──

export async function seedInventoryItem(
  productVariantId: string,
  storageLocationId: string,
  quantity: number,
  minStockLevel: number | null = null,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO inventory_items ("id", "productVariantId", "storageLocationId", "quantity", "minStockLevel", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, NOW(), NOW())
     RETURNING id`,
    [productVariantId, storageLocationId, quantity, minStockLevel],
  );
  return rows[0].id;
}

// ── purchase + purchase_batch ──

export async function seedPurchase(
  householdId: string,
  opts: {
    inventoryItemId?: string | null;
    unitPrice: number;
    purchasedAt: string;
    supplierName?: string | null;
    itemName?: string | null;
    variantCaption?: string | null;
    unitSymbol?: string | null;
    memo?: string | null;
    userId?: string | null;
  },
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO purchases ("id", "householdId", "inventoryItemId", "unitPrice", "purchasedAt", "supplierName", "itemName", "variantCaption", "unitSymbol", "memo", "userId", "createdAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     RETURNING id`,
    [
      householdId,
      opts.inventoryItemId ?? null,
      opts.unitPrice,
      opts.purchasedAt,
      opts.supplierName ?? null,
      opts.itemName ?? null,
      opts.variantCaption ?? null,
      opts.unitSymbol ?? null,
      opts.memo ?? null,
      opts.userId ?? null,
    ],
  );
  return rows[0].id;
}

export async function seedPurchaseBatch(
  purchaseId: string,
  quantity: number,
  expirationDate: string | null = null,
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO purchase_batches ("id", "purchaseId", "quantity", "expirationDate", "createdAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, NOW())
     RETURNING id`,
    [purchaseId, quantity, expirationDate],
  );
  return rows[0].id;
}

// ── shopping_list_item ──

export async function seedShoppingListItem(
  householdId: string,
  opts: {
    categoryId?: string | null;
    productId?: string | null;
    productVariantId?: string | null;
    sourceInventoryItemId?: string | null;
    quantity?: number | null;
    memo?: string | null;
    sortOrder?: number;
  },
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO shopping_list_items ("id", "householdId", "categoryId", "productId", "productVariantId", "sourceInventoryItemId", "targetStorageLocationId", "quantity", "sortOrder", "memo", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NULL, $6, $7, $8, NOW(), NOW())
     RETURNING id`,
    [
      householdId,
      opts.categoryId ?? null,
      opts.productId ?? null,
      opts.productVariantId ?? null,
      opts.sourceInventoryItemId ?? null,
      opts.quantity ?? null,
      opts.sortOrder ?? 0,
      opts.memo ?? null,
    ],
  );
  return rows[0].id;
}

// ── household_invitation ──

export async function seedInvitation(
  householdId: string,
  invitedByUserId: string,
  opts: {
    role?: string;
    token?: string;
    status?: string;
    inviteeEmail?: string | null;
    expiresInDays?: number;
  },
): Promise<{ id: string; token: string }> {
  const token =
    opts.token ?? `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rows = await query<{ id: string }>(
    `INSERT INTO household_invitations ("id", "householdId", "invitedByUserId", "role", "token", "status", "inviteeEmail", "expiresAt", "createdAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW() + make_interval(days => $7), NOW())
     RETURNING id`,
    [
      householdId,
      invitedByUserId,
      opts.role ?? "editor",
      token,
      opts.status ?? "pending",
      opts.inviteeEmail ?? null,
      opts.expiresInDays ?? 7,
    ],
  );
  return { id: rows[0].id, token };
}

// ── appliance ──

export async function seedAppliance(
  householdId: string,
  userId: string,
  opts: {
    name: string;
    brand?: string | null;
    modelName?: string | null;
    roomId?: string | null;
    purchasedAt?: string | null;
    warrantyExpiresAt?: string | null;
    status?: "active" | "retired";
  },
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO appliances ("id", "householdId", "userId", "roomId", "name", "brand", "modelName", "purchasedAt", "warrantyExpiresAt", "status", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     RETURNING id`,
    [
      householdId,
      userId,
      opts.roomId ?? null,
      opts.name,
      opts.brand ?? null,
      opts.modelName ?? null,
      opts.purchasedAt ?? null,
      opts.warrantyExpiresAt ?? null,
      opts.status ?? "active",
    ],
  );
  return rows[0].id;
}

// ── maintenance_schedule ──

export async function seedMaintenanceSchedule(
  applianceId: string,
  opts: {
    taskName: string;
    recurrenceRule?: object;
    nextOccurrenceAt: string;
    isActive?: boolean;
  },
): Promise<string> {
  const rule = opts.recurrenceRule ?? { frequency: "monthly", interval: 1 };
  const rows = await query<{ id: string }>(
    `INSERT INTO maintenance_schedules ("id", "applianceId", "taskName", "recurrenceRule", "nextOccurrenceAt", "isActive", "createdAt", "updatedAt")
     VALUES (uuid_generate_v4(), $1, $2, $3::jsonb, $4, $5, NOW(), NOW())
     RETURNING id`,
    [
      applianceId,
      opts.taskName,
      JSON.stringify(rule),
      opts.nextOccurrenceAt,
      opts.isActive ?? true,
    ],
  );
  return rows[0].id;
}

// ── maintenance_log ──

export async function seedMaintenanceLog(
  applianceId: string,
  opts: {
    type: "scheduled" | "repair" | "inspection" | "other";
    description: string;
    maintenanceScheduleId?: string | null;
    servicedBy?: string | null;
    cost?: number | null;
    performedAt: string;
  },
): Promise<string> {
  const rows = await query<{ id: string }>(
    `INSERT INTO maintenance_logs ("id", "applianceId", "maintenanceScheduleId", "type", "description", "servicedBy", "cost", "performedAt", "createdAt")
     VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING id`,
    [
      applianceId,
      opts.maintenanceScheduleId ?? null,
      opts.type,
      opts.description,
      opts.servicedBy ?? null,
      opts.cost ?? null,
      opts.performedAt,
    ],
  );
  return rows[0].id;
}

// ── 복합 시드: 카탈로그 + 재고 일괄 생성 ──

export interface FullSeedResult {
  householdId: string;
  houseStructureId: string;
  roomId: string;
  storageLocationId: string;
  categoryId: string;
  unitId: string;
  productId: string;
  variantId: string;
  inventoryItemId: string;
}

/**
 * 거점 아래에 방·보관장소·카테고리·단위·상품·변형·재고를 한 번에 시드한다.
 * signupAndWait + createHousehold 로 거점을 UI로 만든 뒤 호출한다.
 */
export async function seedFullCatalogAndInventory(
  householdId: string,
  opts?: {
    roomName?: string;
    storageName?: string;
    categoryName?: string;
    unitSymbol?: string;
    productName?: string;
    variantName?: string | null;
    variantQty?: number;
    inventoryQuantity?: number;
    minStockLevel?: number | null;
  },
): Promise<FullSeedResult> {
  const o = {
    roomName: "주방",
    storageName: "냉장고",
    categoryName: "식료품",
    unitSymbol: "팩",
    productName: "우유",
    variantName: "1L" as string | null,
    variantQty: 1,
    inventoryQuantity: 10,
    minStockLevel: null as number | null,
    ...opts,
  };

  const houseStructureId = await seedHouseStructure(householdId);
  const roomId = await seedRoom(houseStructureId, o.roomName);
  const storageLocationId = await seedStorageLocation(householdId, roomId, o.storageName);
  const categoryId = await seedCategory(householdId, o.categoryName);
  const unitId = await seedUnit(householdId, o.unitSymbol);
  const productId = await seedProduct(householdId, categoryId, o.productName);
  const variantId = await seedProductVariant(productId, unitId, o.variantQty, o.variantName);
  const inventoryItemId = await seedInventoryItem(variantId, storageLocationId, o.inventoryQuantity, o.minStockLevel);

  return {
    householdId,
    houseStructureId,
    roomId,
    storageLocationId,
    categoryId,
    unitId,
    productId,
    variantId,
    inventoryItemId,
  };
}
