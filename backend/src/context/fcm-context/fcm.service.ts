import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { UserDeviceTokenService } from '../../domain/user-device-token/user-device-token.service';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly userDeviceTokenService: UserDeviceTokenService,
  ) {}

  onModuleInit() {
    const serviceAccountJson = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_JSON',
    );
    const serviceAccountPath = this.configService.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
    );

    if (!serviceAccountJson && !serviceAccountPath) {
      this.logger.warn(
        'Firebase 서비스 계정이 설정되지 않았습니다. FCM 푸시 알림이 비활성화됩니다.',
      );
      return;
    }

    try {
      const credential = serviceAccountJson
        ? admin.credential.cert(JSON.parse(serviceAccountJson))
        : admin.credential.cert(serviceAccountPath!);

      admin.initializeApp({ credential });
      this.initialized = true;
      this.logger.log('Firebase Admin SDK 초기화 완료');
    } catch (error) {
      this.logger.error('Firebase Admin SDK 초기화 실패', error);
    }
  }

  async 사용자에게_푸시를_전송한다(
    userId: string,
    title: string,
    body: string,
    link?: string,
  ): Promise<void> {
    if (!this.initialized) return;

    const tokens =
      await this.userDeviceTokenService.사용자의_활성_토큰을_조회한다(userId);
    if (tokens.length === 0) return;

    await this.다수_토큰에_푸시를_전송한다(
      tokens.map((t) => t.token),
      title,
      body,
      link,
    );
  }

  async 다수_사용자에게_푸시를_전송한다(
    userIds: string[],
    title: string,
    body: string,
    link?: string,
  ): Promise<void> {
    if (!this.initialized || userIds.length === 0) return;

    const tokens =
      await this.userDeviceTokenService.다수_사용자의_활성_토큰을_조회한다(
        userIds,
      );
    if (tokens.length === 0) return;

    await this.다수_토큰에_푸시를_전송한다(
      tokens.map((t) => t.token),
      title,
      body,
      link,
    );
  }

  private async 다수_토큰에_푸시를_전송한다(
    tokens: string[],
    title: string,
    body: string,
    link?: string,
  ): Promise<void> {
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      webpush: link ? { fcmOptions: { link } } : undefined,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(tokens[idx]);
            } else {
              this.logger.warn(`FCM 전송 실패 [${tokens[idx]}]: ${code}`);
            }
          }
        });

        if (invalidTokens.length > 0) {
          await this.userDeviceTokenService.토큰을_일괄_비활성화한다(
            invalidTokens,
          );
          this.logger.log(
            `무효 토큰 ${invalidTokens.length}건 비활성화 처리`,
          );
        }
      }
    } catch (error) {
      this.logger.error('FCM 멀티캐스트 전송 실패', error);
    }
  }
}
