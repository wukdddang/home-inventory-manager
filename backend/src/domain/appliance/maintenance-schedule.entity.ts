import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { Appliance } from './appliance.entity';

@Entity('maintenance_schedules')
export class MaintenanceSchedule extends BaseEntity {
    @Column({ type: 'uuid' })
    applianceId: string;

    @ManyToOne(() => Appliance, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applianceId' })
    appliance: Appliance;

    @Column({ type: 'varchar', length: 100 })
    taskName: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'jsonb' })
    recurrenceRule: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number;
        dayOfMonth?: number;
        dayOfWeek?: number;
        monthOfYear?: number;
    };

    @Column({ type: 'date' })
    nextOccurrenceAt: string;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;
}
