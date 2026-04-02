import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(['web', 'android', 'ios'])
  platform: 'web' | 'android' | 'ios';

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
