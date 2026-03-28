import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UserService } from '../../../../domain/user/user.service';
import { UserProfileResult } from '../../interfaces/auth-context.interface';

export class GetMyProfileQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetMyProfileQuery)
export class GetMyProfileHandler
  implements IQueryHandler<GetMyProfileQuery>
{
  constructor(private readonly userService: UserService) {}

  async execute(query: GetMyProfileQuery): Promise<UserProfileResult> {
    const user = await this.userService.ID로_사용자를_조회한다(query.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
