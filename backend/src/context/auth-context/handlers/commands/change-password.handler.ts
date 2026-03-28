import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../../domain/user/user.service';

export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
  ) {}
}

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordCommand>
{
  constructor(private readonly userService: UserService) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const user = await this.userService.ID로_사용자를_조회한다(command.userId);
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    const isCurrentValid = await bcrypt.compare(
      command.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
    }

    user.passwordHash = await bcrypt.hash(command.newPassword, 10);
    user.refreshTokenHash = null;
    await this.userService.사용자를_저장한다(user);
  }
}
