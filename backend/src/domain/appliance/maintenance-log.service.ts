import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceLog } from './maintenance-log.entity';

@Injectable()
export class MaintenanceLogDomainService {
    constructor(
        @InjectRepository(MaintenanceLog)
        private readonly logRepository: Repository<MaintenanceLog>,
    ) {}

    async 이력_목록을_조회한다(
        applianceId: string,
        type?: string,
    ): Promise<MaintenanceLog[]> {
        const where: any = { applianceId };
        if (type) where.type = type;

        return this.logRepository.find({
            where,
            order: { performedAt: 'DESC', createdAt: 'DESC' },
        });
    }

    async 이력을_단건_조회한다(
        id: string,
        applianceId: string,
    ): Promise<MaintenanceLog | null> {
        return this.logRepository.findOne({
            where: { id, applianceId },
        });
    }

    async 이력을_생성한다(data: {
        applianceId: string;
        maintenanceScheduleId?: string | null;
        type: MaintenanceLog['type'];
        description: string;
        householdMemberId?: string | null;
        servicedBy?: string | null;
        cost?: number | null;
        performedAt: string;
        memo?: string | null;
    }): Promise<MaintenanceLog> {
        const log = this.logRepository.create(data);
        return this.logRepository.save(log);
    }
}
