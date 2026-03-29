import { IsIn, IsNotEmpty, IsUUID } from 'class-validator';

export class AddMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsIn(['admin', 'editor', 'viewer'])
  role: 'admin' | 'editor' | 'viewer';
}
