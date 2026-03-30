import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseBatchDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}

export class CreatePurchaseDto {
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsDateString()
  purchasedAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  supplierName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  itemName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  variantCaption?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitSymbol?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseBatchDto)
  batches: CreatePurchaseBatchDto[];
}
