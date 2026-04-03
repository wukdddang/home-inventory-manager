import { Test, TestingModule } from '@nestjs/testing';
import { BackupScheduler } from '@context/backup-context/backup.scheduler';
import { BackupService } from '@context/backup-context/backup.service';
import { BackupRetentionService } from '@context/backup-context/backup-retention.service';
import { BackupType } from '@context/backup-context/backup.types';

describe('BackupScheduler', () => {
  let scheduler: BackupScheduler;

  const mockBackupService = {
    백업생성한다: jest.fn(),
  };

  const mockRetentionService = {
    타입별보관정책적용한다: jest.fn(),
    전체보관정책적용한다: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupScheduler,
        { provide: BackupService, useValue: mockBackupService },
        { provide: BackupRetentionService, useValue: mockRetentionService },
      ],
    }).compile();

    scheduler = module.get<BackupScheduler>(BackupScheduler);

    // 기본 성공 응답
    mockBackupService.백업생성한다.mockResolvedValue({
      success: true,
      filename: 'backup_daily_20260403_010000.sql.gz',
      size: 1024,
    });
    mockRetentionService.타입별보관정책적용한다.mockResolvedValue({
      total: 5,
      deleted: 0,
      errors: 0,
    });
    mockRetentionService.전체보관정책적용한다.mockResolvedValue({
      total: 30,
      deleted: 2,
      errors: 0,
    });
  });

  describe('fourHourlyBackup', () => {
    it('FOUR_HOURLY 타입으로 백업을 수행해야 한다', async () => {
      await scheduler.fourHourlyBackup();

      expect(mockBackupService.백업생성한다).toHaveBeenCalledWith(
        BackupType.FOUR_HOURLY,
      );
    });

    it('백업 후 해당 타입의 보관 정책을 적용해야 한다', async () => {
      await scheduler.fourHourlyBackup();

      expect(
        mockRetentionService.타입별보관정책적용한다,
      ).toHaveBeenCalledWith(BackupType.FOUR_HOURLY);
    });
  });

  describe('dailyBackup', () => {
    it('DAILY 타입으로 백업을 수행해야 한다', async () => {
      await scheduler.dailyBackup();

      expect(mockBackupService.백업생성한다).toHaveBeenCalledWith(
        BackupType.DAILY,
      );
    });
  });

  describe('weeklyBackup', () => {
    it('WEEKLY 타입으로 백업을 수행해야 한다', async () => {
      await scheduler.weeklyBackup();

      expect(mockBackupService.백업생성한다).toHaveBeenCalledWith(
        BackupType.WEEKLY,
      );
    });
  });

  describe('monthlyBackup', () => {
    it('MONTHLY 타입으로 백업을 수행해야 한다', async () => {
      await scheduler.monthlyBackup();

      expect(mockBackupService.백업생성한다).toHaveBeenCalledWith(
        BackupType.MONTHLY,
      );
    });
  });

  describe('quarterlyBackup', () => {
    it('QUARTERLY 타입으로 백업을 수행해야 한다', async () => {
      await scheduler.quarterlyBackup();

      expect(mockBackupService.백업생성한다).toHaveBeenCalledWith(
        BackupType.QUARTERLY,
      );
    });
  });

  describe('yearlyBackup', () => {
    it('YEARLY 타입으로 백업을 수행해야 한다', async () => {
      await scheduler.yearlyBackup();

      expect(mockBackupService.백업생성한다).toHaveBeenCalledWith(
        BackupType.YEARLY,
      );
    });
  });

  describe('cleanupExpiredBackups', () => {
    it('전체 보관 정책을 적용해야 한다', async () => {
      await scheduler.cleanupExpiredBackups();

      expect(mockRetentionService.전체보관정책적용한다).toHaveBeenCalled();
    });

    it('정리 실패 시 에러를 던지지 않아야 한다', async () => {
      mockRetentionService.전체보관정책적용한다.mockRejectedValue(
        new Error('cleanup failed'),
      );

      await expect(
        scheduler.cleanupExpiredBackups(),
      ).resolves.not.toThrow();
    });
  });

  describe('백업 실패 처리', () => {
    it('백업이 실패해도 에러를 던지지 않아야 한다', async () => {
      mockBackupService.백업생성한다.mockResolvedValue({
        success: false,
        error: 'DB connection failed',
      });

      await expect(scheduler.dailyBackup()).resolves.not.toThrow();
    });

    it('백업 서비스에서 예외가 발생해도 에러를 던지지 않아야 한다', async () => {
      mockBackupService.백업생성한다.mockRejectedValue(
        new Error('unexpected error'),
      );

      await expect(scheduler.dailyBackup()).resolves.not.toThrow();
    });

    it('백업 성공 후 보관 정책 적용 실패 시에도 에러를 던지지 않아야 한다', async () => {
      mockRetentionService.타입별보관정책적용한다.mockRejectedValue(
        new Error('retention failed'),
      );

      await expect(scheduler.dailyBackup()).resolves.not.toThrow();
    });
  });
});
