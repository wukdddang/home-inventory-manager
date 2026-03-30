import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateExpirationAlertRuleDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  daysBefore?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
