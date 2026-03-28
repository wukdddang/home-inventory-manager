import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserService } from '../../../../domain/user/user.service';
import { MailService } from '../../../../common/infrastructure/mail/mail.service';
import { AuthTokenResult } from '../../interfaces/auth-context.interface';

export class SignupCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly displayName: string,
  ) {}
}

@CommandHandler(SignupCommand)
export class SignupHandler implements ICommandHandler<SignupCommand> {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async execute(command: SignupCommand): Promise<AuthTokenResult> {
    const existing = await this.userService.이메일로_사용자를_조회한다(
      command.email,
    );
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다');
    }

    const passwordHash = await bcrypt.hash(command.password, 10);
    const emailVerificationToken = randomUUID();

    const user = await this.userService.사용자를_생성한다({
      email: command.email,
      passwordHash,
      displayName: command.displayName,
      emailVerificationToken,
    });

    const tokens = await this.토큰을_발급한다(user.id, user.email);

    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userService.사용자를_저장한다(user);

    await this.mailService.인증_이메일을_발송한다(
      user.email,
      emailVerificationToken,
    );

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
