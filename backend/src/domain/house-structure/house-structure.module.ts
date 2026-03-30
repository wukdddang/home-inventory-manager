import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseStructure } from './house-structure.entity';
import { HouseStructureService } from './house-structure.service';

@Module({
  imports: [TypeOrmModule.forFeature([HouseStructure])],
  providers: [HouseStructureService],
  exports: [HouseStructureService],
})
export class HouseStructureModule {}
