// ── Command DTOs ──

export class CreateHouseholdData {
  userId: string;
  name: string;
  kind?: string;
}

export class UpdateHouseholdData {
  name?: string;
  kind?: string | null;
}

export class AddMemberData {
  householdId: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
}

export class ChangeMemberRoleData {
  role: 'admin' | 'editor' | 'viewer';
}

// ── Result DTOs ──

export class HouseholdResult {
  id: string;
  name: string;
  kind: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class HouseholdMemberResult {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date;
}
