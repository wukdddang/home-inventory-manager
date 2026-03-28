import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserService } from '../../../../domain/user/user.service';

export class LogoutCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: LogoutCommand): Promise<void> {
    const user = await this.userService.ID로_사용자를_조회한다(command.userId);
    if (user) {
      user.refreshTokenHash = null;
      await this.userService.사용자를_저장한다(user);
    }
  }
}
