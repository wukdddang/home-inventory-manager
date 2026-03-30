import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SyncRoomItemDto {
  @IsString()
  @MaxLength(100)
  structureRoomKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string | null;

  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class SyncRoomsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncRoomItemDto)
  rooms: SyncRoomItemDto[];
}
