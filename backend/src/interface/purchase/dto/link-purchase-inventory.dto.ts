import { IsUUID } from 'class-validator';

export class LinkPurchaseInventoryDto {
  @IsUUID()
  inventoryItemId: string;
}
