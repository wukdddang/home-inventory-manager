import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UserService } from '../../../../domain/user/user.service';

export class VerifyEmailCommand {
  constructor(public readonly token: string) {}
}

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler
  implements ICommandHandler<VerifyEmailCommand>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: VerifyEmailCommand): Promise<void> {
    const user = await this.userService.인증토큰으로_사용자를_조회한다(
      command.token,
    );
    if (!user) {
      throw new NotFoundException('유효하지 않은 인증 토큰입니다');
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    await this.userService.사용자를_저장한다(user);
  }
}
