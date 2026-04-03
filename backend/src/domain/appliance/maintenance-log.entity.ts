import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Appliance } from './appliance.entity';
import { MaintenanceSchedule } from './maintenance-schedule.entity';

@Entity('maintenance_logs')
export class MaintenanceLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    applianceId: string;

    @ManyToOne(() => Appliance, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applianceId' })
    appliance: Appliance;

    @Column({ type: 'uuid', nullable: true })
    maintenanceScheduleId: string | null;

    @ManyToOne(() => MaintenanceSchedule, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'maintenanceScheduleId' })
    maintenanceSchedule: MaintenanceSchedule | null;

    @Column({ type: 'varchar', length: 20 })
    type: 'scheduled' | 'repair' | 'inspection' | 'other';

    @Column({ type: 'varchar', length: 200 })
    description: string;

    @Column({ type: 'uuid', nullable: true })
    householdMemberId: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    servicedBy: string | null;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    cost: number | null;

    @Column({ type: 'date' })
    performedAt: string;

    @Column({ type: 'text', nullable: true })
    memo: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
