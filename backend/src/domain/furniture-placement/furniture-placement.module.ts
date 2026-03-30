import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FurniturePlacement } from './furniture-placement.entity';
import { FurniturePlacementService } from './furniture-placement.service';

@Module({
  imports: [TypeOrmModule.forFeature([FurniturePlacement])],
  providers: [FurniturePlacementService],
  exports: [FurniturePlacementService],
})
export class FurniturePlacementModule {}
