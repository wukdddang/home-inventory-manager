import { Module } from '@nestjs/common';
import { UnitContextModule } from '../../context/unit-context/unit-context.module';
import { UnitBusinessService } from './unit-business.service';

@Module({
    imports: [UnitContextModule],
    providers: [UnitBusinessService],
    exports: [UnitBusinessService],
})
export class UnitBusinessModule {}
