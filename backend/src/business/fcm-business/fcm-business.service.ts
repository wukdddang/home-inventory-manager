import { Injectable } from '@nestjs/common';
import { FcmContextService } from '../../context/fcm-context/fcm-context.service';

@Injectable()
export class FcmBusinessService {
  constructor(
    private readonly fcmContextService: FcmContextService,
  ) {}

  async 토큰을_등록한다(data: {
    userId: string;
    token: string;
    platform: 'web' | 'android' | 'ios';
    deviceInfo?: string | null;
  }) {
    return this.fcmContextService.토큰을_등록한다(data);
  }

  async 내_토큰_목록을_조회한다(userId: string) {
    return this.fcmContextService.내_토큰_목록을_조회한다(userId);
  }

  async 토큰을_삭제한다(token: string, userId: string) {
    return this.fcmContextService.토큰을_삭제한다(token, userId);
  }
}
