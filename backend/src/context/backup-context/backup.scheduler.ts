import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupRetentionService } from './backup-retention.service';
import { BackupType } from './backup.types';

/**
 * 백업 스케줄러
 *
 * GFS (Grandfather-Father-Son) 백업 전략을 구현합니다:
 * - 4시간마다: 7일 보관
 * - 매일 01:00: 30일 보관
 * - 매주 일요일 01:30: 90일 보관
 * - 매월 1일 02:00: 1년 보관
 * - 분기 첫날 03:00: 2년 보관
 * - 매년 1/1 04:00: 5년 보관
 */
@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly retentionService: BackupRetentionService,
  ) {}

  /**
   * 4시간마다 백업 수행 (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
   */
  @Cron('0 */4 * * *')
  async fourHourlyBackup() {
    this.logger.log('4시간 백업 시작');
    await this.performBackup(BackupType.FOUR_HOURLY);
  }

  /**
   * 매일 새벽 1시 백업 수행
   */
  @Cron('0 1 * * *')
  async dailyBackup() {
    this.logger.log('일간 백업 시작');
    await this.performBackup(BackupType.DAILY);
  }

  /**
   * 매주 일요일 새벽 1시 30분 백업 수행
   */
  @Cron('30 1 * * 0')
  async weeklyBackup() {
    this.logger.log('주간 백업 시작');
    await this.performBackup(BackupType.WEEKLY);
  }

  /**
   * 매월 1일 새벽 2시 백업 수행
   */
  @Cron('0 2 1 * *')
  async monthlyBackup() {
    this.logger.log('월간 백업 시작');
    await this.performBackup(BackupType.MONTHLY);
  }

  /**
   * 매 분기 첫날 새벽 3시 백업 수행 (1/1, 4/1, 7/1, 10/1)
   */
  @Cron('0 3 1 1,4,7,10 *')
  async quarterlyBackup() {
    this.logger.log('분기 백업 시작');
    await this.performBackup(BackupType.QUARTERLY);
  }

  /**
   * 매년 1월 1일 새벽 4시 백업 수행
   */
  @Cron('0 4 1 1 *')
  async yearlyBackup() {
    this.logger.log('연간 백업 시작');
    await this.performBackup(BackupType.YEARLY);
  }

  /**
   * 매일 새벽 5시 보관 정책 적용 (오래된 백업 삭제)
   */
  @Cron('0 5 * * *')
  async cleanupExpiredBackups() {
    this.logger.log('만료된 백업 정리 시작');
    try {
      const result = await this.retentionService.전체보관정책적용한다();
      this.logger.log(
        `만료된 백업 정리 완료 - 총 ${result.total}개 중 ${result.deleted}개 삭제 (에러: ${result.errors})`,
      );
    } catch (error: any) {
      this.logger.error(
        `만료된 백업 정리 실패: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * 백업 수행 후, 해당 타입의 보관 정책을 즉시 적용합니다.
   */
  private async performBackup(type: BackupType): Promise<void> {
    try {
      const result = await this.backupService.백업생성한다(type);

      if (result.success) {
        this.logger.log(
          `${type} 백업 성공: ${result.filename} (${this.formatBytes(result.size)})`,
        );

        try {
          const retention =
            await this.retentionService.타입별보관정책적용한다(type);
          if (retention.deleted > 0) {
            this.logger.log(
              `${type} 만료 백업 정리: ${retention.deleted}개 삭제`,
            );
          }
        } catch (retentionError: any) {
          this.logger.error(
            `${type} 보관 정책 적용 실패: ${retentionError.message}`,
          );
        }
      } else {
        this.logger.error(`${type} 백업 실패: ${result.error}`);
      }
    } catch (error: any) {
      this.logger.error(
        `${type} 백업 중 오류 발생: ${error.message}`,
        error.stack,
      );
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
