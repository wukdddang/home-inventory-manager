import {
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecurrenceRuleDto {
    @IsString()
    @IsNotEmpty()
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';

    @IsNotEmpty()
    interval: number;

    @IsOptional()
    dayOfMonth?: number;

    @IsOptional()
    dayOfWeek?: number;

    @IsOptional()
    monthOfYear?: number;
}

export class CreateMaintenanceScheduleDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    taskName: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsObject()
    @ValidateNested()
    @Type(() => RecurrenceRuleDto)
    recurrenceRule: RecurrenceRuleDto;

    @IsString()
    @IsNotEmpty()
    nextOccurrenceAt: string;
}
