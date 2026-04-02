import { Module } from '@nestjs/common';
import { FcmContextModule } from '../../context/fcm-context/fcm-context.module';
import { FcmBusinessService } from './fcm-business.service';

@Module({
  imports: [FcmContextModule],
  providers: [FcmBusinessService],
  exports: [FcmBusinessService],
})
export class FcmBusinessModule {}
