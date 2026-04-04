// ── Command DTOs ──

export class SaveHouseStructureData {
  householdId: string;
  name: string;
  structurePayload: Record<string, any>;
  diagramLayout?: Record<string, any> | null;
}

export class SyncRoomsData {
  houseStructureId: string;
  rooms: {
    structureRoomKey: string;
    displayName?: string | null;
    sortOrder: number;
  }[];
}

export class CreateFurniturePlacementData {
  roomId: string;
  label: string;
  productId?: string | null;
  productVariantId?: string | null;
  anchorDirectStorageId?: string | null;
  sortOrder?: number;
  placementPayload?: Record<string, any> | null;
}

export class UpdateFurniturePlacementData {
  label?: string;
  productId?: string | null;
  productVariantId?: string | null;
  anchorDirectStorageId?: string | null;
  sortOrder?: number;
  placementPayload?: Record<string, any> | null;
}

export class CreateStorageLocationData {
  householdId: string;
  name: string;
  roomId?: string | null;
  furniturePlacementId?: string | null;
  applianceId?: string | null;
  sortOrder?: number;
}

export class UpdateStorageLocationData {
  name?: string;
  roomId?: string | null;
  furniturePlacementId?: string | null;
  applianceId?: string | null;
  sortOrder?: number;
}

// ── Result DTOs ──

export class HouseStructureResult {
  id: string;
  householdId: string;
  name: string;
  structurePayload: Record<string, any>;
  diagramLayout: Record<string, any> | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class RoomResult {
  id: string;
  houseStructureId: string;
  structureRoomKey: string;
  displayName: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class FurniturePlacementResult {
  id: string;
  roomId: string;
  label: string;
  productId: string | null;
  productVariantId: string | null;
  anchorDirectStorageId: string | null;
  sortOrder: number;
  placementPayload: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class StorageLocationResult {
  id: string;
  householdId: string;
  name: string;
  roomId: string | null;
  furniturePlacementId: string | null;
  applianceId: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
