import { IsIn } from 'class-validator';

export class ChangeMemberRoleDto {
  @IsIn(['admin', 'editor', 'viewer'])
  role: 'admin' | 'editor' | 'viewer';
}
