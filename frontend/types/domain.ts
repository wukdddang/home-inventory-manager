/**
 * 프론트 UI·로컬 저장용 타입 (백엔드 ERD: Household, StorageLocation, InventoryItem 정렬)
 */

export type HouseholdKind = "home" | "office" | "vehicle" | "other";

/** 2D 구조 방 — house-structure-feature.md 의 rooms[] 와 동일 개념 */
export type StructureRoom = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type InventoryRow = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  roomId: string;
  notes?: string;
};

export type Household = {
  id: string;
  name: string;
  kind: HouseholdKind;
  rooms: StructureRoom[];
  items: InventoryRow[];
  createdAt: string;
};

export type AuthUser = {
  email: string;
  displayName: string;
};

export type GroupMember = {
  id: string;
  email: string;
  role: "owner" | "member";
  label?: string;
};

export type AppSettings = {
  notifyExpiration: boolean;
  notifyShopping: boolean;
  notifyLowStock: boolean;
  groups: GroupMember[];
};

export const DEFAULT_SETTINGS: AppSettings = {
  notifyExpiration: true,
  notifyShopping: true,
  notifyLowStock: false,
  groups: [],
};
