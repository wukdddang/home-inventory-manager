// ── Command DTOs ──

export class CreateProductVariantData {
    productId: string;
    unitId: string;
    quantityPerUnit: number;
    name?: string | null;
    price?: number | null;
    sku?: string | null;
    isDefault?: boolean;
}

export class UpdateProductVariantData {
    unitId?: string;
    quantityPerUnit?: number;
    name?: string | null;
    price?: number | null;
    sku?: string | null;
    isDefault?: boolean;
}

// ── Result DTOs ──

export class ProductVariantResult {
    id: string;
    productId: string;
    unitId: string;
    quantityPerUnit: number;
    name: string | null;
    price: number | null;
    sku: string | null;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
