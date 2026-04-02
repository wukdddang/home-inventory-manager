import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDeviceToken } from './user-device-token.entity';
import { UserDeviceTokenService } from './user-device-token.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserDeviceToken])],
  providers: [UserDeviceTokenService],
  exports: [UserDeviceTokenService],
})
export class UserDeviceTokenModule {}
