import { Module } from '@nestjs/common';
import { AuthContextModule } from '../../context/auth-context/auth-context.module';
import { AuthBusinessService } from './auth-business.service';

@Module({
  imports: [AuthContextModule],
  providers: [AuthBusinessService],
  exports: [AuthBusinessService],
})
export class AuthBusinessModule {}
