import { Module } from '@nestjs/common';
import { SpaceContextModule } from '../../context/space-context/space-context.module';
import { SpaceBusinessService } from './space-business.service';

@Module({
  imports: [SpaceContextModule],
  providers: [SpaceBusinessService],
  exports: [SpaceBusinessService],
})
export class SpaceBusinessModule {}
