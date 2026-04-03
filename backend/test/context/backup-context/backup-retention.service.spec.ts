import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BackupRetentionService } from '@context/backup-context/backup-retention.service';
import {
  BackupType,
  BACKUP_RETENTION,
} from '@context/backup-context/backup.types';
import * as fs from 'fs/promises';

jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('BackupRetentionService', () => {
  let service: BackupRetentionService;
  const backupPath = './test-backups';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupRetentionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'BACKUP_PATH') return backupPath;
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BackupRetentionService>(BackupRetentionService);
  });

  describe('타입별보관정책적용한다', () => {
    it('디렉토리가 없으면 빈 결과를 반환해야 한다', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await service.타입별보관정책적용한다(BackupType.DAILY);

      expect(result).toEqual({ total: 0, deleted: 0, errors: 0 });
    });

    it('만료된 백업 파일을 삭제해야 한다', async () => {
      const now = Date.now();
      const expiredTime = now - BACKUP_RETENTION[BackupType.DAILY] - 1000;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        'backup_daily_20250101_010000.sql.gz',
      ] as any);
      mockFs.stat.mockResolvedValue({ mtimeMs: expiredTime } as any);
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await service.타입별보관정책적용한다(BackupType.DAILY);

      expect(result.deleted).toBe(1);
      expect(mockFs.unlink).toHaveBeenCalledTimes(1);
    });

    it('보관 기간 내의 백업 파일은 삭제하지 않아야 한다', async () => {
      const now = Date.now();
      const recentTime = now - 1000; // 1초 전

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        'backup_daily_20260403_010000.sql.gz',
      ] as any);
      mockFs.stat.mockResolvedValue({ mtimeMs: recentTime } as any);

      const result = await service.타입별보관정책적용한다(BackupType.DAILY);

      expect(result.deleted).toBe(0);
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });

    it('백업 파일이 아닌 파일은 무시해야 한다', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        'readme.txt',
        '.gitkeep',
      ] as any);

      const result = await service.타입별보관정책적용한다(BackupType.DAILY);

      expect(result.deleted).toBe(0);
      expect(mockFs.stat).not.toHaveBeenCalled();
    });

    it('.sql, .sql.gz, .sql.xz 파일 모두 인식해야 한다', async () => {
      const now = Date.now();
      const expiredTime = now - BACKUP_RETENTION[BackupType.FOUR_HOURLY] - 1000;

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        'backup_four_hourly_20250101_000000.sql',
        'backup_four_hourly_20250101_040000.sql.gz',
        'backup_four_hourly_20250101_080000.sql.xz',
      ] as any);
      mockFs.stat.mockResolvedValue({ mtimeMs: expiredTime } as any);
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await service.타입별보관정책적용한다(
        BackupType.FOUR_HOURLY,
      );

      expect(result.deleted).toBe(3);
    });
  });

  describe('전체보관정책적용한다', () => {
    it('모든 백업 타입에 대해 정책을 적용해야 한다', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await service.전체보관정책적용한다();

      expect(result).toEqual({ total: 0, deleted: 0, errors: 0 });
      // 각 BackupType마다 access 호출
      expect(mockFs.access).toHaveBeenCalledTimes(
        Object.values(BackupType).length,
      );
    });

    it('여러 타입에 걸친 삭제 결과를 합산해야 한다', async () => {
      const now = Date.now();

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        'backup_dummy_20250101_010000.sql.gz',
      ] as any);
      mockFs.stat.mockResolvedValue({
        mtimeMs: now - 10 * 365 * 24 * 60 * 60 * 1000,
      } as any); // 10년 전 → 모든 타입에서 만료
      mockFs.unlink.mockResolvedValue(undefined);

      const result = await service.전체보관정책적용한다();

      expect(result.deleted).toBe(Object.values(BackupType).length);
    });
  });

  describe('백업목록조회한다', () => {
    it('특정 타입의 백업 목록을 조회해야 한다', async () => {
      const now = Date.now();

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        'backup_daily_20260403_010000.sql.gz',
        'backup_daily_20260402_010000.sql.gz',
      ] as any);
      mockFs.stat
        .mockResolvedValueOnce({
          mtime: new Date(now),
          mtimeMs: now,
        } as any)
        .mockResolvedValueOnce({
          mtime: new Date(now - 86400000),
          mtimeMs: now - 86400000,
        } as any);

      const backups = await service.백업목록조회한다(BackupType.DAILY);

      expect(backups).toHaveLength(2);
      expect(backups[0].type).toBe(BackupType.DAILY);
      // 최신순 정렬 확인
      expect(backups[0].createdAt.getTime()).toBeGreaterThan(
        backups[1].createdAt.getTime(),
      );
    });

    it('타입 미지정 시 모든 타입의 백업을 조회해야 한다', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const backups = await service.백업목록조회한다();

      expect(backups).toHaveLength(0);
      expect(mockFs.access).toHaveBeenCalledTimes(
        Object.values(BackupType).length,
      );
    });

    it('만료일이 올바르게 계산되어야 한다', async () => {
      const now = Date.now();

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([
        'backup_weekly_20260401_013000.sql.gz',
      ] as any);
      mockFs.stat.mockResolvedValue({
        mtime: new Date(now),
        mtimeMs: now,
      } as any);

      const backups = await service.백업목록조회한다(BackupType.WEEKLY);

      expect(backups[0].expiresAt.getTime()).toBe(
        now + BACKUP_RETENTION[BackupType.WEEKLY],
      );
    });
  });

  describe('통계조회한다', () => {
    it('타입별 백업 통계를 반환해야 한다', async () => {
      const now = Date.now();

      // daily 디렉토리만 있는 것으로 설정
      mockFs.access.mockImplementation(async (dirPath: any) => {
        if (String(dirPath).includes('daily')) return undefined;
        throw new Error('ENOENT');
      });
      mockFs.readdir.mockResolvedValue([
        'backup_daily_20260403_010000.sql.gz',
      ] as any);
      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(now),
      } as any);

      const stats = await service.통계조회한다();

      expect(stats.byType[BackupType.DAILY].count).toBe(1);
      expect(stats.byType[BackupType.DAILY].totalSize).toBe(1024);
      expect(stats.total.count).toBe(1);
      expect(stats.total.totalSize).toBe(1024);
      expect(stats.byType[BackupType.WEEKLY].count).toBe(0);
    });
  });
});
