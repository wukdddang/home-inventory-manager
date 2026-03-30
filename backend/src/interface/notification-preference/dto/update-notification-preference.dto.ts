import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  notifyExpiration?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyShopping?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyLowStock?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  expirationDaysBefore?: number;

  @IsOptional()
  @IsString()
  expirationRuleScope?: string;

  @IsOptional()
  @IsBoolean()
  notifyExpiredLots?: boolean;

  @IsOptional()
  @IsBoolean()
  expirationSameDayReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  shoppingNotifyListUpdates?: boolean;

  @IsOptional()
  @IsBoolean()
  shoppingTripReminder?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  shoppingTripReminderWeekday?: number;

  @IsOptional()
  @IsBoolean()
  lowStockRespectMinLevel?: boolean;
}
