import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateConsumptionDto {
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
