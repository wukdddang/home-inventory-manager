import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../../domain/user/user.service';
import { AuthTokenResult } from '../../interfaces/auth-context.interface';

export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: LoginCommand): Promise<AuthTokenResult> {
    const user = await this.userService.이메일로_사용자를_조회한다(
      command.email,
    );
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const isPasswordValid = await bcrypt.compare(
      command.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    user.lastLoginAt = new Date();

    const tokens = await this.토큰을_발급한다(user.id, user.email);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userService.사용자를_저장한다(user);

    return tokens;
  }

  private async 토큰을_발급한다(
    userId: string,
    email: string,
  ): Promise<AuthTokenResult> {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      },
    );
    return { accessToken, refreshToken };
  }
}
