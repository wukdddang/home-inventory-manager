// ── Command DTOs ──

export class CreateProductData {
    householdId: string;
    categoryId: string;
    name: string;
    isConsumable: boolean;
    imageUrl?: string | null;
    description?: string | null;
}

export class UpdateProductData {
    categoryId?: string;
    name?: string;
    isConsumable?: boolean;
    imageUrl?: string | null;
    description?: string | null;
}

// ── Result DTOs ──

export class ProductResult {
    id: string;
    householdId: string;
    categoryId: string;
    name: string;
    isConsumable: boolean;
    imageUrl: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}
