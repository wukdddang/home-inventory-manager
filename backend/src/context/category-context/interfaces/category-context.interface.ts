// ── Command DTOs ──

export class CreateCategoryData {
  householdId: string;
  name: string;
  sortOrder?: number;
}

export class UpdateCategoryData {
  name?: string;
  sortOrder?: number;
}

// ── Result DTOs ──

export class CategoryResult {
  id: string;
  householdId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
