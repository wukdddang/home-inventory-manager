import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { MaintenanceSchedule } from './maintenance-schedule.entity';

@Injectable()
export class MaintenanceScheduleDomainService {
    constructor(
        @InjectRepository(MaintenanceSchedule)
        private readonly scheduleRepository: Repository<MaintenanceSchedule>,
    ) {}

    async 스케줄_목록을_조회한다(applianceId: string): Promise<MaintenanceSchedule[]> {
        return this.scheduleRepository.find({
            where: { applianceId },
            order: { createdAt: 'ASC' },
        });
    }

    async 스케줄을_단건_조회한다(
        id: string,
        applianceId: string,
    ): Promise<MaintenanceSchedule | null> {
        return this.scheduleRepository.findOne({
            where: { id, applianceId },
        });
    }

    async 스케줄을_생성한다(data: {
        applianceId: string;
        taskName: string;
        description?: string | null;
        recurrenceRule: MaintenanceSchedule['recurrenceRule'];
        nextOccurrenceAt: string;
    }): Promise<MaintenanceSchedule> {
        const schedule = this.scheduleRepository.create({
            ...data,
            isActive: true,
        });
        return this.scheduleRepository.save(schedule);
    }

    async 스케줄을_수정한다(
        id: string,
        applianceId: string,
        data: {
            taskName?: string;
            description?: string | null;
            recurrenceRule?: MaintenanceSchedule['recurrenceRule'];
            nextOccurrenceAt?: string;
        },
    ): Promise<MaintenanceSchedule | null> {
        const schedule = await this.스케줄을_단건_조회한다(id, applianceId);
        if (!schedule) return null;

        Object.assign(schedule, data);
        return this.scheduleRepository.save(schedule);
    }

    async 스케줄을_비활성화한다(
        id: string,
        applianceId: string,
    ): Promise<MaintenanceSchedule | null> {
        const schedule = await this.스케줄을_단건_조회한다(id, applianceId);
        if (!schedule) return null;

        schedule.isActive = false;
        return this.scheduleRepository.save(schedule);
    }

    async 다음_예정일을_갱신한다(
        id: string,
        nextOccurrenceAt: string,
    ): Promise<void> {
        await this.scheduleRepository.update(id, { nextOccurrenceAt });
    }

    async 예정일_도래한_활성_스케줄을_조회한다(
        today: string,
    ): Promise<MaintenanceSchedule[]> {
        return this.scheduleRepository.find({
            where: {
                isActive: true,
                nextOccurrenceAt: LessThanOrEqual(today),
            },
            relations: ['appliance'],
        });
    }
}
