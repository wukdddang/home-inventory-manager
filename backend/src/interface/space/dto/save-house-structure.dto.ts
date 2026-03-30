import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveHouseStructureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsObject()
  structurePayload: Record<string, any>;

  @IsOptional()
  @IsObject()
  diagramLayout?: Record<string, any> | null;
}
