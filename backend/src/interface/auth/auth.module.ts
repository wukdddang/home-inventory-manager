import { Module } from '@nestjs/common';
import { AuthBusinessModule } from '../../business/auth-business/auth-business.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [AuthBusinessModule],
  controllers: [AuthController],
})
export class AuthInterfaceModule {}
