import { Injectable } from '@nestjs/common';
import { UserDeviceTokenService } from '../../domain/user-device-token/user-device-token.service';
import { UserDeviceToken } from '../../domain/user-device-token/user-device-token.entity';

@Injectable()
export class FcmContextService {
  constructor(
    private readonly userDeviceTokenService: UserDeviceTokenService,
  ) {}

  async 토큰을_등록한다(data: {
    userId: string;
    token: string;
    platform: 'web' | 'android' | 'ios';
    deviceInfo?: string | null;
  }): Promise<UserDeviceToken> {
    return this.userDeviceTokenService.토큰을_등록한다(data);
  }

  async 내_토큰_목록을_조회한다(
    userId: string,
  ): Promise<UserDeviceToken[]> {
    return this.userDeviceTokenService.사용자의_활성_토큰을_조회한다(userId);
  }

  async 토큰을_삭제한다(
    token: string,
    userId: string,
  ): Promise<boolean> {
    return this.userDeviceTokenService.토큰을_삭제한다(token, userId);
  }
}
