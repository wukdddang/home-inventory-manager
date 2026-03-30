import { IsUUID } from 'class-validator';

export class CopyUnitsDto {
    @IsUUID()
    sourceHouseholdId: string;
}
