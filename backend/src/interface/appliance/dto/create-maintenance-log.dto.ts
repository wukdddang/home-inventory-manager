import {
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateMaintenanceLogDto {
    @IsOptional()
    @IsUUID()
    maintenanceScheduleId?: string;

    @IsString()
    @IsIn(['scheduled', 'repair', 'inspection', 'other'])
    type: 'scheduled' | 'repair' | 'inspection' | 'other';

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    description: string;

    @IsOptional()
    @IsUUID()
    householdMemberId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    servicedBy?: string;

    @IsOptional()
    @IsNumber()
    cost?: number;

    @IsString()
    @IsNotEmpty()
    performedAt: string;

    @IsOptional()
    @IsString()
    memo?: string;
}
