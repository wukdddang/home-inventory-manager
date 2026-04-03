import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BackupType, BACKUP_RETENTION, BackupMetadata } from './backup.types';

/**
 * 백업 보관 정책 관리 서비스
 *
 * 각 백업 타입별로 보관 기간을 관리하고 오래된 백업을 삭제합니다.
 */
@Injectable()
export class BackupRetentionService {
  private readonly logger = new Logger(BackupRetentionService.name);
  private readonly backupPath: string;

  constructor(private readonly configService: ConfigService) {
    this.backupPath = this.configService.get<string>(
      'BACKUP_PATH',
      './backups/database',
    );
  }

  /**
   * 모든 백업 타입에 대해 보관 정책을 적용합니다.
   */
  async 전체보관정책적용한다(): Promise<{
    total: number;
    deleted: number;
    errors: number;
  }> {
    this.logger.log('백업 보관 정책 적용 시작');

    const results = { total: 0, deleted: 0, errors: 0 };

    for (const type of Object.values(BackupType)) {
      try {
        const result = await this.타입별보관정책적용한다(type);
        results.total += result.total;
        results.deleted += result.deleted;
        results.errors += result.errors;
      } catch (error: any) {
        this.logger.error(
          `백업 타입 ${type} 보관 정책 적용 실패: ${error.message}`,
          error.stack,
        );
        results.errors++;
      }
    }

    this.logger.log(
      `백업 보관 정책 적용 완료 - 총 ${results.total}개 중 ${results.deleted}개 삭제 (에러: ${results.errors})`,
    );

    return results;
  }

  /**
   * 특정 백업 타입에 대해 보관 정책을 적용합니다.
   */
  async 타입별보관정책적용한다(
    type: BackupType,
  ): Promise<{ total: number; deleted: number; errors: number }> {
    const typeDir = path.join(this.backupPath, type);
    const retentionPeriod = BACKUP_RETENTION[type];
    const now = Date.now();
    const results = { total: 0, deleted: 0, errors: 0 };

    try {
      await fs.access(typeDir);
    } catch {
      this.logger.debug(`백업 디렉토리가 없습니다: ${typeDir}`);
      return results;
    }

    try {
      const files = await fs.readdir(typeDir);
      results.total = files.length;

      for (const file of files) {
        if (!this.isBackupFile(file)) continue;

        const filePath = path.join(typeDir, file);

        try {
          const stats = await fs.stat(filePath);
          const age = now - stats.mtimeMs;

          if (age > retentionPeriod) {
            await fs.unlink(filePath);
            results.deleted++;
            this.logger.log(
              `만료된 백업 삭제: ${type}/${file} (나이: ${this.formatDuration(age)})`,
            );
          }
        } catch (error: any) {
          this.logger.error(
            `백업 파일 처리 실패: ${filePath} - ${error.message}`,
          );
          results.errors++;
        }
      }

      if (results.deleted > 0) {
        this.logger.log(
          `${type} 백업 정리 완료: ${results.deleted}/${results.total}개 삭제`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `백업 디렉토리 읽기 실패: ${typeDir} - ${error.message}`,
        error.stack,
      );
      results.errors++;
    }

    return results;
  }

  /**
   * 특정 백업 타입의 백업 목록을 조회합니다.
   */
  async 백업목록조회한다(type?: BackupType): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];
    const types = type ? [type] : Object.values(BackupType);

    for (const backupType of types) {
      const typeDir = path.join(this.backupPath, backupType);

      try {
        await fs.access(typeDir);
      } catch {
        continue;
      }

      try {
        const files = await fs.readdir(typeDir);

        for (const file of files) {
          if (!this.isBackupFile(file)) continue;

          const filePath = path.join(typeDir, file);
          const stats = await fs.stat(filePath);
          const createdAt = new Date(stats.mtime);
          const expiresAt = new Date(
            stats.mtimeMs + BACKUP_RETENTION[backupType],
          );

          backups.push({
            type: backupType,
            filename: file,
            createdAt,
            expiresAt,
          });
        }
      } catch (error: any) {
        this.logger.error(
          `백업 목록 조회 실패: ${typeDir} - ${error.message}`,
        );
      }
    }

    return backups.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  /**
   * 백업 통계를 조회합니다.
   */
  async 통계조회한다(): Promise<{
    byType: Record<
      BackupType,
      { count: number; totalSize: number; oldestBackup: Date | null }
    >;
    total: { count: number; totalSize: number };
  }> {
    const stats = {
      byType: {} as Record<
        BackupType,
        { count: number; totalSize: number; oldestBackup: Date | null }
      >,
      total: { count: 0, totalSize: 0 },
    };

    for (const type of Object.values(BackupType)) {
      stats.byType[type] = { count: 0, totalSize: 0, oldestBackup: null };

      const typeDir = path.join(this.backupPath, type);

      try {
        await fs.access(typeDir);
      } catch {
        continue;
      }

      try {
        const files = await fs.readdir(typeDir);

        for (const file of files) {
          if (!this.isBackupFile(file)) continue;

          const filePath = path.join(typeDir, file);
          const fileStats = await fs.stat(filePath);

          stats.byType[type].count++;
          stats.byType[type].totalSize += fileStats.size;

          if (
            !stats.byType[type].oldestBackup ||
            fileStats.mtime < stats.byType[type].oldestBackup
          ) {
            stats.byType[type].oldestBackup = fileStats.mtime;
          }

          stats.total.count++;
          stats.total.totalSize += fileStats.size;
        }
      } catch (error: any) {
        this.logger.error(
          `백업 통계 조회 실패: ${typeDir} - ${error.message}`,
        );
      }
    }

    return stats;
  }

  private isBackupFile(filename: string): boolean {
    return (
      filename.endsWith('.sql') ||
      filename.endsWith('.sql.gz') ||
      filename.endsWith('.sql.xz')
    );
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일`;
    if (hours > 0) return `${hours}시간`;
    if (minutes > 0) return `${minutes}분`;
    return `${seconds}초`;
  }
}
