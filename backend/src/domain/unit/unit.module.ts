import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './unit.entity';
import { UnitService } from './unit.service';

@Module({
    imports: [TypeOrmModule.forFeature([Unit])],
    providers: [UnitService],
    exports: [UnitService],
})
export class UnitModule {}
