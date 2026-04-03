import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupRetentionService } from './backup-retention.service';
import { BackupScheduler } from './backup.scheduler';

@Module({
  providers: [BackupService, BackupRetentionService, BackupScheduler],
  exports: [BackupService, BackupRetentionService],
})
export class BackupContextModule {}
