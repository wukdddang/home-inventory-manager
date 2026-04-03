import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateApplianceDto {
    @IsOptional()
    @IsUUID()
    roomId?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    brand?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    modelName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    serialNumber?: string;

    @IsOptional()
    @IsString()
    purchasedAt?: string;

    @IsOptional()
    @IsNumber()
    purchasePrice?: number;

    @IsOptional()
    @IsString()
    warrantyExpiresAt?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    manualUrl?: string;

    @IsOptional()
    @IsString()
    memo?: string;
}
