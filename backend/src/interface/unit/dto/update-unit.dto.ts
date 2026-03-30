import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUnitDto {
    @IsOptional()
    @IsString()
    @MaxLength(20)
    symbol?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsInt()
    sortOrder?: number;
}
