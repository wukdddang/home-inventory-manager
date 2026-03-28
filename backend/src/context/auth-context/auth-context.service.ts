import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  AuthTokenResult,
  SignupData,
  LoginData,
  ChangePasswordData,
  UserProfileResult,
} from './interfaces/auth-context.interface';
import { SignupCommand } from './handlers/commands/signup.handler';
import { LoginCommand } from './handlers/commands/login.handler';
import { RefreshTokenCommand } from './handlers/commands/refresh-token.handler';
import { LogoutCommand } from './handlers/commands/logout.handler';
import { VerifyEmailCommand } from './handlers/commands/verify-email.handler';
import { ChangePasswordCommand } from './handlers/commands/change-password.handler';
import { GetMyProfileQuery } from './handlers/queries/get-my-profile.handler';

@Injectable()
export class AuthContextService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async 회원가입을_한다(data: SignupData): Promise<AuthTokenResult> {
    return this.commandBus.execute(
      new SignupCommand(data.email, data.password, data.displayName),
    );
  }

  async 로그인을_한다(data: LoginData): Promise<AuthTokenResult> {
    return this.commandBus.execute(
      new LoginCommand(data.email, data.password),
    );
  }

  async 토큰을_갱신한다(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokenResult> {
    return this.commandBus.execute(
      new RefreshTokenCommand(userId, refreshToken),
    );
  }

  async 로그아웃을_한다(userId: string): Promise<void> {
    return this.commandBus.execute(new LogoutCommand(userId));
  }

  async 이메일_인증을_완료한다(token: string): Promise<void> {
    return this.commandBus.execute(new VerifyEmailCommand(token));
  }

  async 비밀번호를_변경한다(data: ChangePasswordData): Promise<void> {
    return this.commandBus.execute(
      new ChangePasswordCommand(
        data.userId,
        data.currentPassword,
        data.newPassword,
      ),
    );
  }

  async 내_정보를_조회한다(userId: string): Promise<UserProfileResult> {
    return this.queryBus.execute(new GetMyProfileQuery(userId));
  }
}
