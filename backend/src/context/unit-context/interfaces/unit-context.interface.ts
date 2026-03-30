// ── Command DTOs ──

export class CreateUnitData {
    householdId: string;
    symbol: string;
    name?: string | null;
    sortOrder?: number;
}

export class UpdateUnitData {
    symbol?: string;
    name?: string | null;
    sortOrder?: number;
}

// ── Result DTOs ──

export class UnitResult {
    id: string;
    householdId: string;
    symbol: string;
    name: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
