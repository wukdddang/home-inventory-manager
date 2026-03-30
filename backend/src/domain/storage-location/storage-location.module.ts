import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageLocation } from './storage-location.entity';
import { StorageLocationService } from './storage-location.service';

@Module({
  imports: [TypeOrmModule.forFeature([StorageLocation])],
  providers: [StorageLocationService],
  exports: [StorageLocationService],
})
export class StorageLocationModule {}
