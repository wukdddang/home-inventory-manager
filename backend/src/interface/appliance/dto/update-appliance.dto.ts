import {
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class UpdateApplianceDto {
    @IsOptional()
    @IsUUID()
    roomId?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    modelName?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    serialNumber?: string | null;

    @IsOptional()
    @IsString()
    purchasedAt?: string | null;

    @IsOptional()
    @IsNumber()
    purchasePrice?: number | null;

    @IsOptional()
    @IsString()
    warrantyExpiresAt?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    manualUrl?: string | null;

    @IsOptional()
    @IsString()
    memo?: string | null;
}
