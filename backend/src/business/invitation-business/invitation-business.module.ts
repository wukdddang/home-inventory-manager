import { Module } from '@nestjs/common';
import { InvitationContextModule } from '../../context/invitation-context/invitation-context.module';
import { InvitationBusinessService } from './invitation-business.service';

@Module({
  imports: [InvitationContextModule],
  providers: [InvitationBusinessService],
  exports: [InvitationBusinessService],
})
export class InvitationBusinessModule {}
