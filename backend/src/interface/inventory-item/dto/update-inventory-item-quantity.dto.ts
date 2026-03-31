import { IsNumber, Min } from 'class-validator';

export class UpdateInventoryItemQuantityDto {
  @IsNumber()
  @Min(0)
  quantity: number;
}
