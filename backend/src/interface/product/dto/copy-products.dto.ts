import { IsUUID } from 'class-validator';

export class CopyProductsDto {
    @IsUUID()
    sourceHouseholdId: string;
}
