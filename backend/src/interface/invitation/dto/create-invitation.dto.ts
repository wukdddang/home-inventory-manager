import { IsEmail, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateInvitationDto {
  @IsIn(['admin', 'editor', 'viewer'])
  role: 'admin' | 'editor' | 'viewer';

  @IsOptional()
  @IsEmail()
  inviteeEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;
}
