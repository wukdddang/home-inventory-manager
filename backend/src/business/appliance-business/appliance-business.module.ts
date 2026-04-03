import { Module } from '@nestjs/common';
import { ApplianceContextModule } from '../../context/appliance-context/appliance-context.module';
import { ApplianceBusinessService } from './appliance-business.service';

@Module({
    imports: [ApplianceContextModule],
    providers: [ApplianceBusinessService],
    exports: [ApplianceBusinessService],
})
export class ApplianceBusinessModule {}
