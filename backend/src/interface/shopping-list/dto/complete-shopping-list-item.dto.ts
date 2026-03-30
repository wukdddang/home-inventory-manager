import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CompleteShoppingListItemDto {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
