import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class SaveExpirationAlertRuleDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  daysBefore: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
