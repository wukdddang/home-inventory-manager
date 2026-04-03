import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appliance } from './appliance.entity';
import { MaintenanceSchedule } from './maintenance-schedule.entity';
import { MaintenanceLog } from './maintenance-log.entity';
import { ApplianceDomainService } from './appliance.service';
import { MaintenanceScheduleDomainService } from './maintenance-schedule.service';
import { MaintenanceLogDomainService } from './maintenance-log.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Appliance,
            MaintenanceSchedule,
            MaintenanceLog,
        ]),
    ],
    providers: [
        ApplianceDomainService,
        MaintenanceScheduleDomainService,
        MaintenanceLogDomainService,
    ],
    exports: [
        ApplianceDomainService,
        MaintenanceScheduleDomainService,
        MaintenanceLogDomainService,
    ],
})
export class ApplianceDomainModule {}
