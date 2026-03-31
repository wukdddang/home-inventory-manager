import {
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsUUID()
  productVariantId: string;

  @IsUUID()
  storageLocationId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockLevel?: number;
}
