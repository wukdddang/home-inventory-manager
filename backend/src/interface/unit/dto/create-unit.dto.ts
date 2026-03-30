import {
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateUnitDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    symbol: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsInt()
    sortOrder?: number;
}
