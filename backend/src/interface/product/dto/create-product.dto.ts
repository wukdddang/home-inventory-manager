import {
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateProductDto {
    @IsUUID()
    categoryId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @IsBoolean()
    isConsumable: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    imageUrl?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
