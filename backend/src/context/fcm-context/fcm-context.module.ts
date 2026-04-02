import { Module } from '@nestjs/common';
import { UserDeviceTokenModule } from '../../domain/user-device-token/user-device-token.module';
import { FcmService } from './fcm.service';
import { FcmContextService } from './fcm-context.service';

@Module({
  imports: [UserDeviceTokenModule],
  providers: [FcmService, FcmContextService],
  exports: [FcmService, FcmContextService],
})
export class FcmContextModule {}
