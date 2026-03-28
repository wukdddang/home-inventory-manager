import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../../../../domain/user/user.service';
import { AuthTokenResult } from '../../interfaces/auth-context.interface';

export class RefreshTokenCommand {
  constructor(
    public readonly userId: string,
    public readonly refreshToken: string,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<AuthTokenResult> {
    const user = await this.userService.ID로_사용자를_조회한다(command.userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    const isTokenValid = await bcrypt.compare(
      command.refreshToken,
      user.refreshTokenHash,
    );
    if (!isTokenValid) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userService.사용자를_저장한다(user);

    return { accessToken, refreshToken };
  }
}
