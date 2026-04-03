import {
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecurrenceRuleDto } from './create-maintenance-schedule.dto';

export class UpdateMaintenanceScheduleDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    taskName?: string;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => RecurrenceRuleDto)
    recurrenceRule?: RecurrenceRuleDto;

    @IsOptional()
    @IsString()
    nextOccurrenceAt?: string;
}
