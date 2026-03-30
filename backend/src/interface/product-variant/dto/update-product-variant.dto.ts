import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class UpdateProductVariantDto {
    @IsOptional()
    @IsUUID()
    unitId?: string;

    @IsOptional()
    @IsNumber()
    quantityPerUnit?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    sku?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
