import { Module } from '@nestjs/common';
import { FcmBusinessModule } from '../../business/fcm-business/fcm-business.module';
import { FcmController } from './fcm.controller';

@Module({
  imports: [FcmBusinessModule],
  controllers: [FcmController],
})
export class FcmInterfaceModule {}
