import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class KindDefinitionItemDto {
  @IsString()
  @MaxLength(50)
  kindId: string;

  @IsString()
  @MaxLength(100)
  label: string;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class SaveKindDefinitionsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => KindDefinitionItemDto)
  items: KindDefinitionItemDto[];
}
